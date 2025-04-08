import { PrismaClient } from "@prisma/client";
import QRCode from "qrcode";
import cloudinary from "../utils/cloudinary.js";

const prisma = new PrismaClient();

export const getEvents = async (req, res) => {
  try {
    const events = await prisma.event.findMany();
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch events" });
  }
  };

export const getEventById = async (req, res) => {
  const { id } = req.params;
  try {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return res.status(404).json({ error: "Event not found" });
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch event" });
  }
  };

export const createEvent = async (req, res) => {
  try {
    const { nom, dateDebut, dateFin, description, image } = req.body; 

    if (!nom || !dateDebut || !dateFin || !description || !image) {
      return res.status(400).json({ error: "All fields except status  are required" });
    }

    const newEvent = await prisma.event.create({
      data: {
        nom,
        dateDebut: new Date(dateDebut), 
        dateFin: new Date(dateFin), 
        description,
        image, 
      }
    });

    res.status(201).json(newEvent);
  } catch (error) {
    console.error("Create Event Error:", error); 
    res.status(500).json({ error: "Failed to create event" });
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
    const { programmeIds } = req.body;
  
    const userId = req.userId;
  
    if (!programmeIds || !Array.isArray(programmeIds)) {
      return res.status(400).json({ error: "programmeIds must be an array" });
    }
  
    try {
      const event = await prisma.event.findUnique({ where: { id: eventId } });
      const user = await prisma.user.findUnique({ where: { id: userId } });
  
      if (!event || !user) return res.status(404).json({ error: "Event or user not found" });
  
      let participantProgramme = await prisma.participantProgramme.findUnique({
        where: { participantId_eventId: { participantId: userId, eventId } }
      });
  
      if (!participantProgramme) {
        participantProgramme = await prisma.participantProgramme.create({
          data: {
            participantId: userId,
            eventId: eventId,
            programmeIds: programmeIds,  
          },
        });
      } else {
        const updatedProgrammeIds = Array.from(new Set([...participantProgramme.programmeIds, ...programmeIds]));
  
        participantProgramme = await prisma.participantProgramme.update({
          where: { id: participantProgramme.id },
          data: { programmeIds: updatedProgrammeIds }, 
        });
      }
  
      const programmes = await prisma.programme.findMany({
        where: { id: { in: participantProgramme.programmeIds } },
        select: { nom: true }
      });
  
      const qrData = {
        user: `${user.prenom} ${user.nom}`,
        event: event.nom,
        workshops: programmes.map(p => p.nom),
      };
  
      const qrCodeBase64 = await QRCode.toDataURL(JSON.stringify(qrData));
  
      const uploadResult = await cloudinary.uploader.upload(qrCodeBase64, {
        folder: "badges",
        public_id: `badge_${user.id}_${eventId}`,
        overwrite: true
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
        utilisateurId: userId  
      }
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

  