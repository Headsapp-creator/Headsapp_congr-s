import { PrismaClient } from "@prisma/client";
import QRCode from "qrcode";
import cloudinary from "../utils/cloudinary.js";

const prisma = new PrismaClient();

const updateEventCapacity = async (eventId) => {
  const programmes = await prisma.programme.findMany({
    where: { eventId },
    select: { capacity: true },
  });

  const totalCapacity = programmes.reduce((sum, programme) => sum + (programme.capacity || 0), 0);

  await prisma.event.update({
    where: { id: eventId },
    data: { capacity: totalCapacity },
  });
};

function getCurrentEventPrice(event, userSpecialty) {
  if (event.pricingSteps && typeof event.pricingSteps === 'object') {
    const steps = event.pricingSteps[userSpecialty] || [];
    const now = new Date();
    const sortedSteps = [...steps].sort((a, b) => {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline) - new Date(b.deadline);
    });
    for (const step of sortedSteps) {
      if (!step.deadline || now <= new Date(step.deadline)) {
        return step.price;
      }
    }
    return sortedSteps.length > 0 ? sortedSteps[sortedSteps.length - 1].price : null;
  }
  // fallback...
  return null;
}

export const getEvents = async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      select: {
        id: true,
        nom: true,
        status: true,
        dateDebut: true,
        capacity: true,
        pricingSteps: true,
        selectedAttributes: true,
        activityOptions: true,
        image: true,
      },
    });

    // Get user specialty from req.user if available
    const userSpecialty = req.user?.specialite || null;

    const eventsWithParticipants = await Promise.all(
      events.map(async (event) => {
        const participantCount = await prisma.participantProgramme.count({
          where: { eventId: event.id },
        });

        const price = getCurrentEventPrice(event, userSpecialty);

        return {
          id: event.id,
          nom: event.nom,
          status: event.status,
          dateDebut: event.dateDebut,
          capacity: event.capacity,
          participantCount,
          price,
          pricingSteps: event.pricingSteps || {},
          selectedAttributes: event.selectedAttributes || [],
          activityOptions: event.activityOptions || [],
          image: event.image,
        };
      })
    );

    res.json(eventsWithParticipants);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

export const getEventById = async (req, res) => {
  const { id } = req.params;
  try {
    // Update capacity in real time before fetching the event
    await updateEventCapacity(id);

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        programmes: true, 
      },
    });

    if (!event) return res.status(404).json({ error: "Event not found" });

    const price = getCurrentEventPrice(event);

    res.json({
      ...event,
      price, 
      programmes: event.programmes,
      activityOptions: event.activityOptions,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch event" });
  }
};

export const createEvent = async (req, res) => {
  try {
    const { nom, dateDebut, dateFin, description, image, workshops, selectedAttributes, pricingSteps, activityOptions } = req.body;

    // Validate required fields
    if (!nom || !dateDebut || !dateFin || !description || !image) {
      return res.status(400).json({ error: "All fields except workshops are required" });
    }

    if (!Array.isArray(workshops) || workshops.length === 0) {
      return res.status(400).json({ error: "At least one workshop is required" });
    }

    if (!Array.isArray(selectedAttributes)) {
      return res.status(400).json({ error: "selectedAttributes must be an array" });
    }
    if (!Array.isArray(activityOptions)) {
      return res.status(400).json({ error: "activityOptions must be an array" });
    }
    // Calculate total capacity for the event
    const totalCapacity = workshops.reduce((sum, workshop) => sum + (workshop.capacity || 0), 0);

    // Create the event
    const newEvent = await prisma.event.create({
      data: {
        nom,
        dateDebut: new Date(dateDebut),
        dateFin: new Date(dateFin),
        description,
        image,
        capacity: totalCapacity,
        selectedAttributes, // Array of objects with optional condition
        pricingSteps: pricingSteps ? pricingSteps : undefined,
        activityOptions: activityOptions ? activityOptions : undefined, 
        programmes: {
          create: workshops.map((workshop) => ({
            nom: workshop.nom,
            description: workshop.description,
            capacity: parseInt(workshop.capacity, 10) || 0,
            price: workshop.price ? parseFloat(workshop.price) : null,
          })),
        },
      },
      include: {
        programmes: true,
      },
    });

    res.status(201).json({
      ...newEvent,
      participantCount: newEvent.participantCount || 0, 
    });
  } catch (error) {
    console.error("Create Event Error:", error);
    res.status(500).json({ error: "Failed to create event with workshops" });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, dateDebut, dateFin } = req.body;

    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    const existingEvent = await prisma.event.findUnique({ where: { id } });

    if (!existingEvent) {
      return res.status(404).json({ error: "Event not found" });
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        status: status !== undefined ? status : existingEvent.status,
        dateDebut: dateDebut !== undefined ? new Date(dateDebut) : existingEvent.dateDebut,
        dateFin: dateFin !== undefined ? new Date(dateFin) : existingEvent.dateFin,
        updatedAt: new Date(),
      },
    });

    // Update capacity in real time after updating the event
    await updateEventCapacity(id);

    res.json(updatedEvent);
  } catch (error) {
    res.status(500).json({ error: "Failed to update event" });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    await prisma.event.delete({ where: { id } });

    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete event" });
  }
};

