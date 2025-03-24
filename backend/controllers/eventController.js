import { PrismaClient } from "@prisma/client";

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
    const { nom, dateDebut, dateFin, description, image } = req.body; // Added image field

    // Validate required fields
    if (!nom || !dateDebut || !dateFin || !description || !image) {
      return res.status(400).json({ error: "All fields except status  are required" });
    }

    // Create new event with the image
    const newEvent = await prisma.event.create({
      data: {
        nom,
        dateDebut: new Date(dateDebut), // Convert to Date
        dateFin: new Date(dateFin), // Convert to Date
        description,
        image, 
      }
    });

    res.status(201).json(newEvent);
  } catch (error) {
    console.error("Create Event Error:", error); // Log error details
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
