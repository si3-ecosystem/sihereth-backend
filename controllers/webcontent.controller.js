const fs = require("node:fs");
const ejs = require("ejs");
const { v4: uuidv4 } = require("uuid");
const path = require("node:path");
const { File } = require("formdata-node");
const WebContent = require("../models/WebContent.model");
const { deleteFromFileStorage } = require("../utils/fileStorage.utils");
const { registerSubdomain } = require("../utils/namestone.util");
const { PINATA_GATEWAY } = require("../consts");
const { uploadToFileStorage } = require("../utils/fileStorage.utils");
const { cloudinary } = require("../utils/cloudinary");

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
      pronoun: "",
      region: "",
      image: "",
      sliderData: [],
      organizationAffiliations: [],
      communityAffiliations: [],
      superPowers: [],
      valueData: {
        experience: "",
        values: ""
      },
      liveData: {
        image: "",
        video: "",
        url: "",
        walletUrl: "",
        details: []
      },
      timeline: [],
      organizations: [],
      users: [],
      avatar: "",
      availableFor: [],
      socialChannels: [],
      languagesByRegion: { Global: ["English"] },
      leading: {
        headline: "",
        hashTags: []
      },
      ctaUrl: "",
      ctaText: ""
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
        if (key === "leading") {
          content.leading = {
            ...defaultValues.leading,
            ...userContent.leading,
            hashTags: userContent.leading?.hashTags || [],
          };
        } else if (key === "valueData") {
          // Handle valueData object and create valueData for template
          content.valueData = {
            experience: userContent.valueData?.experience || "",
            values: userContent.valueData?.values || ""
          };
        } else if (key === "liveData") {
          // Handle liveData object and create liveData for template
          content.liveData = {
            image: userContent.liveData?.image || "",
            video: userContent.liveData?.video || "",
            url: userContent.liveData?.url || "",
            walletUrl: userContent.liveData?.walletUrl || "",
            details: Array.isArray(userContent.liveData?.details)
              ? userContent.liveData.details
              : []
          };
        } else if (key === "available") {
          // Extract availableFor from available object
          content.availableFor = userContent.available?.availableFor || [];
          content.ctaUrl = userContent.available?.ctaUrl || "";
          content.ctaText = userContent.available?.ctaText || "";
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

    // Process file uploads
    if (req.files?.profile_image?.[0]) {
      content.image = req.files.profile_image[0].path;
    }
    if (req.files?.live_image?.[0]) {
      content.liveData.image = req.files.live_image[0].path;
    }
    if (req.files?.live_video?.[0]) {
      content.liveData.video = req.files.live_video[0].path;
    }
    if (req.files?.avatar_image?.[0]) {
      content.avatar = req.files.avatar_image[0].path;
    }
    const orgImages = [];
    const orgCount = content.organizations?.length || 0;
    for (let i = 0; i < orgCount; i++) {
      const key = `org_image_${i}`;
      if (req.files?.[key]?.[0]) {
        orgImages.push({ src: req.files[key][0].path });
      } else if (typeof content.organizations[i] === "string") {
        orgImages.push({ src: content.organizations[i] }); // Wrap string in object
      } else if (content.organizations[i]?.src) {
        orgImages.push({ src: content.organizations[i].src }); // Normalize object
      }
    }
    content.organizations = orgImages;

    // Ensure slider data is properly formatted
    if (userContent.slider && Array.isArray(userContent.slider)) {
      content.slider = userContent.slider.map((item) => {
        if (typeof item === "object") {
          return `${item.title}: ${item.description}`;
        }
        return item;
      });
    } else if (userContent.sliderData && Array.isArray(userContent.sliderData)) {
      content.slider = userContent.sliderData.map((item) => {
        if (typeof item === "object") {
          return `${item.title}: ${item.description}`;
        }
        return item;
      });
    } else {
      content.slider = [];
    }

    // Log slider data for debugging
    console.log("Slider data after processing:", content.slider);

    // If no avatar but profile image exists, use profile image as avatar
    if (!content.avatar && content.image) {
      content.avatar = content.image;
    }

    // Format social channels
    if (content.socialChannels) {
      if (!Array.isArray(content.socialChannels)) {
        const channels = [];
        if (content.socialChannels.twitter) {
          channels.push({ text: "Twitter", url: content.socialChannels.twitter, icon: "https://res.cloudinary.com/dq033xs8n/image/upload/v1744345809/twitter_icon.png" });
        }
        if (content.socialChannels.linkedin) {
          channels.push({ text: "LinkedIn", url: content.socialChannels.linkedin, icon: "https://res.cloudinary.com/dq033xs8n/image/upload/v1744345809/linkedin_icon.png" });
        }
        if (content.socialChannels.github) {
          channels.push({ text: "GitHub", url: content.socialChannels.github, icon: "https://res.cloudinary.com/dq033xs8n/image/upload/v1744345809/github_icon.png" });
        }
        if (content.socialChannels.instagram) {
          channels.push({ text: "Instagram", url: content.socialChannels.instagram, icon: "https://res.cloudinary.com/dq033xs8n/image/upload/v1744345809/instagram_icon.png" });
        }
        content.socialChannels = channels;
      }
    }

    // Set title for template
    if (!content.title && content.fullName) {
      content.title = content.fullName;
    }

    // Ensure organization affiliations have default empty array
    content.organizationAffiliations = content.organizationAffiliations || [];
    content.communityAffiliations = content.communityAffiliations || [];
    content.superPowers = content.superPowers || [];

    // Make sure users array exists 
    content.users = Array.isArray(content.users) ? content.users : [];

    // Ensure hashTags are properly set
    content.hashTags = content.hashTags || [];
    content.leading = {
      ...content.leading,
      hashTags: content.hashTags,
      headline: content.headline || ""
    };

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

      // Create file object for upload using formdata-node
      const file = new File([Buffer.from(renderedTemplate)], filename, {
        type: "text/html",
      });

      // Upload to Pinata
      const cid = await uploadToFileStorage(file);
      console.log(`File uploaded to Pinata with CID: ${cid}`);

      // Create and save web content
      const webContent = new WebContent({
        user: user.id,
        contentHash: cid,
        isNewWebpage: false,
        // Map fields to schema
        landing: {
          hashTags: content.hashTags || [],
          organizationAffiliations: content.organizationAffiliations || [],
          communityAffiliations: content.communityAffiliations || [],
          superPowers: content.superPowers || [],
          fullName: content.fullName,
          title: content.title,
          region: content.region,
          image: content.image,
          pronoun: content.pronoun,
          headline: content.headline
        },
        slider: content.slider || [],
        value: {
          experience: content.valueData?.experience || "",
          values: content.valueData?.values || ""
        },
        live: {
          image: content.liveData?.image || "",
          video: content.liveData?.video || "",
          url: content.liveData?.url || "",
          walletUrl: content.liveData?.walletUrl || "",
          details: content.liveData?.details || []
        },
        available: {
          avatar: content.avatar,
          availableFor: content.availableFor || [],
          ctaUrl: content.ctaUrl || "",
          ctaText: content.ctaText || ""
        },
        organizations: content.organizations,
        timeline: content.timeline,
        socialChannels: content.socialChannels || [],
        languagesByRegion: content.languagesByRegion || { Global: ["English"] }
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

const deleteAllCloudinaryFiles = async (webContent) => {
  const filesToDelete = [];
  
  // Add all media files to delete list
  if (webContent.landing?.image) filesToDelete.push(webContent.landing.image);
  if (webContent.live?.image) filesToDelete.push(webContent.live.image);
  if (webContent.live?.video) filesToDelete.push(webContent.live.video);
  if (webContent.available?.avatar) filesToDelete.push(webContent.available.avatar);
  
  // Add organization images
  if (webContent.organizations) {
    webContent.organizations.forEach(org => {
      if (org.src) filesToDelete.push(org.src);
    });
  }

  // Delete all files
  const deletePromises = filesToDelete.map(url => deleteFromCloudinary(url));
  await Promise.all(deletePromises);
};

const updateWebContent = async (req, res) => {
  try {
    const { body, user } = req;
    const content = JSON.parse(body.data);
    const webContent = await WebContent.findOne({ user: user.id });
    if (!webContent) {
      return res.status(404).json({ message: "WebContent not found" });
    }

    const changes = {
      deleted: [],
      updated: [],
    };

    // Handle landing image update
    if (req.files?.landing_image?.[0]) {
      const oldImageUrl = webContent.landing?.image;
      if (oldImageUrl) {
        const deleted = await deleteFromCloudinary(oldImageUrl);
        if (deleted) changes.deleted.push("old_landing_image");
      }
      webContent.landing.image = req.files.landing_image[0].path;
      changes.updated.push("landing_image");
    }

    // Handle live image update
    if (req.files?.live_image?.[0]) {
      const oldImageUrl = webContent.live?.image;
      if (oldImageUrl) {
        const deleted = await deleteFromCloudinary(oldImageUrl);
        if (deleted) changes.deleted.push("old_live_image");
      }
      webContent.live.image = req.files.live_image[0].path;
      changes.updated.push("live_image");
    }

    // Handle live video update
    if (req.files?.live_video?.[0]) {
      const oldVideoUrl = webContent.live?.video;
      if (oldVideoUrl) {
        const deleted = await deleteFromCloudinary(oldVideoUrl);
        if (deleted) changes.deleted.push("old_live_video");
      }
      webContent.live.video = req.files.live_video[0].path;
      changes.updated.push("live_video");
    }

    // Handle organization images update
    const orgImages = [];
    const orgCount = content.organizations?.length || 0;
    for (let i = 0; i < orgCount; i++) {
      const key = `org_image_${i}`;
      if (req.files?.[key]?.[0]) {
        const oldImageUrl = i < webContent.organizations.length ? webContent.organizations[i]?.src : null;
        if (oldImageUrl) {
          const deleted = await deleteFromCloudinary(oldImageUrl);
          if (deleted) changes.deleted.push(`old_org_image_${i}`);
        }
        orgImages.push({ src: req.files[key][0].path });
        changes.updated.push(`org_image_${i}`);
      } else if (content.organizations[i]) {
        orgImages.push(content.organizations[i]);
      } else if (i < webContent.organizations.length) {
        orgImages.push(webContent.organizations[i]);
      }
    }
    webContent.organizations = orgImages;

    // Handle avatar update
    if (req.files?.avatar?.[0]) {
      const oldAvatarUrl = webContent.available?.avatar;
      if (oldAvatarUrl) {
        const deleted = await deleteFromCloudinary(oldAvatarUrl);
        if (deleted) changes.deleted.push("old_avatar");
      }
      webContent.available.avatar = req.files.avatar[0].path;
      changes.updated.push("avatar");
    }

    // Update other content fields
    webContent.landing = {
      ...webContent.landing,
      ...content.landing,
      image: webContent.landing.image,
    };
    webContent.slider = content.slider;
    webContent.value = content.value;
    webContent.live = {
      ...webContent.live,
      ...content.live,
      image: webContent.live.image,
      video: webContent.live.video,
    };
    webContent.timeline = content.timeline;
    webContent.available = {
      ...webContent.available,
      ...content.available,
      avatar: webContent.available.avatar,
    };
    webContent.socialChannels = content.socialChannels;
    webContent.languagesByRegion = content.languagesByRegion || { Global: ["English"] };
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

    // Delete all media files from Cloudinary
    await deleteAllCloudinaryFiles(webContent);

    // Delete from IPFS
    const { cid } = webContent;
    await deleteFromFileStorage(cid);

    // Delete from database
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
