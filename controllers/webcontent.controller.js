const fs = require("node:fs");
const ejs = require("ejs");
const { v4: uuidv4 } = require("uuid");
const WebContent = require("../models/WebContent.model");
const { uploadToFileStorage, deleteFromFileStorage } = require("../utils/fileStorage.utils");
const { registerSubdomain } = require("../utils/namestone.util");
const { PINATA_GATEWAY } = require("../consts");
const { webContentValidationSchema } = require("../validations/webcontent.validations");

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

const publishWebContent = async (req, res) => {
  try {
    const { files, body, user } = req;

    const error = webContentValidationSchema(body);
    if (error) return res.status(400).send(error);

    // Check if web content already exists for this user
    const existingContent = await WebContent.findOne({ user: user._id });
    if (existingContent) {
      return res.status(400).send("Web content already exists for this user");
    }

    // Handle file uploads
    // ✅ LANDING IMAGE
    if (files?.landing_image?.[0]) {
      body.landing.image = files.landing_image[0].path; // Cloudinary URL
    } else if (typeof body.landing.image === "object" && body.landing.image.url) {
      body.landing.image = body.landing.image.url; // Fallback to existing URL in data
    }

    // ✅ LIVE IMAGE
    if (files?.live_image?.[0]) {
      body.live.image = files.live_image[0].path; // Cloudinary URL
    } else if (typeof body.live.image === "object" && body.live.image.url) {
      body.live.image = body.live.image.url; // Fallback to existing URL in data
    }

    // ✅ LIVE VIDEO
    if (files?.live_video?.[0]) {
      body.live.video = files.live_video[0].path; // Cloudinary URL
    } else if (typeof body.live.video === "object" && body.live.video.url) {
      body.live.video = body.live.video.url; // Fallback to existing URL in data
    }

    // ✅ ORGANIZATION IMAGES
    const orgImages = [];
    let index = 0;
    while (true) {
      const key = `org_image_${index}`;
      if (files?.[key]?.[0]) {
        orgImages.push(files[key][0].path); // Cloudinary URL
      } else if (typeof body.organizations?.[index] === "string") {
        orgImages.push(body.organizations[index]); // Fallback to existing URL
      } else {
        break; // No more files or org URLs
      }
      index++;
    }
    body.organizations = orgImages;

    // Render the template with the body data
    const templateFile = fs.readFileSync(`${__dirname}/../../template/index.ejs`);
    const template = ejs.compile(templateFile.toString());
    const renderedTemplate = template(body);

    // Convert to file and upload to file storage (IPFS or similar)
    const fileBlob = new Blob([renderedTemplate], { type: "text/html" });
    const file = new File([fileBlob], `${uuidv4()}.html`, {
      type: "text/html",
    });
    const cid = await uploadToFileStorage(file); // Assuming this function uploads the file

    // Create the WebContent document
    const webContent = new WebContent({
      user: user._id,
      cid,
      ...body,
      isNewWebpage: true,
    });

    // Save to DB
    await webContent.save();

    // Respond with the web content and the generated URL
    return res.send({
      ...webContent.toJSON(),
      url: `${PINATA_GATEWAY}/${webContent.cid}`, // Assuming you use Pinata for file hosting
    });
  } catch (error) {
    console.error("Error creating web content:", error);
    return res.status(500).send("Internal server error");
  }
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
