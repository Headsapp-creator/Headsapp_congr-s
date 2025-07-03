import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper function to update event capacity
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

export const getProgrammes = async (req, res) => {
  try {
    const programmes = await prisma.programme.findMany();
    res.json(programmes);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch programmes" });
  }
};

export const getProgrammeById = async (req, res) => {
  const { id } = req.params;
  try {
    const programme = await prisma.programme.findUnique({
      where: { id },
    });
    if (!programme) return res.status(404).json({ error: "Programme not found" });
    res.json(programme);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch programme" });
  }
};

export const createProgramme = async (req, res) => {
  const { nom, description, eventId, capacity } = req.body;

  // Validate required fields
  if (!nom || !description || !eventId || capacity == null) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const newProgramme = await prisma.programme.create({
      data: {
        nom,
        description,
        eventId,
        capacity,
      },
    });

    // Update event capacity
    await updateEventCapacity(eventId);

    res.status(201).json(newProgramme);
  } catch (error) {
    console.error("Create Programme Error:", error);
    res.status(500).json({ error: "Failed to create programme" });
  }
};

export const updateProgramme = async (req, res) => {
  const { id } = req.params;
  const { nom, description, eventId, capacity, locationId } = req.body;

  try {
    const existingProgramme = await prisma.programme.findUnique({
      where: { id },
    });

    if (!existingProgramme) return res.status(404).json({ error: "Programme not found" });

    const updatedProgramme = await prisma.programme.update({
      where: { id },
      data: {
        nom: nom || existingProgramme.nom,
        description: description || existingProgramme.description,
        eventId: eventId || existingProgramme.eventId,
        capacity: capacity != null ? capacity : existingProgramme.capacity,
        locationId: locationId || existingProgramme.locationId,
      },
    });

    // Update event capacity if eventId or capacity is modified
    if (eventId || capacity != null) {
      await updateEventCapacity(eventId || existingProgramme.eventId);
    }

    res.json(updatedProgramme);
  } catch (error) {
    res.status(500).json({ error: "Failed to update programme" });
  }
};

export const deleteProgramme = async (req, res) => {
  const { id } = req.params;

  try {
    const existingProgramme = await prisma.programme.findUnique({
      where: { id },
    });

    if (!existingProgramme) return res.status(404).json({ error: "Programme not found" });

    await prisma.programme.delete({ where: { id } });

    // Update event capacity
    await updateEventCapacity(existingProgramme.eventId);

    res.json({ message: "Programme deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete programme" });
  }
};

