import { dirname } from 'path';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { sendWelcomeEmail2 } from '../mailtrap/email.js';
import { sendCommunicationApprovalEmail, sendCommunicationRejectionEmail } from '../mailtrap/email.js';

// Import docxtemplater and pizzip for Word file generation
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';

const prisma = new PrismaClient();

export const submitCommunication = async (req, res) => {
  try {
    const {
      typeOfAbstract, speciality, title, mainAuthor, coAuthors, email, phone,
      service, institution, pays, ville, introduction, methods, casePresentation, results, conclusion, eventId, communicationType
    } = req.body;

    const hasIntroduction = introduction && typeof introduction === 'string' && introduction.trim() !== '';
    const hasMethods = communicationType === 'methods' && methods && typeof methods === 'string' && methods.trim() !== '';
    const hasCasePresentation = communicationType === 'case-presentation' && casePresentation && typeof casePresentation === 'string' && casePresentation.trim() !== '';
    const hasResults = results && typeof results === 'string' && results.trim() !== '';
    const hasConclusion = conclusion && typeof conclusion === 'string' && conclusion.trim() !== '';
    
    // Only include sections that have content
    const filteredWordContent = {
      title: title
    };
    
    if (hasIntroduction) {
      filteredWordContent.introduction = introduction.trim();
    }
    
    if (hasMethods) {
      filteredWordContent.methods = methods.trim();
    }
    
    if (hasCasePresentation) {
      filteredWordContent.casePresentation = casePresentation.trim();
    }
    
    if (hasResults) {
      filteredWordContent.results = results.trim();
    }
    
    if (hasConclusion) {
      filteredWordContent.conclusion = conclusion.trim();
    }

    // Create a simple Word document structure in memory
    // This avoids the need for a template file and ensures we have a valid structure
    const zip = new PizZip();
    
    // Add the basic Word document structure
    zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`);
    
    zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);
    
    zip.file("word/_rels/document.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`);
    
    // Add styles with Arial 10 font and 1.5 line spacing
    zip.file("word/styles.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:rPr>
      <w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>
      <w:sz w:val="20"/> <!-- 10pt font size -->
    </w:rPr>
    <w:pPr>
      <w:spacing w:line="240" w:lineRule="auto"/> <!-- 1.5 line spacing -->
    </w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:rPr>
      <w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>
      <w:sz w:val="20"/>
      <w:b/> <!-- Bold -->
    </w:rPr>
    <w:pPr>
      <w:spacing w:line="240" w:lineRule="auto"/>
    </w:pPr>
  </w:style>
</w:styles>`);
    
    
    // Create the document content with placeholders
    // Create the document content with placeholders - only include sections that have content
let documentContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading1"/>
        <w:jc w:val="center"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
        </w:rPr>
        <w:t>{title}</w:t>
      </w:r>
    </w:p>`;

// Add sections only if they have content
if (hasIntroduction) {
  documentContent += `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading1"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
        </w:rPr>
        <w:t>Introduction</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>{introduction}</w:t>
      </w:r>
    </w:p>`;
}

if (hasCasePresentation) {
  documentContent += `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading1"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
        </w:rPr>
        <w:t>Case Presentation</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>{casePresentation}</w:t>
      </w:r>
    </w:p>`;
}

if (hasMethods) {
  documentContent += `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading1"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
        </w:rPr>
        <w:t>Methods</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>{methods}</w:t>
      </w:r>
    </w:p>`;
}

if (hasResults) {
  documentContent += `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading1"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
        </w:rPr>
        <w:t>Results</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>{results}</w:t>
      </w:r>
    </w:p>`;
}

if (hasConclusion) {
  documentContent += `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading1"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
        </w:rPr>
        <w:t>Conclusion</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>{conclusion}</w:t>
      </w:r>
    </w:p>`;
}

// Close the document
documentContent += `
  </w:body>
</w:document>`;
    
    zip.file("word/document.xml", documentContent);
    // Create a new Docxtemplater instance
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: function(part) {
        // Return empty string for null/undefined values
        return '';
      }
    });
    
    // Render the document with the data
    try {
      doc.render(filteredWordContent);
    } catch (error) {
      console.error('Error rendering document:', error);
      throw error;
    }
    
    // Generate the Word document buffer
    const docBuffer = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    // Validate the generated Word document
    try {
      const validationZip = new PizZip(docBuffer);
      
    } catch (validationError) {
      console.error("Generated Word document is invalid:", validationError);
      throw new Error("Failed to generate valid Word document");
    }

    // Save the generated Word file temporarily
    const uploadDir = path.join(dirname(fileURLToPath(import.meta.url)), '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const fileName = `${Date.now()}_communication.docx`;
    const tempFilePath = path.join(uploadDir, fileName);
    fs.writeFileSync(tempFilePath, docBuffer);

    // --- User handling ---
    let user = null;
    if (req.user && req.user.id) {
      // If user is logged in, use their account
      user = await prisma.user.findUnique({ where: { id: req.user.id } });
    } else {
      // If not logged in, check if user exists by email
      user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        // Create user with random password
        const randomPassword = crypto.randomBytes(8).toString('hex');
        const hashedPassword = await bcrypt.hash(randomPassword, 10);
        const [prenom, ...restNom] = mainAuthor.trim().split(" ");
        const nom = restNom.join(" ") || prenom;

        user = await prisma.user.create({
          data: {
            nom,
            prenom,
            email,
            password: hashedPassword,
          },
        });

        await sendWelcomeEmail2(email, mainAuthor, randomPassword);
      }
      
    }

  
    let cloudinaryResult;
    try {
      cloudinaryResult = await uploadToCloudinary(tempFilePath);
    } catch (uploadError) {
      console.error("Cloudinary upload error:", uploadError);
      throw new Error(`Failed to upload to Cloudinary: ${uploadError.message}`);
    }

    fs.unlinkSync(tempFilePath);

    
    let coAuthorsArray = coAuthors;
    if (typeof coAuthors === 'string') {
      coAuthorsArray = coAuthors.split(',').map(author => author.trim()).filter(author => author.length > 0);
    } else if (Array.isArray(coAuthors)) {
      coAuthorsArray = coAuthors.filter(author => author && author.trim().length > 0).map(author => author.trim());
    } else {
      coAuthorsArray = [];
    }
    
    const communication = await prisma.communication.create({
      data: {
        typeOfAbstract,
        speciality,
        title,
        mainAuthor,
        coAuthors: coAuthorsArray,
        email,
        phone,
        service,
        institution,
        pays,
        ville,
        introduction: introduction ? introduction.trim() : null,
        methods: communicationType === 'case-presentation' ? null : (methods ? methods.trim() : null),
        casePresentation: communicationType === 'methods' ? null : (casePresentation ? casePresentation.trim() : null),
        results: results ? results.trim() : null,
        conclusion: conclusion ? conclusion.trim() : null,
        filePath: cloudinaryResult.secure_url,
        user: {
          connect: {
            id: user.id
          }
        },
        event: eventId ? {
          connect: {
            id: eventId
          }
        } : undefined,
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
            tracking: true, 
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    
    const formatted = communications.map(comm => ({
      ...comm,
      committeeMembers: comm.reviewerAssignments.map(a => ({
        id: a.reviewer.id,
        nom: a.reviewer.nom,
        prenom: a.reviewer.prenom,
        email: a.reviewer.email,
      })),
      scores: comm.reviewerAssignments.map(a => a.score).filter(s => s !== null),
      tracking: comm.reviewerAssignments.map(a => ({
        reviewerId: a.reviewer.id,
        viewed: a.tracking?.viewed || false,
        viewedAt: a.tracking?.viewedAt || null,
        downloaded: a.tracking?.downloaded || false,
        downloadedAt: a.tracking?.downloadedAt || null,
      })),
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching communications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const trackReviewerAction = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { action } = req.body;
    const userId = req.user.id;

    // Find assignment and verify the reviewer
    const assignment = await prisma.reviewerAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        communication: { select: { title: true } }
      }
    });

    if (!assignment || assignment.reviewerId !== userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const updateData = {};
    const now = new Date();

    if (action === "view") {
      updateData.viewed = true;
      updateData.viewedAt = now;
    } else if (action === "download") {
      updateData.downloaded = true;
      updateData.downloadedAt = now;
    } else {
      return res.status(400).json({ error: "Invalid action" });
    }

    await prisma.tracking.upsert({
      where: { assignmentId },
      update: updateData,
      create: {
        assignmentId,
        ...updateData
      },
    });
    const reviewer = await prisma.user.findUnique({ where: { id: userId } });
    const docTitle = assignment.communication?.title || "a document";
    let notifMsg = "";
    if (action === "view") notifMsg = `${reviewer.prenom} ${reviewer.nom} viewed "${docTitle}"`;
    if (action === "download") notifMsg = `${reviewer.prenom} ${reviewer.nom} downloaded "${docTitle}"`;

    await prisma.notification.create({
      data: {
        type: action,
        message: notifMsg,
        reviewerId: userId,
        communicationId: assignment.communicationId, 
        isRead: false
      }
    });
    const io = req.app.get('io');
    if (io) {
      io.emit('admin-notification', { message: notifMsg, type: action, createdAt: new Date(), isRead: false, communicationId: assignment.communicationId });
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Tracking error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getTrackingForCommunication = async (req, res) => {
  try {
    const { id } = req.params;
    const assignments = await prisma.reviewerAssignment.findMany({
      where: { communicationId: id },
      include: {
        reviewer: { select: { id: true, nom: true, prenom: true, email: true } },
        tracking: true,
      }
    });

    const trackingData = assignments.map(a => ({
      reviewer: a.reviewer,
      viewed: a.tracking?.viewed || false,
      viewedAt: a.tracking?.viewedAt || null,
      downloaded: a.tracking?.downloaded || false,
      downloadedAt: a.tracking?.downloadedAt || null,
    }));

    res.json(trackingData);
  } catch (error) {
    console.error("getTrackingForCommunication error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const assignReviewers = async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewerIds } = req.body;

    const currentAssignments = await prisma.reviewerAssignment.findMany({
      where: { communicationId: id },
    });
    const currentReviewerIds = currentAssignments.map(a => a.reviewerId);

    const toAdd = reviewerIds.filter(rid => !currentReviewerIds.includes(rid));
    const toRemove = currentReviewerIds.filter(rid => !reviewerIds.includes(rid));

    await Promise.all(
      toAdd.map(async reviewerId => {
        await prisma.reviewerAssignment.create({
          data: { communicationId: id, reviewerId }
        });

        const communication = await prisma.communication.findUnique({
          where: { id },
          select: { title: true }
        });

        const notifMsg = `You have been assigned to review "${communication.title}"`;
        const notification = await prisma.notification.create({
          data: {
            type: "assignment",
            message: notifMsg,
            reviewerId,
            communicationId: id 
          }
        });

        const io = req.app.get('io');
        if (io) {
          io.to(`reviewer_${reviewerId}`).emit('reviewer-notification', {
            id: notification.id,
            message: notifMsg,
            type: "assignment",
            communicationId: id,
            isRead: false,
            createdAt: new Date()
          });
        }
      })
    );

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
    
    const communication = await prisma.communication.findUnique({
      where: { id },
      select: {
        filePath: true,
        title: true,
        mainAuthor: true,
        coAuthors: true,
        user: { select: { nom: true, prenom: true } }
      }
    });

    if (!communication) {
      return res.status(404).send('Communication not found');
    }

    const response = await fetch(communication.filePath);
    if (!response.ok) {
      throw new Error(`Failed to fetch file from Cloudinary: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create a safe filename
    const author = communication.mainAuthor ? communication.mainAuthor.replace(/[\\/:*?"<>|]/g, '') : '';
    // Handle coAuthors as array
    let coAuthorsString = '';
    if (Array.isArray(communication.coAuthors) && communication.coAuthors.length > 0) {
      coAuthorsString = '_' + communication.coAuthors.join(', ').replace(/[\\/:*?"<>|]/g, '');
    }
    const safeTitle = communication.title ? communication.title.replace(/[\\/:*?"<>|]/g, '') : 'document';
    const fileExt = path.extname(new URL(communication.filePath).pathname);
    const fileName = `${author}${coAuthorsString} - ${safeTitle}${fileExt}`;

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
    
    // First, get all assignments for the reviewer
    const assignments = await prisma.reviewerAssignment.findMany({
      where: { reviewerId: userId },
      include: {
        tracking: true,
      }
    });
    
    // Extract communication IDs
    const communicationIds = assignments.map(a => a.communicationId).filter(id => id);
    
    // Get valid communications
    const communications = await prisma.communication.findMany({
      where: {
        id: { in: communicationIds }
      },
      select: {
        id: true,
        title: true,
        filePath: true,
        mainAuthor: true,
        user: { select: { prenom: true, nom: true } }
      }
    });
    
    // Create a map for quick lookup
    const communicationMap = {};
    communications.forEach(comm => {
      communicationMap[comm.id] = comm;
    });
    
    // Filter assignments to only include those with valid communications
    const validAssignments = assignments.filter(a => communicationMap[a.communicationId]);
    
    // Log warning for missing communications (data inconsistency)
    const missingCommunicationCount = assignments.length - validAssignments.length;
    if (missingCommunicationCount > 0) {
      console.warn(`Found ${missingCommunicationCount} reviewer assignments with missing communications (data inconsistency)`);
    }
    
    // Map to the desired format
    res.json(validAssignments.map(a => ({
      assignmentId: a.id,
      communicationId: a.communicationId,
      title: communicationMap[a.communicationId].title,
      filePath: communicationMap[a.communicationId].filePath,
      mainAuthor: communicationMap[a.communicationId].mainAuthor,
      author: `${communicationMap[a.communicationId].user.prenom} ${communicationMap[a.communicationId].user.nom}`,
      score: a.score,
      tracking: a.tracking || {},
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

    const assignment = await prisma.reviewerAssignment.update({
      where: { id: assignmentId },
      data: { score: Number(score) },
      include: { communication: true }
    });

    const allAssignments = await prisma.reviewerAssignment.findMany({
      where: { communicationId: assignment.communicationId },
      include: {
        reviewer: {
          select: {
            nom: true,
            prenom: true
          }
        }
      }
    });

   
    const scores = allAssignments
      .map(a => a.score)
      .filter(s => typeof s === "number");
      
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
    
    const allReviewersScored = allAssignments.every(a => a.score !== null);

    if (allReviewersScored && avg !== null) {
      
      const user = await prisma.user.findUnique({
        where: { id: assignment.communication.userId },
        select: { email: true, nom: true, prenom: true }
      });

      if (avg >= 8) {        
        if (user) {
          const userName = `${user.prenom} ${user.nom}`;
          await sendCommunicationApprovalEmail(user.email, userName, assignment.communication.title, avg.toFixed(2));
        }

        // Save notification in DB (optional)
        await prisma.notification.create({
          data: {
            userId: assignment.communication.userId,
            reviewerId: req.user.id, // Add the missing reviewerId
            message: `Your communication "${assignment.communication.title}" has been approved with a score of ${avg.toFixed(2)}/10.`,
            type: "approval",
            communicationId: assignment.communicationId
          }
        });

        // Emit real-time notification
        const io = req.app.get('io');
        if (io) {
          io.to(`user_${assignment.communication.userId}`).emit('user-notification', {
            message: `Your communication "${assignment.communication.title}" has been approved with a score of ${avg.toFixed(2)}/10.`,
            communicationId: assignment.communicationId,
            type: "approval",
            createdAt: new Date()
          });
        }
      }
      // Send rejection email if avg < 8
      else {
        
        // Send rejection email
        if (user) {
          const userName = `${user.prenom} ${user.nom}`;
          await sendCommunicationRejectionEmail(user.email, userName, assignment.communication.title, avg.toFixed(2));
        }

        // Save notification in DB (optional)
        await prisma.notification.create({
          data: {
            userId: assignment.communication.userId,
            reviewerId: req.user.id, // Add the missing reviewerId
            message: `Your communication "${assignment.communication.title}" has not been approved with a score of ${avg.toFixed(2)}/10.`,
            type: "rejection",
            communicationId: assignment.communicationId
          }
        });

        // Emit real-time notification
        const io = req.app.get('io');
        if (io) {
          io.to(`user_${assignment.communication.userId}`).emit('user-notification', {
            message: `Your communication "${assignment.communication.title}" has not been approved with a score of ${avg.toFixed(2)}/10.`,
            communicationId: assignment.communicationId,
            type: "rejection",
            createdAt: new Date()
          });
        }
      }
    } else if (!allReviewersScored) {
      console.log(`Communication pending. Not all reviewers have scored yet.`);
    } else {
      console.log(`Communication evaluation pending. Average score is null.`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error in setScore:", error);
    res.status(500).json({ error: "Failed to set score" });
  }
};

export const getAdminNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        type: {
          in: ['view', 'download']
        }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        communication: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const markAllNotificationsRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { isRead: false },
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getReviewerNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await prisma.notification.findMany({
      where: { reviewerId: userId, type: "assignment" },
      orderBy: { createdAt: 'desc' }
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const markReviewerNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMyCommunications = async (req, res) => {
  try {
    const userId = req.user.id;
    const communications = await prisma.communication.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        reviewerAssignments: {
          select: {
            score: true
          }
        }
      }
    });
    res.json(communications);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const markUserNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const markAllUserNotificationsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    await prisma.notification.updateMany({
      where: {
        userId: userId,
        isRead: false,
        type: {
          in: ["approval", "rejection"]
        }
      },
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await prisma.notification.findMany({
      where: {
        userId: userId,
        type: {
          in: ["approval", "rejection"]
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};