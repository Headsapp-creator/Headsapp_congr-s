import { PrismaClient } from '@prisma/client';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const prisma = new PrismaClient();

// Helper function to get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Function to download file from Cloudinary
const downloadFromCloudinary = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch file from Cloudinary: ${response.statusText}`);
  }
  return Buffer.from(await response.arrayBuffer());
};

// Function to create a new Word document with the given content
const createWordDocument = (data) => {
  // Create a new PizZip instance
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
  
  // Add styles with Arial 11 font and 1.5 line spacing
  zip.file("word/styles.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:rPr>
      <w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>
      <w:sz w:val="22"/> <!-- 11pt font size -->
    </w:rPr>
    <w:pPr>
      <w:spacing w:line="240" w:lineRule="auto"/> <!-- 1.5 line spacing -->
      <w:ind w:firstLine="440"/> <!-- First line indent -->
    </w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:rPr>
      <w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>
      <w:sz w:val="24"/>
      <w:b/> <!-- Bold -->
    </w:rPr>
    <w:pPr>
      <w:spacing w:line="240" w:lineRule="auto"/>
      <w:ind w:firstLine="0"/>
    </w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:rPr>
      <w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>
      <w:sz w:val="22"/>
      <w:b/> <!-- Bold -->
    </w:rPr>
    <w:pPr>
      <w:spacing w:line="240" w:lineRule="auto"/>
      <w:ind w:firstLine="0"/>
    </w:pPr>
  </w:style>
</w:styles>`);
  
  // Create the document content with proper structure
  let documentContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>`;
  
  // Add title
  if (data.title) {
    documentContent += `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading1"/>
        <w:jc w:val="center"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
        </w:rPr>
        <w:t>${escapeXml(data.title)}</w:t>
      </w:r>
    </w:p>`;
  }

  // Add introduction section if it exists
  if (data.introduction) {
    documentContent += `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading2"/>
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
        <w:t>${escapeXml(data.introduction)}</w:t>
      </w:r>
    </w:p>`;
  }

  // Add case presentation section if it exists
  if (data.casePresentation) {
    documentContent += `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading2"/>
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
        <w:t>${escapeXml(data.casePresentation)}</w:t>
      </w:r>
    </w:p>`;
  }

  // Add methods section if it exists
  if (data.methods) {
    documentContent += `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading2"/>
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
        <w:t>${escapeXml(data.methods)}</w:t>
      </w:r>
    </w:p>`;
  }

  // Add results section if it exists
  if (data.results) {
    documentContent += `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading2"/>
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
        <w:t>${escapeXml(data.results)}</w:t>
      </w:r>
    </w:p>`;
  }

  // Add conclusion section if it exists
  if (data.conclusion) {
    documentContent += `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading2"/>
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
        <w:t>${escapeXml(data.conclusion)}</w:t>
      </w:r>
    </w:p>`;
  }

  // Close the document
  documentContent += `
  </w:body>
</w:document>`;
  
  zip.file("word/document.xml", documentContent);
  
  // Generate the Word document buffer
  const docBuffer = zip.generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });
  
  return docBuffer;
};

// Helper function to escape XML special characters
const escapeXml = (text) => {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

// Function to modify Word document content
export const modifyWordDocument = async (req, res) => {
  try {
    const { communicationId } = req.params;
    const {
      title,
      introduction,
      methods,
      casePresentation,
      results,
      conclusion
    } = req.body;

    // Get the existing communication
    const communication = await prisma.communication.findUnique({
      where: { id: communicationId }
    });

    if (!communication) {
      return res.status(404).json({ error: 'Communication not found' });
    }

    // Prepare data for the new document
    const data = {
      title: title || communication.title,
      introduction: introduction || communication.introduction,
      methods: methods || communication.methods,
      casePresentation: casePresentation || communication.casePresentation,
      results: results || communication.results,
      conclusion: conclusion || communication.conclusion
    };

    // Create a new Word document with the updated content
    const modifiedBuffer = createWordDocument(data);

    // Save the modified document to a temporary file
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const modifiedFilePath = path.join(uploadDir, `modified_${Date.now()}_communication.docx`);
    fs.writeFileSync(modifiedFilePath, modifiedBuffer);

    // Upload the modified file to Cloudinary
    let cloudinaryResult;
    try {
      cloudinaryResult = await uploadToCloudinary(modifiedFilePath);
      console.log("Cloudinary result:", cloudinaryResult);
    } catch (uploadError) {
      console.error("Cloudinary upload error:", uploadError);
      throw new Error(`Failed to upload to Cloudinary: ${uploadError.message}`);
    }

    // Remove temporary file
    fs.unlinkSync(modifiedFilePath);

    // Update the communication in the database with the new file path
    const updatedCommunication = await prisma.communication.update({
      where: { id: communicationId },
      data: {
        title: title || communication.title,
        introduction: introduction || communication.introduction,
        methods: methods || communication.methods,
        casePresentation: casePresentation || communication.casePresentation,
        results: results || communication.results,
        conclusion: conclusion || communication.conclusion,
        filePath: cloudinaryResult.secure_url
      }
    });

    res.json({
      success: true,
      message: 'Document modified successfully',
      filePath: cloudinaryResult.secure_url,
      communication: updatedCommunication
    });
  } catch (error) {
    console.error('Error modifying Word document:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Function to get communication content for editing
export const getCommunicationContent = async (req, res) => {
  try {
    const { communicationId } = req.params;
    
    // Get the communication
    const communication = await prisma.communication.findUnique({
      where: { id: communicationId }
    });

    if (!communication) {
      return res.status(404).json({ error: 'Communication not found' });
    }

    // Return the communication content
    res.json({
      id: communication.id,
      title: communication.title,
      introduction: communication.introduction,
      methods: communication.methods,
      casePresentation: communication.casePresentation,
      results: communication.results,
      conclusion: communication.conclusion,
      filePath: communication.filePath
    });
  } catch (error) {
    console.error('Error fetching communication content:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};