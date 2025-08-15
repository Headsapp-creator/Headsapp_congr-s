import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
export const uploadToCloudinary = async (filePath) => {
  const uploadOptions = {
    folder: "communications",
    resource_type: "raw",
    format: "docx",
  };
  
  console.log("Uploading file:", filePath, "with options:", uploadOptions);
  
  return cloudinary.uploader.upload(filePath, uploadOptions);
};
export default cloudinary;
