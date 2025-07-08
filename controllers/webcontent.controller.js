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

    // Validate user ID
    if (!userId) {
      console.error(`[WebContent] Invalid user ID in publish operation`);
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Log content sections being updated
    console.log(`[WebContent] Content sections to update:`, {
      hasLanding: !!contentData.landing,
      hasSlider: !!contentData.slider,
      hasValue: !!contentData.value,
      hasLive: !!contentData.live,
      hasOrganizations: !!contentData.organizations,
      hasTimeline: !!contentData.timeline,
      hasAvailable: !!contentData.available,
      hasSocialChannels: !!contentData.socialChannels
    });

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
      
      // Read template file with error handling
      let templateFile;
      try {
        templateFile = fs.readFileSync(`${__dirname}/../template/index.ejs`);
      } catch (readError) {
        console.error(`[WebContent] Error reading template file:`, {
          error: readError.message,
          code: readError.code,
          path: `${__dirname}/../template/index.ejs`
        });
        throw new Error(`Failed to read template file: ${readError.message}`);
      }

      // Compile template with error handling
      let template;
      try {
        template = ejs.compile(templateFile.toString());
      } catch (compileError) {
        console.error(`[WebContent] Error compiling template:`, {
          error: compileError.message,
          line: compileError.line,
          column: compileError.column
        });
        throw new Error(`Failed to compile template: ${compileError.message}`);
      }

      // Render template with error handling
      let renderedTemplate;
      try {
        renderedTemplate = template(content);
      } catch (renderError) {
        console.error(`[WebContent] Error rendering template:`, {
          error: renderError.message,
          line: renderError.line,
          column: renderError.column
        });
        throw new Error(`Failed to render template: ${renderError.message}`);
      }

      const filename = `${uuidv4()}.html`;
      const file = new File([Buffer.from(renderedTemplate)], filename, {
        type: "text/html",
      });

      console.log(`[WebContent] Uploading to storage for user: ${userId}`);
      let cid;
      try {
        cid = await uploadToFileStorage(file);
        console.log(`[WebContent] Successfully uploaded to storage, CID: ${cid}`);
      } catch (uploadError) {
        console.error(`[WebContent] Error uploading to storage:`, {
          error: uploadError.message,
          code: uploadError.code,
          userId
        });
        throw new Error(`Failed to upload to storage: ${uploadError.message}`);
      }

      let webContent;
      try {
        webContent = await WebContent.findOne({ user: userId });
      } catch (dbError) {
        console.error(`[WebContent] Error finding web content:`, {
          error: dbError.message,
          code: dbError.code,
          userId
        });
        throw new Error(`Database error: ${dbError.message}`);
      }

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

      try {
        await webContent.save();
        console.log(`[WebContent] Successfully saved content for user: ${userId}`);
      } catch (saveError) {
        console.error(`[WebContent] Error saving web content:`, {
          error: saveError.message,
          code: saveError.code,
          userId,
          validationErrors: saveError.errors
        });
        throw new Error(`Failed to save content: ${saveError.message}`);
      }

      console.log(`[WebContent] Successfully published for user: ${userId}`);
      return res.status(201).json({
        message: "Published successfully",
      });
    } catch (templateError) {
      console.error(`[WebContent] Template error for user: ${userId}`, {
        message: templateError.message,
        line: templateError.line,
        stack: templateError.stack
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
      stack: error.stack,
      code: error.code
    });
    if (error.name === "ValidationError") {
      return res.status(400).json({ 
        message: "Validation error", 
        error: error.errors,
        details: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }))
      });
    }
    return res.status(500).json({ 
      message: "Internal server error", 
      error: error.message,
      code: error.code
    });
  }
};

