const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const resourceType = file.mimetype.startsWith("video") ? "video" : "image";
    const publicId = `${Date.now()}-${file.originalname.split(".")[0]}`;
    return {
      folder: "web_content",
      resource_type: resourceType,
      public_id: publicId,
    };
  },
});

module.exports = {
  cloudinary,
  storage,
};
