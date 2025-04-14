const fs = require("node:fs");
const ejs = require("ejs");
const { v4: uuidv4 } = require("uuid");
const WebContent = require("../models/WebContent.model");
const { uploadToFileStorage, deleteFromFileStorage } = require("../utils/fileStorage.utils");
const { registerSubdomain } = require("../utils/namestone.util");
const { PINATA_GATEWAY } = require("../consts");

const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { cloudinary } = require("../utils/cloudinary");

// const publishWebContent = async (req, res) => {
//   try {
//     const { body, user } = req;

//     if (!validateContentStructure(body)) {
//       return res.status(400).send("Invalid web content structure");
//     }

//     const error = validateWebContent(body);
//     if (error) return res.status(400).send(error);

//     const existingContent = await WebContent.findOne({ user: user._id });
//     if (existingContent) {
//       return res.status(400).send("Web content already exists for this user");
//     }

//     const templateFile = fs.readFileSync(`${__dirname}/../../template/index.ejs`);
//     const template = ejs.compile(templateFile.toString());
//     const renderedTemplate = template(body);

//     const fileBlob = new Blob([renderedTemplate], { type: "text/html" });
//     const file = new File([fileBlob], `${uuidv4()}.html`, {
//       type: "text/html",
//     });
//     const cid = await uploadToFileStorage(file);

//     const webContent = new WebContent({
//       user: user._id,
//       cid,
//       ...body,
//       isNewWebpage: true,
//     });

//     await webContent.save();

//     return res.send({
//       ...webContent.toJSON(),
//       url: `${PINATA_GATEWAY}/${webContent.cid}`,
//     });
//   } catch (error) {
//     console.error("Error creating web content:", error);
//     return res.status(500).send("Internal server error");
//   }
// };

// const publishWebContent = async (req, res) => {
//   try {
//     const { files, body, user } = req;
//     // console.log("files:", files);
//     // console.log("body:", JSON.parse(body.data));
//     // console.log("user:", user);

//     const content = JSON.parse(body.data);

//     // Handle file uploads
//     // ✅ LANDING IMAGE
//     if (files?.landing_image?.[0]) {
//       body.landing.image = files.landing_image[0].path; // Cloudinary URL
//     } else if (typeof content.landing.image === "object" && content.landing.image.url) {
//       content.landing.image = content.landing.image.url; // Fallback to existing URL in data
//     }

//     // ✅ LIVE IMAGE
//     if (files?.live_image?.[0]) {
//       body.live.image = files.live_image[0].path; // Cloudinary URL
//     } else if (typeof content.live.image === "object" && content.live.image.url) {
//       content.live.image = content.live.image.url; // Fallback to existing URL in data
//     }

//     // ✅ LIVE VIDEO
//     if (files?.live_video?.[0]) {
//       body.live.video = files.live_video[0].path; // Cloudinary URL
//     } else if (typeof content.live.video === "object" && content.live.video.url) {
//       content.live.video = content.live.video.url; // Fallback to existing URL in data
//     }

//     // ✅ ORGANIZATION IMAGES
//     const orgImages = [];
//     let index = 0;
//     while (true) {
//       const key = `org_image_${index}`;
//       if (files?.[key]?.[0]) {
//         orgImages.push(files[key][0].path); // Cloudinary URL
//       } else if (typeof content.organizations?.[index] === "string") {
//         orgImages.push(content.organizations[index]); // Fallback to existing URL
//       } else {
//         break; // No more files or org URLs
//       }
//       index++;
//     }
//     body.organizations = orgImages;

//     // Render the template with the body data
//     // const templateFile = fs.readFileSync(`${__dirname}/../../template/index.ejs`);
//     // const template = ejs.compile(templateFile.toString());
//     // const renderedTemplate = template(body);

//     // Convert to file and upload to file storage (IPFS or similar)
//     // const fileBlob = new Blob([renderedTemplate], { type: "text/html" });
//     // const file = new File([fileBlob], `${uuidv4()}.html`, {
//     //   type: "text/html",
//     // });
//     // const cid = await uploadToFileStorage(file); // Assuming this function uploads the file

