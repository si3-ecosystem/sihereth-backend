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
      const templateFile = fs.readFileSync(`${__dirname}/../template/index.ejs`);
      const template = ejs.compile(templateFile.toString());
      const renderedTemplate = template(content);
      const tempDir = path.join(__dirname, "../temp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      const filename = `${uuidv4()}.html`;
      const filePath = path.join(tempDir, filename);
      fs.writeFileSync(filePath, renderedTemplate);
      const file = new File([Buffer.from(renderedTemplate)], filename, {
        type: "text/html",
      });
      const cid = await uploadToFileStorage(file);
      let webContent = await WebContent.findOne({ user: userId });
      if (webContent) {
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
      return res.status(201).json({
        message: "Published successfully",
      });
    } catch (templateError) {
      return res.status(400).json({
        message: "Template rendering error",
        error: templateError.message,
        line: templateError.line,
      });
    }
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: "Validation error", error: error.errors });
    }
    return res.status(500).json({ message: "Internal server error", error });
  }
};

const updateWebContent = async (req, res) => {
  try {
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
      return res.status(400).json({ message: "Missing content data" });
    }
    const [webContent, user] = await Promise.all([
      WebContent.findOne({ user: userId }),
      User.findById(userId),
    ]);
    if (!webContent) {
      return res.status(404).json({ message: "No web content found to update" });
    }
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
      const templateFile = fs.readFileSync(`${__dirname}/../template/index.ejs`);
      const template = ejs.compile(templateFile.toString());
      const renderedTemplate = template(content);
      const tempDir = path.join(__dirname, "../temp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      const filename = `${uuidv4()}.html`;
      const filePath = path.join(tempDir, filename);
      fs.writeFileSync(filePath, renderedTemplate);
      const file = new File([Buffer.from(renderedTemplate)], filename, {
        type: "text/html",
      });
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
        await registerSubdomain(user.domain, newCid);
      }
      return res.status(200).json({
        message: "Content updated successfully",
        contentHash: newCid,
      });
    } catch (templateError) {
      return res.status(400).json({
        message: "Template rendering error",
        error: templateError.message,
        line: templateError.line,
      });
    }
  } catch (error) {
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
