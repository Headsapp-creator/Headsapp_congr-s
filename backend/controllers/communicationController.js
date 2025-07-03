import { dirname } from 'path';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { sendWelcomeEmail2 } from '../mailtrap/email.js';

const prisma = new PrismaClient();

export const submitCommunication = async (req, res) => {
  try {
    const { 
      theme,speciality, title, mainAuthor, coAuthors, email, phone, 
      service, institution, objectives, methods, results, conclusion
    } = req.body;
    console.log("Received request:", req.body, req.files);

    const file = req.files.file;

    if (!file) {
              console.log("No file uploaded");

      return res.status(400).json({ error: 'No file uploaded' });
    }

    // --- User handling ---
    let user = null;
    if (req.user && req.user.id) {
      user = await prisma.user.findUnique({ where: { id: req.user.id } });
            console.log("Authenticated user:", user);

    } else {
      // Check if user already exists by email
      user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        // Create user with random password
        const randomPassword = crypto.randomBytes(8).toString('hex');
        const hashedPassword = await bcrypt.hash(randomPassword, 10);
        const [prenom, ...restNom] = mainAuthor.trim().split(" ");
        const nom = restNom.join(" ") || prenom;
                console.log("Creating new user:", nom, prenom, email);

        user = await prisma.user.create({
          data: {
            nom,
            prenom,
            email,
            password: hashedPassword,
          },
        });
                console.log("User created:", user);

        // Send credentials by email
        await sendWelcomeEmail2(email, mainAuthor, randomPassword);
      }
    }

    // --- File upload to Cloudinary ---
        console.log("Saving file temporarily...");

    // Save file temporarily
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const fileExt = path.extname(file.name);
    const fileName = `${Date.now()}${fileExt}`;
    const tempFilePath = path.join(uploadDir, fileName);
    await file.mv(tempFilePath);
    console.log("Uploading to Cloudinary...");

    // Upload to Cloudinary
    const cloudinaryResult = await uploadToCloudinary(tempFilePath);
    console.log("Cloudinary result:", cloudinaryResult);

    // Remove temp file
    fs.unlinkSync(tempFilePath);
    console.log("Saving communication to DB...");

    // Save to database
    const communication = await prisma.communication.create({
      data: {
        theme,
        speciality,
        title,
        mainAuthor,
        coAuthors,
        email,
        phone,
        service,
        institution,
        objectives,
        methods,
        results,
        conclusion,
        filePath: cloudinaryResult.secure_url,
        userId: user.id,
      },
    });

    res.status(201).json(communication);
  } catch (error) {
    console.error('Error submitting communication:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCommunications = async (req, res) => {
  try {
    const communications = await prisma.communication.findMany({
      include: {
        user: {
          select: { nom: true, prenom: true, email: true },
        },
        reviewerAssignments: {
          include: {
            reviewer: { select: { nom: true, prenom: true, email: true, id: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Format for frontend
    const formatted = communications.map(comm => ({
      ...comm,
      committeeMembers: comm.reviewerAssignments.map(a => ({
        id: a.reviewer.id,
        nom: a.reviewer.nom,
        prenom: a.reviewer.prenom,
        email: a.reviewer.email,
      })),
      scores: comm.reviewerAssignments.map(a => a.score).filter(s => s !== null),
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching communications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const assignReviewers = async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewerIds } = req.body; // Array of user IDs

    // Get current assignments
    const currentAssignments = await prisma.reviewerAssignment.findMany({
      where: { communicationId: id },
    });
    const currentReviewerIds = currentAssignments.map(a => a.reviewerId);

    // Reviewers to add
    const toAdd = reviewerIds.filter(rid => !currentReviewerIds.includes(rid));
    // Reviewers to remove
    const toRemove = currentReviewerIds.filter(rid => !reviewerIds.includes(rid));

    // Add new assignments
    await Promise.all(
      toAdd.map(reviewerId =>
        prisma.reviewerAssignment.create({
          data: { communicationId: id, reviewerId }
        })
      )
    );

    // Remove unselected assignments
    await prisma.reviewerAssignment.deleteMany({
      where: {
        communicationId: id,
        reviewerId: { in: toRemove }
      }
    });

    res.json({ added: toAdd, removed: toRemove });
  } catch (error) {
    console.error('Error assigning reviewers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCommitteeMembers = async (req, res) => {
  try {
    const members = await prisma.user.findMany({
      where: { role: 'COMMITTEE' },
      select: { id: true, nom: true, prenom: true, email: true }
    });
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const downloadFile = async (req, res) => {
  try {
    const { id } = req.params;
    // Fetch the communication with user (author) info
    const communication = await prisma.communication.findUnique({
      where: { id },
      select: {
        filePath: true,
        title: true,
        user: { select: { nom: true, prenom: true } }
      }
    });

    if (!communication) {
      return res.status(404).send('Communication not found');
    }

    const fileUrl = communication.filePath;
    const ext = path.extname(new URL(fileUrl).pathname);

    // Build filename: "prenom_nom - title.ext"
    const author =
      (communication.user?.prenom ? communication.user.prenom : "") +
      (communication.user?.nom ? "_" + communication.user.nom : "");
    const safeTitle = communication.title ? communication.title.replace(/[\\/:*?"<>|]/g, '') : 'document';
    const fileName = `${author.trim()} - ${safeTitle}${ext}`;

    // Download the file as a buffer
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/octet-stream');
    res.send(buffer);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).send('Internal server error');
  }
};

export const deleteBulkCommunications = async (req, res) => {
  try {
    const { ids } = req.body;

    await prisma.reviewerAssignment.deleteMany({
      where: { communicationId: { in: ids } }
    });

    await prisma.communication.deleteMany({
      where: { id: { in: ids } }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAssignedToMe = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const userId = req.user.id;
    const assignments = await prisma.reviewerAssignment.findMany({
      where: { reviewerId: userId },
      include: {
        communication: {
          select: {
            id: true,
            title: true,
            filePath: true,
            mainAuthor: true, 
            user: { select: { prenom: true, nom: true } }
          }
        }
      }
    });
    res.json(assignments.map(a => ({
      assignmentId: a.id,
      title: a.communication.title,
      filePath: a.communication.filePath,
      mainAuthor: a.communication.mainAuthor,
      author: `${a.communication.user.prenom} ${a.communication.user.nom}`,
      score: a.score 
    })));
  } catch (error) {
    console.error("getAssignedToMe error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const setScore = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { score } = req.body;
    const userId = req.user.id;

    // Only allow the assigned reviewer to set the score
    const assignment = await prisma.reviewerAssignment.findUnique({
      where: { id: assignmentId }
    });
    if (!assignment || assignment.reviewerId !== userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await prisma.reviewerAssignment.update({
      where: { id: assignmentId },
      data: { score }
    });

    res.json({ success: true });
  } catch (error) {
    console.error("setScore error:", error); // <-- Add this line
    res.status(500).json({ error: "Internal server error" });
  }
};