const updateWebContent = async (req, res) => {
  try {
    console.log(`[WebContent] Starting update operation for user: ${req.user.id}`);
    const userId = req.user.id;
    const contentData = req.body;

    // Validate user ID
    if (!userId) {
      console.error(`[WebContent] Invalid user ID in update operation`);
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Log content sections being updated
    console.log(`[WebContent] Content sections to update:`, {
      hasLanding: !!contentData.landing,
      hasSlider: !!contentData.slider,
      hasValue: !!contentData.value,
      hasLive: !!contentData.live,
      hasOrganizations: !!contentData.organizations,
      hasTimeline: !!contentData.timeline,
      hasAvailable: !!contentData.available,
      hasSocialChannels: !!contentData.socialChannels
    });

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

    let webContent, user;
    try {
      [webContent, user] = await Promise.all([
        WebContent.findOne({ user: userId }),
        User.findById(userId),
      ]);
    } catch (dbError) {
      console.error(`[WebContent] Error fetching data:`, {
        error: dbError.message,
        code: dbError.code,
        userId
      });
      throw new Error(`Database error: ${dbError.message}`);
    }

    if (!webContent) {
      console.log(`[WebContent] No content found to update for user: ${userId}`);
      return res.status(404).json({ message: "No web content found to update" });
    }

    console.log(`[WebContent] Deleting old content from storage for user: ${userId}`);
    console.log("webContent.contentHash", webContent.contentHash);
    
    console.log(`[WebContent] Checking for existing content to delete for user: ${userId}`);

    // Only attempt deletion if there is a contentHash
    if (webContent.contentHash) {
      try {
        console.log(`[WebContent] Deleting old content from storage for hash: ${webContent.contentHash}`);
        await deleteFromFileStorage(webContent.contentHash);
        console.log(`[WebContent] Successfully deleted old content from storage`);
      } catch (deleteError) {
        // Log the error but don't throw, to avoid crashing the update process
        console.error(`[WebContent] Failed to delete old content from storage:`, {
          error: deleteError.message,
          code: deleteError.code,
          contentHash: webContent.contentHash,
          userId
        });
      }
    } else {
      console.log(`[WebContent] No existing content hash found, skipping deletion`);
    }
    

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
      
      // Read template file with error handling
      let templateFile;
      try {
        templateFile = fs.readFileSync(`${__dirname}/../template/index.ejs`);
      } catch (readError) {
        console.error(`[WebContent] Error reading template file:`, {
          error: readError.message,
          code: readError.code,
          path: `${__dirname}/../template/index.ejs`
        });
        throw new Error(`Failed to read template file: ${readError.message}`);
      }

      // Compile template with error handling
      let template;
      try {
        template = ejs.compile(templateFile.toString());
      } catch (compileError) {
        console.error(`[WebContent] Error compiling template:`, {
          error: compileError.message,
          line: compileError.line,
          column: compileError.column
        });
        throw new Error(`Failed to compile template: ${compileError.message}`);
      }

      // Render template with error handling
      let renderedTemplate;
      try {
        renderedTemplate = template(content);
      } catch (renderError) {
        console.error(`[WebContent] Error rendering template:`, {
          error: renderError.message,
          line: renderError.line,
          column: renderError.column
        });
        throw new Error(`Failed to render template: ${renderError.message}`);
      }

      const filename = `${uuidv4()}.html`;
      const file = new File([Buffer.from(renderedTemplate)], filename, {
        type: "text/html",
      });

      console.log(`[WebContent] Uploading updated content for user: ${userId}`);
      let newCid;
      try {
        newCid = await uploadToFileStorage(file);
        console.log(`[WebContent] Successfully uploaded to storage, new CID: ${newCid}`);
      } catch (uploadError) {
        console.error(`[WebContent] Error uploading to storage:`, {
          error: uploadError.message,
          code: uploadError.code,
          userId
        });
        throw new Error(`Failed to upload to storage: ${uploadError.message}`);
      }

      webContent.contentHash = newCid;
      webContent.landing = content.landing;
      webContent.slider = content.slider;
      webContent.value = content.value;
      webContent.live = content.live;
      webContent.organizations = content.organizations;
      webContent.timeline = content.timeline;
      webContent.available = content.available;
      webContent.socialChannels = content.socialChannels;

      try {
        await webContent.save();
        console.log(`[WebContent] Successfully saved updated content for user: ${userId}`);
      } catch (saveError) {
        console.error(`[WebContent] Error saving updated content:`, {
          error: saveError.message,
          code: saveError.code,
          userId,
          validationErrors: saveError.errors
        });
        throw new Error(`Failed to save updated content: ${saveError.message}`);
      }

      if (user?.domain) {
        console.log(`[WebContent] Registering subdomain for user: ${userId}`);
        try {
          await registerSubdomain(user.domain, newCid);
          console.log(`[WebContent] Successfully registered subdomain for user: ${userId}`);
        } catch (subdomainError) {
          console.error(`[WebContent] Error registering subdomain:`, {
            error: subdomainError.message,
            code: subdomainError.code,
            userId,
            domain: user.domain
          });
          throw new Error(`Failed to register subdomain: ${subdomainError.message}`);
        }
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
        stack: templateError.stack
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
      stack: error.stack,
      code: error.code
    });
    if (error.name === "ValidationError") {
      return res.status(400).json({ 
        message: "Validation error", 
        error: error.errors,
        details: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }))
      });
    }
    return res.status(500).json({ 
      message: "Internal server error", 
      error: error.message,
      code: error.code
    });
  }
};

module.exports = {
  publishWebContent,
  updateWebContent,
};