//     // Create the WebContent document
//     const webContent = new WebContent({
//       user: user.id,
//       ...content,
//       isNewWebpage: false,
//     });

//     // Save to DB
//     await webContent.save();

//     // Respond with the web content and the generated URL
//     // return res.send({
//     //   ...webContent.toJSON(),
//     //   url: `${PINATA_GATEWAY}/${webContent.cid}`, // Assuming you use Pinata for file hosting
//     // });
//     return res.status(201).json({ message: "published" });
//   } catch (error) {
//     console.error("Error creating web content:", error);
//     return res.status(500).send("Internal server error");
//   }
// };

// Set up multer storage for Cloudinary
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

// Set up multer file upload
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    console.log(`Processing file upload: ${file.originalname}`);
    console.log(`File type: ${file.mimetype}`);
    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Controller function for publishing content
const publishWebContent = async (req, res) => {
  try {
    const { body, user } = req;

    // Start file upload
    console.log("🛬 Reached controller");
    console.log("📦 Incoming files:", req.files);

    if (!body.data) {
      console.log("❌ No body.data");
      return res.status(400).json({ message: "Missing content data" });
    }

    const content = JSON.parse(body.data);
    console.log("✅ Parsed content");

    // LANDING IMAGE
    if (req.files?.landing_image?.[0]) {
      content.landing.image = req.files.landing_image[0].path;
    }

    // LIVE IMAGE
    if (req.files?.live_image?.[0]) {
      content.live.image = req.files.live_image[0].path;
    }

    // LIVE VIDEO
    if (req.files?.live_video?.[0]) {
      content.live.video = req.files.live_video[0].path;
    }

    // ORG IMAGES
    const orgImages = [];
    const orgCount = content.organizations?.length || 0;
    for (let i = 0; i < orgCount; i++) {
      const key = `org_image_${i}`;
      if (req.files?.[key]?.[0]) {
        orgImages.push(req.files[key][0].path);
      } else if (typeof content.organizations[i] === "string") {
        orgImages.push(content.organizations[i]);
      }
    }
    content.organizations = orgImages;

    console.log("🧱 Creating WebContent instance");

    const webContent = new WebContent({
      user: user.id,
      ...content,
      isNewWebpage: false,
    });

    // Debugging before saving
    console.log("📅 WebContent instance to save:", webContent);

    console.log("💾 Saving to DB...");
    const savedContent = await webContent.save(); // Capture the saved content for debugging
    console.log("🎉 Saved successfully!", savedContent);

    return res.status(201).json({ message: "Published successfully", data: savedContent });
  } catch (error) {
    console.error("💥 Error:", error);
    // Check if it's a validation error
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: "Validation error", error: error.errors });
    }

    return res.status(500).json({ message: "Internal server error", error });
  }
};

module.exports = {
  publishWebContent,
};

const updateWebContent = async () => {};

const getWebContent = async (req, res) => {
  try {
    const { user } = req;

    const webContent = await WebContent.findOne({ user: user._id });

    if (!webContent) {
      return res.status(404).json({ message: "Web content not found" });
    }

    return res.send({
      url: `${PINATA_GATEWAY}/${webContent.cid}`,
      ...webContent.toJSON(),
    });
  } catch (error) {
    console.error("Error fetching web content:", error);
    return res.status(500).send("Server error. Please refresh the page");
  }
};

const deleteWebContent = async (req, res) => {
  try {
    const { user } = req;

    const webContent = await WebContent.findOne({ user: user._id });
    if (!webContent) {
      return res.status(404).send("Web content not found");
    }

    const { cid } = webContent;
    await deleteFromFileStorage(cid);

    await WebContent.findByIdAndDelete(webContent._id);

    return res.send({ message: "Web content deleted successfully" });
  } catch (error) {
    console.error("Error deleting web content:", error);
    return res.status(500).send("Internal server error");
  }
};

module.exports = {
  publishWebContent,
  updateWebContent,
  getWebContent,
  deleteWebContent,
};
