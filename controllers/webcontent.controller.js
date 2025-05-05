const fs = require("node:fs");
const ejs = require("ejs");
const { v4: uuidv4 } = require("uuid");
const path = require("node:path");
const WebContent = require("../models/WebContent.model");
const { deleteFromFileStorage } = require("../utils/fileStorage.utils");
const { registerSubdomain } = require("../utils/namestone.util");
const { PINATA_GATEWAY } = require("../consts");
const { uploadToFileStorage } = require("../utils/fileStorage.utils");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { cloudinary } = require("../utils/cloudinary");

// Controller function for publishing content
// const publishWebContent = async (req, res) => {
//   try {
//     const { body, user } = req;
//     if (!body.data) {
//       return res.status(400).json({ message: "Missing content data" });
//     }
//     const content = JSON.parse(body.data);
//     if (req.files?.landing_image?.[0]) {
//       content.landing.image = req.files.landing_image[0].path;
//     }
//     if (req.files?.live_image?.[0]) {
//       content.live.image = req.files.live_image[0].path;
//     }
//     if (req.files?.live_video?.[0]) {
//       content.live.video = req.files.live_video[0].path;
//     }
//     const orgImages = [];
//     const orgCount = content.organizations?.length || 0;
//     for (let i = 0; i < orgCount; i++) {
//       const key = `org_image_${i}`;
//       if (req.files?.[key]?.[0]) {
//         orgImages.push(req.files[key][0].path);
//       } else if (typeof content.organizations[i] === "string") {
//         orgImages.push(content.organizations[i]);
//       }
//     }
//     content.organizations = orgImages;
//     console.log("conrtet", content);
//     console.log("here now to save template");
//     console.log("dir name", __dirname);
//     const templateFile = fs.readFileSync(`${__dirname}/../template/index.ejs`);
//     console.log("template read");
//     const template = ejs.compile(templateFile.toString());
//     const renderedTemplate = template(content);
//     console.log("template rendered");
//     const fileBlob = new Blob([renderedTemplate], { type: "text/html" });
//     console.log("converted to file");
//     const file = new File([fileBlob], `${uuidv4()}.html`, {
//       type: "text/html",
//     });
//     console.log("here now to save template");
//     const cid = await uploadToFileStorage(file);
//     const webContent = new WebContent({
//       user: user.id,
//       ...content,
//       contentHash: cid,
//       isNewWebpage: false,
//     });
//     const savedContent = await webContent.save();
//     return res.status(201).json({ message: "Published successfully", data: savedContent });
//   } catch (error) {
//     console.error("💥 Error:", error);
//     if (error.name === "ValidationError") {
//       return res.status(400).json({ message: "Validation error", error: error.errors });
//     }
//     return res.status(500).json({ message: "Internal server error", error });
//   }
// };

