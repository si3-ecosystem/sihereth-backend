const fs = require("fs");
const ejs = require("ejs");
const { v4: uuidv4 } = require("uuid");
const WebContent = require("../models/WebContent.model");
const { uploadToFileStorage, deleteFromFileStorage } = require("../utils/fileStorage.utils");
const { registerSubdomain } = require("../utils/namestone.util");
const { PINATA_GATEWAY } = require("../consts");
const {
  validateWebContent,
  validateContentStructure,
} = require("../validations/webcontent.validations");

const publishWebContent = async (req, res) => {
  try {
    const { body, user } = req;

    if (!validateContentStructure(body)) {
      return res.status(400).send("Invalid web content structure");
    }

    const error = validateWebContent(body);
    if (error) return res.status(400).send(error);

    const existingContent = await WebContent.findOne({ user: user._id });
    if (existingContent) {
      return res.status(400).send("Web content already exists for this user");
    }

    const templateFile = fs.readFileSync(`${__dirname}/../../template/index.ejs`);
    const template = ejs.compile(templateFile.toString());
    const renderedTemplate = template(body);

    const fileBlob = new Blob([renderedTemplate], { type: "text/html" });
    const file = new File([fileBlob], `${uuidv4()}.html`, {
      type: "text/html",
    });
    const cid = await uploadToFileStorage(file);

    const webContent = new WebContent({
      user: user._id,
      cid,
      ...body,
      isNewWebpage: true,
    });

    await webContent.save();

    return res.send({
      ...webContent.toJSON(),
      url: `${PINATA_GATEWAY}/${webContent.cid}`,
    });
  } catch (error) {
    console.error("Error creating web content:", error);
    return res.status(500).send("Internal server error");
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
  getWebContent,
  deleteWebContent,
};