export const subscribeToEvent = async (req, res) => {
  const { eventId } = req.params;
  let { programmeIds, formData } = req.body;
  const userId = req.user?.id;

  // Parse JSON fields if sent as multipart/form-data
  if (typeof programmeIds === "string") programmeIds = JSON.parse(programmeIds);
  if (typeof formData === "string") formData = JSON.parse(formData);

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized - User ID is missing" });
  }

  if (!programmeIds || !Array.isArray(programmeIds)) {
    return res.status(400).json({ error: "programmeIds must be an array" });
  }

  let takeoverDocumentUrl = null;

  try {
    // Upload takeover document if takeover is "yes" and file is present
    if (formData?.takeover === "yes" && req.file) {
      // Upload to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "takeover_documents" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(req.file.buffer);
      });
      takeoverDocumentUrl = uploadResult.secure_url;
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!event || !user) {
      return res.status(404).json({ error: "Event or user not found" });
    }
    // Fetch selected programmes
    const programmes = await prisma.programme.findMany({
      where: { id: { in: programmeIds } },
    });
    // Calculate event price
    let now = new Date();
    let eventPrice = 0;
    if (event.priceEarly != null && event.priceLate != null && event.priceDeadline) {
      eventPrice = now <= event.priceDeadline ? event.priceEarly : event.priceLate;
    }

    // Calculate total workshop price
    let workshopsPrice = 0;
    for (const prog of programmes) {
      if (prog.price != null) {
        workshopsPrice += prog.price;
      }
    }

    const totalPrice = eventPrice + workshopsPrice;

    let participantProgramme = await prisma.participantProgramme.findUnique({
      where: { participantId_eventId: { participantId: userId, eventId } },
    });

    if (!participantProgramme) {
      participantProgramme = await prisma.participantProgramme.create({
        data: {
          participantId: userId,
          eventId: eventId,
          programmeIds: programmeIds,
          formData: formData || {},
          takeoverDocumentUrl, // Save the URL if present
        },
      });
    } else {
      const updatedProgrammeIds = Array.from(
        new Set([...participantProgramme.programmeIds, ...programmeIds])
      );

      participantProgramme = await prisma.participantProgramme.update({
        where: { id: participantProgramme.id },
        data: {
          programmeIds: updatedProgrammeIds,
          formData: formData || participantProgramme.formData,
          takeoverDocumentUrl: takeoverDocumentUrl || participantProgramme.takeoverDocumentUrl,
        },
      });
    }

    const userProgrammes = await prisma.programme.findMany({
      where: { id: { in: participantProgramme.programmeIds } },
      select: { nom: true },
    });

    const qrData = {
      userId: user.id,
      eventId: event.id,
      user: `${user.prenom} ${user.nom}`,
      event: event.nom,
      workshops: userProgrammes.map((p) => p.nom),
    };

    const qrCodeBase64 = await QRCode.toDataURL(JSON.stringify(qrData));

    const uploadResult = await cloudinary.uploader.upload(qrCodeBase64, {
      folder: "badges",
      public_id: `badge_${user.id}_${eventId}`,
      overwrite: true,
    });

    const badge = await prisma.badge.upsert({
      where: {
        utilisateurId_eventId: {
          utilisateurId: user.id,
          eventId: eventId,
        },
      },
      update: {
        nom: `Badge for ${event.nom}`,
        description: `Access badge for ${event.nom}`,
        imageUrl: uploadResult.secure_url,
      },
      create: {
        nom: `Badge for ${event.nom}`,
        description: `Access badge for ${event.nom}`,
        imageUrl: uploadResult.secure_url,
        utilisateurId: user.id,
        eventId: eventId,
      },
    });

    res.status(201).json({
      message: "Subscribed successfully",
      badge,
      totalPrice,
      takeoverDocumentUrl,
    });
  } catch (error) {
    console.error("Subscribe error:", error);
    res.status(500).json({ error: "Failed to subscribe to event" });
  }
};

export const getUserBadges = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized - No user found" });
    }

    const badges = await prisma.badge.findMany({
      where: {
        utilisateurId: userId,
      },
    });

    if (badges.length === 0) {
      return res.status(404).json({ message: "No badges found for this user" });
    }

    return res.status(200).json({ badges });
  } catch (error) {
    console.error("Error fetching badges: ", error);
    return res.status(500).json({ error: "Server error while fetching badges" });
  }
};

export const getEventPrograms = async (req, res) => {
  const { eventId } = req.params;

  try {

    // Fetch the event and include its programmes (only IDs)
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        programmes: true, // Only fetch the programme IDs
      },
    });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (!event.programmes || event.programmes.length === 0) {
      return res.status(404).json({ error: "No programs found for this event" });
    }

    // Fetch detailed information about the programs
    const programIds = event.programmes.map((program) => program.id); // Extract program IDs
    const programs = await prisma.programme.findMany({
      where: { id: { in: programIds } },
      select: {
        id: true,
        nom: true,
        capacity: true,
      },
    });

    // Calculate progress for each program
    const programsWithProgress = await Promise.all(
      programs.map(async (program) => {
        const participantCount = await prisma.participantProgramme.count({
          where: {
            programmeIds: { has: program.id },
          },
        });

        return {
          name: program.nom,
          progress:
            program.capacity > 0
              ? Math.round((participantCount / program.capacity) * 100)
              : 0,
        };
      })
    );

    res.json(programsWithProgress);
  } catch (error) {
    console.error("Error fetching programs:", error);
    res.status(500).json({ error: "Failed to fetch programs" });
  }
};