const publishWebContent = async (req, res) => {
  try {
    const { body, user } = req;
    if (!body.data) {
      return res.status(400).json({ message: "Missing content data" });
    }

    // Default values for all possible template variables
    const defaultValues = {
      title: "",
      fullName: "",
      basedIn: "",
      region: "",
      pronoun: "",
      leading: {
        name: "",
        headline: "",
        hashTags: [],
        hashtag: "",
      },
      landing: {
        title: "",
        subtitle: "",
        ctaText: "",
        ctaLink: "",
      },
      slider: [],
      sliderData: [],
      value: {
        title: "",
        experience: "",
        items: [],
      },
      live: {
        title: "",
        details: [],
      },
      timeline: [],
      organizations: [],
      organizationAffiliations: [],
      communityAffiliations: [],
      superPowers: [],
      available: {
        availableFor: [],
      },
      socialChannels: [],
      image: "",
      users: [],
      avatar: "",
      availableFor: [],
      languagesByRegion: { Global: ["English"] },
    };

    // Parse user content
    const userContent = JSON.parse(body.data);

    // Create a new content object with default values
    const content = { ...defaultValues };

    // Merge user content into defaults
    Object.keys(userContent).forEach((key) => {
      if (
        typeof userContent[key] === "object" &&
        userContent[key] !== null &&
        !Array.isArray(userContent[key])
      ) {
        // For nested objects, merge with defaults
        if (key === "landing") {
          // Special handling for landing object
          content.landing = {
            ...defaultValues.landing,
            ...userContent.landing,
            hashTags: userContent.leading?.hashTags || [],
            organizationAffiliations: userContent.organizationAffiliations || [],
            communityAffiliations: userContent.communityAffiliations || [],
            superPowers: userContent.superPowers || [],
          };
        } else if (key === "value") {
          // Special handling for value object
          content.value = {
            ...defaultValues.value,
            ...userContent.value,
            experience: userContent.value?.experience || "",
            values: userContent.value?.items?.join(", ") || "",
          };
        } else if (key === "live") {
          // Special handling for live object
          content.live = {
            ...defaultValues.live,
            ...userContent.live,
            details:
              typeof userContent.live?.details === "string"
                ? [
                    {
                      title: "Project",
                      heading: userContent.live.title || "Latest Project",
                      body: userContent.live.details,
                    },
                  ]
                : userContent.live?.details || [],
          };
        } else if (key === "available") {
          // Special handling for available object
          content.available = {
            ...defaultValues.available,
            ...userContent.available,
            availableFor: userContent.available?.availableFor || [],
          };
        } else {
          content[key] = { ...(defaultValues[key] || {}), ...userContent[key] };
        }
      } else if (Array.isArray(userContent[key])) {
        // For arrays, copy directly
        content[key] = userContent[key];
      } else {
        // For simple properties, copy directly
        content[key] = userContent[key];
      }
    });

    // Ensure all required arrays are properly set
    content.slider = content.slider || [];
    content.organizations = content.organizations || [];
    content.timeline = content.timeline || [];
    content.socialChannels = content.socialChannels || [];

    // Process file uploads
    if (req.files?.landing_image?.[0]) {
      content.landing.image = req.files.landing_image[0].path;
    }
    if (req.files?.live_image?.[0]) {
      content.live.image = req.files.live_image[0].path;
    }
    if (req.files?.live_video?.[0]) {
      content.live.video = req.files.live_video[0].path;
    }

    // Process org images
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

    // Convert slider objects to strings
    if (content.slider && Array.isArray(content.slider)) {
      content.slider = content.slider.map((item) => {
        if (typeof item === "object") {
          return `${item.title}: ${item.description}`;
        }
        return item;
      });
    }

    // Set up template variables
    content.valueData = content.value;
    content.liveData = content.live;
    content.landingData = content.landing;

    // If live.details is a string, convert to expected format
    if (typeof content.live.details === "string") {
      content.live.details = [
        {
          title: "Project",
          heading: content.live.title || "Latest Project",
          body: content.live.details,
        },
      ];
    }

    // Add avatar if not present
    if (!content.avatar && content.image) {
      content.avatar = content.image;
    }

    // Add availableFor from available.availableFor
    if (content.available && content.available.availableFor) {
      content.availableFor = content.available.availableFor;
    }

    // Format social channels
    if (content.socialChannels) {
      if (!Array.isArray(content.socialChannels)) {
        const channels = [];
        if (content.socialChannels.twitter) {
          channels.push({ text: "Twitter", link: content.socialChannels.twitter });
        }
        if (content.socialChannels.linkedin) {
          channels.push({ text: "LinkedIn", link: content.socialChannels.linkedin });
        }
        if (content.socialChannels.github) {
          channels.push({ text: "GitHub", link: content.socialChannels.github });
        }
        content.socialChannels = channels;
      }
    }

    // Explicitly ensure users array exists
    content.users = content.users || [];

    console.log("content mapped for template:", content);

    // Read and render template
    const templateFile = fs.readFileSync(`${__dirname}/../template/index.ejs`);
    console.log("template read");

    // Use try-catch for template rendering to catch specific template errors
    try {
      const template = ejs.compile(templateFile.toString());
      const renderedTemplate = template(content);
      console.log("template rendered");

      // Create temp directory if it doesn't exist
      const tempDir = path.join(__dirname, "../temp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Generate unique filename
      const filename = `${uuidv4()}.html`;
      const filePath = path.join(tempDir, filename);

      // Save rendered template to temp directory
      fs.writeFileSync(filePath, renderedTemplate);
      console.log(`Template saved to temp directory: ${filePath}`);

      // Create file object for upload
      const file = new File([renderedTemplate], filename, {
        type: "text/html",
      });

      // Upload to Pinata
      const cid = await uploadToFileStorage(file);
      console.log(`File uploaded to Pinata with CID: ${cid}`);

      // Create and save web content
      const webContent = new WebContent({
        user: user.id,
        ...content,
        contentHash: cid,
        isNewWebpage: false,
      });
      const savedContent = await webContent.save();

      return res.status(201).json({
        message: "Published successfully",
        data: savedContent,
        tempFilePath: filePath, // Include temp file path in response
      });
    } catch (templateError) {
      console.error("Template rendering error:", templateError);
      return res.status(400).json({
        message: "Template rendering error",
        error: templateError.message,
        line: templateError.line,
      });
    }
  } catch (error) {
    console.error("💥 Error:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: "Validation error", error: error.errors });
    }
    return res.status(500).json({ message: "Internal server error", error });
  }
};

const updateWebContent = async (req, res) => {
  try {
    const { body, user } = req;
    const content = JSON.parse(body.data);
    const webContent = await WebContent.findOne({ user: user.id });
    if (!webContent) {
      return res.status(404).json({ message: "WebContent not found" });
    }
    const deleteFromCloudinary = async (url) => {
      if (!url?.includes("cloudinary")) return false;
      try {
        const matches = url.match(/\/v\d+\/(.+?)(?:\.[^.]+)?$/);
        if (!matches[1]) {
          return false;
        }
        const publicId = matches[1];
        const result = await cloudinary.uploader.destroy(publicId);
        return result.result === "ok";
      } catch (err) {
        console.error(`❌ Cloudinary deletion error for ${url}:`, err);
        return false;
      }
    };
    const changes = {
      deleted: [],
      updated: [],
    };
    if (req.files?.landing_image?.[0]) {
      const oldImageUrl = webContent.landing?.image;
      webContent.landing.image = req.files.landing_image[0].path;
      changes.updated.push("landing_image");
      if (oldImageUrl) {
        const deleted = await deleteFromCloudinary(oldImageUrl);
        if (deleted) changes.deleted.push("old_landing_image");
      }
    }
    if (req.files?.live_image?.[0]) {
      const oldImageUrl = webContent.live?.image;
      webContent.live.image = req.files.live_image[0].path;
      changes.updated.push("live_image");
      if (oldImageUrl) {
        const deleted = await deleteFromCloudinary(oldImageUrl);
        if (deleted) changes.deleted.push("old_live_image");
      }
    }
    if (req.files?.live_video?.[0]) {
      const oldVideoUrl = webContent.live?.video;
      webContent.live.video = req.files.live_video[0].path;
      changes.updated.push("live_video");
      if (oldVideoUrl) {
        const deleted = await deleteFromCloudinary(oldVideoUrl);
        if (deleted) changes.deleted.push("old_live_video");
      }
    }
    const orgImages = [];
    const orgCount = content.organizations?.length || 0;
    for (let i = 0; i < orgCount; i++) {
      const key = `org_image_${i}`;
      if (req.files?.[key]?.[0]) {
        const oldImageUrl =
          i < webContent.organizations.length ? webContent.organizations[i] : null;
        orgImages.push(req.files[key][0].path);
        changes.updated.push(`org_image_${i}`);
        if (oldImageUrl) {
          const deleted = await deleteFromCloudinary(oldImageUrl);
          if (deleted) changes.deleted.push(`old_org_image_${i}`);
        }
      } else if (content.organizations[i]) {
        orgImages.push(content.organizations[i]);
      } else if (i < webContent.organizations.length) {
        orgImages.push(webContent.organizations[i]);
      }
    }
    webContent.organizations = orgImages;
    if (req.files?.avatar?.[0]) {
      const oldAvatarUrl = webContent.available?.avatar;
      webContent.available.avatar = req.files.avatar[0].path;
      changes.updated.push("avatar");
      if (oldAvatarUrl) {
        const deleted = await deleteFromCloudinary(oldAvatarUrl);
        if (deleted) changes.deleted.push("old_avatar");
      }
    }
    webContent.landing = {
      ...webContent.landing,
      ...content.landing,
      image: webContent.landing.image,
    };
    webContent.slider = content.slider;
    webContent.value = content.value;
    webContent.live = {
      ...webContent.live,
      details: content.live.details,
    };
    webContent.timeline = content.timeline;
    webContent.available = {
      ...webContent.available,
      availableFor: content.available.availableFor,
    };
    webContent.socialChannels = content.socialChannels;
    webContent.isNewWebpage = false;
    const savedContent = await webContent.save();
    return res.status(200).json({
      message: "Web content updated successfully",
      data: savedContent,
      changes: changes,
    });
  } catch (error) {
    console.error("💥 Error updating web content:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

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
