import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Upload file to Cloudinary with retry logic and timeout handling
 * @param {string|Buffer} file - Path to the file or file buffer to upload
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise<Object>} Cloudinary upload result
 */
export const uploadToCloudinary = async (file, maxRetries = 3) => {
  const uploadOptions = {
    folder: "communications",
    resource_type: "raw",
    format: "docx",
    timeout: 120000, // 2 minutes timeout
    use_filename: true,
    unique_filename: false,
  };
  
  console.log("Uploading file to Cloudinary");
  
  // If file is a buffer, we can get its size directly
  if (Buffer.isBuffer(file)) {
    console.log(`File size: ${file.length} bytes`);
  } else {
    // Check if file exists and get its size
    try {
      const stats = fs.statSync(file);
      console.log(`File size: ${stats.size} bytes`);
    } catch (fileError) {
      console.error("Error checking file:", fileError);
      throw new Error(`File error: ${fileError.message}`);
    }
  }
  
  // Retry logic
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Upload attempt ${attempt} of ${maxRetries}`);
      const result = await cloudinary.uploader.upload(file, uploadOptions);
      console.log("Upload successful:", result.secure_url);
      return result;
    } catch (error) {
      console.error(`Upload attempt ${attempt} failed:`, error.message);
      
      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        throw new Error(`Failed to upload to Cloudinary after ${maxRetries} attempts: ${error.message}`);
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s, etc.
      console.log(`Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

export default cloudinary;
