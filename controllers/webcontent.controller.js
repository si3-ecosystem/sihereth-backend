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
const User = require("../models/User.model");

const publishWebContent = async (req, res) => {
  try {
    console.log("🚀 Starting web content publication process...");
    const userId = req.user.id;
    console.log("👤 User ID:", userId);

    const contentData = JSON.parse(req.body.data);
    console.log("📦 Received content data structure:", {
      hasLanding: !!contentData.landing,
      hasSlider: !!contentData.slider,
      hasValue: !!contentData.value,
      hasLive: !!contentData.live,
      hasOrganizations: !!contentData.organizations,
      hasTimeline: !!contentData.timeline,
      hasAvailable: !!contentData.available,
      hasSocialChannels: !!contentData.socialChannels,
    });

    // Validate required content
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
      console.log("❌ Missing content data");
      return res.status(400).json({ message: "Missing content data" });
    }

    // Map content
    console.log("🔄 Mapping content data...");
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
      users: contentData.users || [],
    };

    // Handle file uploads to Cloudinary
    console.log("📤 Processing file uploads...");
    if (req.files?.landing_image?.[0]) {
      console.log("✅ Uploading landing image to Cloudinary");
      const result = await cloudinary.uploader.upload(req.files.landing_image[0].path);
      content.landing.image = result.secure_url;
    }
    if (req.files?.live_image?.[0]) {
      console.log("✅ Uploading live image to Cloudinary");
      const result = await cloudinary.uploader.upload(req.files.live_image[0].path);
      content.live.image = result.secure_url;
    }
    if (req.files?.live_video?.[0]) {
      console.log("✅ Uploading live video to Cloudinary");
      const result = await cloudinary.uploader.upload(req.files.live_video[0].path, {
        resource_type: "video",
      });
      content.live.video = result.secure_url;
    }
    if (req.files?.avatar_image?.[0]) {
      console.log("✅ Uploading avatar image to Cloudinary");
      const result = await cloudinary.uploader.upload(req.files.avatar_image[0].path);
      content.available.avatar = result.secure_url;
    }

    // Process organizations
    console.log("🏢 Processing organization images...");
    const organizations = [];
    if (contentData.organizations && Array.isArray(contentData.organizations)) {
      for (let i = 0; i < contentData.organizations.length; i++) {
        const orgImageKey = `org_image_${i}`;
        if (req.files?.[orgImageKey]?.[0]) {
          console.log(`✅ Uploading organization image ${i + 1} to Cloudinary`);
          const result = await cloudinary.uploader.upload(req.files[orgImageKey][0].path);
          organizations.push({ src: result.secure_url });
        } else if (typeof contentData.organizations[i] === "string") {
          organizations.push({ src: contentData.organizations[i] });
        } else if (contentData.organizations[i]?.src) {
          organizations.push({ src: contentData.organizations[i].src });
        }
      }
    }
    content.organizations = organizations;

    // Process social channels
    console.log("🔗 Processing social channels...");
    if (content.socialChannels && Array.isArray(content.socialChannels)) {
      content.socialChannels = await Promise.all(
        content.socialChannels.map(async (channel, index) => {
          const iconKey = `social_icon_${index}`;
          let iconUrl = channel.icon || "";
          if (req.files?.[iconKey]?.[0]) {
            console.log(`✅ Uploading social icon ${index + 1} to Cloudinary`);
            const result = await cloudinary.uploader.upload(req.files[iconKey][0].path);
            iconUrl = result.secure_url;
          }
          return {
            text: channel.text || "",
            url: channel.url || "",
            icon: iconUrl,
          };
        })
      );
    }

    // Fetch latest 10 users and their profile images for the people slider
    const latestUsers = await User.find().sort({ createdAt: -1 }).limit(10);
    const usersWithImages = await Promise.all(
      latestUsers.map(async (user) => {
        const webContent = await WebContent.findOne({ user: user._id });
        return {
          fullName: webContent?.landing?.fullName || user.name || user.email || "User",
          image:
            webContent?.landing?.image ||
            "https://res.cloudinary.com/dq033xs8n/image/upload/v1710000000/default-avatar.png",
          // domain: user.domain || "",
        };
      })
    );
    content.users = usersWithImages;

    console.log("📝 Content mapping completed");

    // Template processing
    console.log("📄 Reading template file...");
    const templateFile = fs.readFileSync(`${__dirname}/../template/index.ejs`);
    console.log("✅ Template file read successfully");

    try {
      console.log("🔄 Compiling template...");
      const template = ejs.compile(templateFile.toString());
      console.log("🟣 Content passed to EJS:", JSON.stringify(content, null, 2));
      const renderedTemplate = template(content);
      console.log("✅ Template rendered successfully");

      // Create temp directory if it doesn't exist
      const tempDir = path.join(__dirname, "../temp");
      if (!fs.existsSync(tempDir)) {
        console.log("📁 Creating temp directory...");
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const filename = `${uuidv4()}.html`;
      const filePath = path.join(tempDir, filename);
      console.log("💾 Saving template to:", filePath);

      fs.writeFileSync(filePath, renderedTemplate);
      console.log("✅ Template saved successfully");

      // Create file for IPFS upload
      console.log("📦 Preparing file for IPFS upload...");
      const file = new File([Buffer.from(renderedTemplate)], filename, {
        type: "text/html",
      });

      console.log("🚀 Uploading to IPFS...");
      const cid = await uploadToFileStorage(file);
      console.log("✅ File uploaded to IPFS with CID:", cid);

      // Create and save web content
      console.log("💾 Creating web content document...");
      // Check if web content already exists for this user
      let webContent = await WebContent.findOne({ user: userId });

      if (webContent) {
        console.log("📝 Updating existing web content...");
        // Update existing web content
        webContent.contentHash = cid;
        webContent.isNewWebpage = false;
        webContent.landing = content.landing;
        webContent.slider = content.slider;
        webContent.value = content.value;
        webContent.live = content.live;
        webContent.organizations = content.organizations;
        webContent.timeline = content.timeline;
        webContent.available = content.available;
        webContent.socialChannels = content.socialChannels;
        webContent.users = content.users;
      } else {
        console.log("📝 Creating new web content...");
        // Create new web content
        webContent = new WebContent({
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
          users: content.users,
        });
      }

      console.log("💾 Saving web content to database...");
      const savedContent = await webContent.save();
      console.log("✅ Web content saved successfully");

      console.log("👤 Updating user status...");
      await User.findByIdAndUpdate(userId, { isNewWebpage: false });
      console.log("✅ User status updated successfully");

      console.log("🎉 Publication process completed successfully!");
      return res.status(201).json({
        message: "Published successfully",
        data: savedContent,
        tempFilePath: filePath,
      });
    } catch (templateError) {
      console.error("❌ Template rendering error:", templateError);
      return res.status(400).json({
        message: "Template rendering error",
        error: templateError.message,
        line: templateError.line,
      });
    }
  } catch (error) {
    console.error("💥 Fatal error in publishWebContent:", error);
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
        // Delete old image from Cloudinary if it exists
        const publicId = webContent.landing.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId);
        changes.deleted.push("old_landing_image");
      }
      const result = await cloudinary.uploader.upload(req.files.landing_image[0].path);
      webContent.landing.image = result.secure_url;
      changes.updated.push("landing_image");
    }

    // Handle live image update
    if (req.files?.live_image?.[0]) {
      if (webContent.live?.image) {
        const publicId = webContent.live.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId);
        changes.deleted.push("old_live_image");
      }
      const result = await cloudinary.uploader.upload(req.files.live_image[0].path);
      webContent.live.image = result.secure_url;
      changes.updated.push("live_image");
    }

    // Handle live video update
    if (req.files?.live_video?.[0]) {
      if (webContent.live?.video) {
        const publicId = webContent.live.video.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId);
        changes.deleted.push("old_live_video");
      }
      const result = await cloudinary.uploader.upload(req.files.live_video[0].path, {
        resource_type: "video",
      });
      webContent.live.video = result.secure_url;
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
          const publicId = oldImageUrl.split("/").pop().split(".")[0];
          await cloudinary.uploader.destroy(publicId);
          changes.deleted.push(`old_org_image_${i}`);
        }
        const result = await cloudinary.uploader.upload(req.files[key][0].path);
        orgImages.push({ src: result.secure_url });
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
        const publicId = webContent.available.avatar.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId);
        changes.deleted.push("old_avatar");
      }
      const result = await cloudinary.uploader.upload(req.files.avatar[0].path);
      webContent.available.avatar = result.secure_url;
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
