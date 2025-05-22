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
    const userId = req.user.id;
    const contentData = JSON.parse(req.body.data);
    if (
      !contentData.landing &&
      !contentData.slider &&
      !contentData.value &&
      !contentData.live &&
      !contentData.organizations &&
      !contentData.timeline &&
      !contentData.available &&
      !contentData.socialChannels
    ) {
      return res.status(400).json({ message: "Missing content data" });
    }
    const content = {
      landing: {
        fullName: contentData.landing?.fullName || "",
        title: contentData.landing?.title || "",
        headline: contentData.landing?.headline || "",
        hashTags: contentData.landing?.hashTags || [],
        region: contentData.landing?.region || "",
        organizationAffiliations: contentData.landing?.organizationAffiliations || [],
        communityAffiliations: contentData.landing?.communityAffiliations || [],
        superPowers: contentData.landing?.superPowers || [],
        image: contentData.landing?.image || "",
        pronoun: contentData.landing?.pronoun || "",
      },
      slider: contentData.slider || [],
      value: {
        experience: contentData.value?.experience || "",
        values: contentData.value?.values || "",
      },
      live: {
        image: contentData.live?.image || "",
        video: contentData.live?.video || "",
        url: contentData.live?.url || "",
        walletUrl: contentData.live?.walletUrl || "",
        details: contentData.live?.details || [],
      },
      organizations: [],
      timeline: contentData.timeline || [],
      available: {
        avatar: contentData.available?.avatar || "",
        availableFor: contentData.available?.availableFor || [],
        ctaUrl: contentData.available?.ctaUrl || "",
        ctaText: contentData.available?.ctaText || "",
      },
      socialChannels: contentData.socialChannels || [],
    };

    if (req.files?.landing_image?.[0]) {
      content.landing.image = req.files.landing_image[0].path;
    }
    if (req.files?.live_image?.[0]) {
      content.live.image = req.files.live_image[0].path;
    }
    if (req.files?.live_video?.[0]) {
      content.live.video = req.files.live_video[0].path;
    }
    if (req.files?.avatar_image?.[0]) {
      content.available.avatar = req.files.avatar_image[0].path;
    }

    const organizations = [];
    if (contentData.organizations && Array.isArray(contentData.organizations)) {
      for (let i = 0; i < contentData.organizations.length; i++) {
        const orgImageKey = `org_image_${i}`;
        if (req.files?.[orgImageKey]?.[0]) {
          organizations.push({ src: req.files[orgImageKey][0].path });
        } else if (typeof contentData.organizations[i] === "string") {
          organizations.push({ src: contentData.organizations[i] });
        } else if (contentData.organizations[i]?.src) {
          organizations.push({ src: contentData.organizations[i].src });
        }
      }
    }
    content.organizations = organizations;

    if (content.socialChannels && Array.isArray(content.socialChannels)) {
      content.socialChannels = content.socialChannels.map((channel, index) => {
        const iconKey = `social_icon_${index}`;
        return {
          text: channel.text || "",
          url: channel.url || "",
          icon: req.files?.[iconKey]?.[0]?.path || channel.icon || "",
        };
      });
    }

    if (!content.landing.title && content.landing.fullName) {
      content.landing.title = content.landing.fullName;
    }

    console.log("Content mapped for template:", content);

    const templateFile = fs.readFileSync(`${__dirname}/../template/index.ejs`);
    console.log("Template read");

    try {
      const template = ejs.compile(templateFile.toString());
      const renderedTemplate = template(content);
      console.log("Template rendered");

      const tempDir = path.join(__dirname, "../temp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const filename = `${uuidv4()}.html`;
      const filePath = path.join(tempDir, filename);

      fs.writeFileSync(filePath, renderedTemplate);
      console.log(`Template saved to temp directory: ${filePath}`);

      const file = new File([Buffer.from(renderedTemplate)], filename, {
        type: "text/html",
      });

      const cid = await uploadToFileStorage(file);
      console.log(`File uploaded to Pinata with CID: ${cid}`);

      const webContent = new WebContent({
        user: userId,
        contentHash: cid,
        isNewWebpage: false,
        landing: content.landing,
        slider: content.slider,
        value: content.value,
        live: content.live,
        organizations: content.organizations,
        timeline: content.timeline,
        available: content.available,
        socialChannels: content.socialChannels,
      });

      const savedContent = await webContent.save();

      await User.findByIdAndUpdate(userId, { isNewWebpage: false });

      return res.status(201).json({
        message: "Published successfully",
        data: savedContent,
        tempFilePath: filePath,
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

    const changes = {
      deleted: [],
      updated: [],
    };

    // Handle landing image update
    if (req.files?.landing_image?.[0]) {
      if (webContent.landing?.image) {
        await deleteFromFileStorage(webContent.landing.image);
        changes.deleted.push("old_landing_image");
      }
      webContent.landing.image = req.files.landing_image[0].path;
      changes.updated.push("landing_image");
    }

    // Handle live image update
    if (req.files?.live_image?.[0]) {
      if (webContent.live?.image) {
        await deleteFromFileStorage(webContent.live.image);
        changes.deleted.push("old_live_image");
      }
      webContent.live.image = req.files.live_image[0].path;
      changes.updated.push("live_image");
    }

    // Handle live video update
    if (req.files?.live_video?.[0]) {
      if (webContent.live?.video) {
        await deleteFromFileStorage(webContent.live.video);
        changes.deleted.push("old_live_video");
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
        const oldImageUrl =
          i < webContent.organizations.length ? webContent.organizations[i]?.src : null;
        if (oldImageUrl) {
          await deleteFromFileStorage(oldImageUrl);
          changes.deleted.push(`old_org_image_${i}`);
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
      if (webContent.available?.avatar) {
        await deleteFromFileStorage(webContent.available.avatar);
        changes.deleted.push("old_avatar");
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

    // Delete all media files
    const filesToDelete = [
      webContent.landing?.image,
      webContent.live?.image,
      webContent.live?.video,
      webContent.available?.avatar,
      ...(webContent.organizations || []).map((org) => org.src).filter(Boolean),
    ];

    // Delete all files in parallel
    await Promise.all(filesToDelete.map((file) => deleteFromFileStorage(file)));

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
