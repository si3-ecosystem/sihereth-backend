const fs = require("node:fs");
const ejs = require("ejs");
const { v4: uuidv4 } = require("uuid");
const path = require("node:path");
const { File } = require("formdata-node");
const WebContent = require("../models/WebContent.model");
const User = require("../models/User.model");
const { uploadToFileStorage, deleteFromFileStorage } = require("../utils/fileStorage.utils");
const { registerSubdomain } = require("../controllers/domain.controller");

const publishWebContent = async (req, res) => {
  try {
    console.log(`[WebContent] Starting publish operation for user: ${req.user.id}`);
    const userId = req.user.id;
    const contentData = req.body;
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
      console.log(`[WebContent] Missing content data for user: ${userId}`);
      return res.status(400).json({ message: "Missing content data" });
    }
    const content = {
      landing: contentData.landing || {},
      slider: contentData.slider || [],
      value: contentData.value || {},
      live: contentData.live || {},
      organizations: contentData.organizations || [],
      timeline: contentData.timeline || [],
      available: contentData.available || {},
      socialChannels: contentData.socialChannels || [],
    };
    try {
      console.log(`[WebContent] Processing template for user: ${userId}`);
      const templateFile = fs.readFileSync(`${__dirname}/../template/index.ejs`);
      const template = ejs.compile(templateFile.toString());
      const renderedTemplate = template(content);
      const tempDir = path.join(__dirname, "../temp");
      if (!fs.existsSync(tempDir)) {
        console.log(`[WebContent] Creating temp directory for user: ${userId}`);
        fs.mkdirSync(tempDir, { recursive: true });
      }
      const filename = `${uuidv4()}.html`;
      const filePath = path.join(tempDir, filename);
      fs.writeFileSync(filePath, renderedTemplate);
      const file = new File([Buffer.from(renderedTemplate)], filename, {
        type: "text/html",
      });
      console.log(`[WebContent] Uploading to storage for user: ${userId}`);
      const cid = await uploadToFileStorage(file);
      let webContent = await WebContent.findOne({ user: userId });
      if (webContent) {
        console.log(`[WebContent] Updating existing content for user: ${userId}`);
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
      } else {
        console.log(`[WebContent] Creating new content for user: ${userId}`);
        webContent = new WebContent({
          user: userId,
          contentHash: cid,
          isNewWebpage: contentData.isNewWebpage || false,
          landing: content.landing,
          slider: content.slider,
          value: content.value,
          live: content.live,
          organizations: content.organizations,
          timeline: content.timeline,
          available: content.available,
          socialChannels: content.socialChannels,
        });
      }
      await webContent.save();
      fs.unlinkSync(filePath);
      console.log(`[WebContent] Successfully published for user: ${userId}`);
      return res.status(201).json({
        message: "Published successfully",
      });
    } catch (templateError) {
      console.error(`[WebContent] Template error for user: ${userId}`, {
        message: templateError.message,
        line: templateError.line,
      });
      return res.status(400).json({
        message: "Template rendering error",
        error: templateError.message,
        line: templateError.line,
      });
    }
  } catch (error) {
    console.error(`[WebContent] Error in publish operation for user: ${req.user.id}`, {
      name: error.name,
      message: error.message,
    });
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: "Validation error", error: error.errors });
    }
    return res.status(500).json({ message: "Internal server error", error });
  }
};

const updateWebContent = async (req, res) => {
  try {
    console.log(`[WebContent] Starting update operation for user: ${req.user.id}`);
    const userId = req.user.id;
    const contentData = req.body;
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
      console.log(`[WebContent] Missing content data for update - user: ${userId}`);
      return res.status(400).json({ message: "Missing content data" });
    }
    const [webContent, user] = await Promise.all([
      WebContent.findOne({ user: userId }),
      User.findById(userId),
    ]);
    if (!webContent) {
      console.log(`[WebContent] No content found to update for user: ${userId}`);
      return res.status(404).json({ message: "No web content found to update" });
    }
    console.log(`[WebContent] Deleting old content from storage for user: ${userId}`);
    console.log("webContent.contentHash", webContent.contentHash);
    await deleteFromFileStorage(webContent.contentHash);
    const content = {
      landing: contentData.landing || webContent.landing || {},
      slider: contentData.slider || webContent.slider || [],
      value: contentData.value || webContent.value || {},
      live: contentData.live || webContent.live || {},
      organizations: contentData.organizations || webContent.organizations || [],
      timeline: contentData.timeline || webContent.timeline || [],
      available: contentData.available || webContent.available || {},
      socialChannels: contentData.socialChannels || webContent.socialChannels || [],
    };
    try {
      console.log(`[WebContent] Processing template for update - user: ${userId}`);
      const templateFile = fs.readFileSync(`${__dirname}/../template/index.ejs`);
      const template = ejs.compile(templateFile.toString());
      const renderedTemplate = template(content);
      const tempDir = path.join(__dirname, "../temp");
      if (!fs.existsSync(tempDir)) {
        console.log(`[WebContent] Creating temp directory for update - user: ${userId}`);
        fs.mkdirSync(tempDir, { recursive: true });
      }
      const filename = `${uuidv4()}.html`;
      const filePath = path.join(tempDir, filename);
      fs.writeFileSync(filePath, renderedTemplate);
      const file = new File([Buffer.from(renderedTemplate)], filename, {
        type: "text/html",
      });
      console.log(`[WebContent] Uploading updated content for user: ${userId}`);
      const newCid = await uploadToFileStorage(file);
      webContent.contentHash = newCid;
      webContent.landing = content.landing;
      webContent.slider = content.slider;
      webContent.value = content.value;
      webContent.live = content.live;
      webContent.organizations = content.organizations;
      webContent.timeline = content.timeline;
      webContent.available = content.available;
      webContent.socialChannels = content.socialChannels;
      await webContent.save();
      fs.unlinkSync(filePath);
      if (user?.domain) {
        console.log(`[WebContent] Registering subdomain for user: ${userId}`);
        await registerSubdomain(user.domain, newCid);
      }
      console.log(`[WebContent] Successfully updated content for user: ${userId}`);
      return res.status(200).json({
        message: "Content updated successfully",
        contentHash: newCid,
      });
    } catch (templateError) {
      console.error(`[WebContent] Template error during update for user: ${userId}`, {
        message: templateError.message,
        line: templateError.line,
      });
      return res.status(400).json({
        message: "Template rendering error",
        error: templateError.message,
        line: templateError.line,
      });
    }
  } catch (error) {
    console.error(`[WebContent] Error in update operation for user: ${req.user.id}`, {
      name: error.name,
      message: error.message,
    });
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: "Validation error", error: error.errors });
    }
    return res.status(500).json({ message: "Internal server error", error });
  }
};

module.exports = {
  publishWebContent,
  updateWebContent,
};
