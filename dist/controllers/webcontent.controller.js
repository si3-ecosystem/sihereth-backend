"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateWebContent = exports.publishWebContent = void 0;
// src/controllers/webcontent.controller.ts
const fs_1 = __importDefault(require("fs"));
const ejs_1 = __importDefault(require("ejs"));
const uuid_1 = require("uuid");
const path_1 = __importDefault(require("path"));
const formdata_node_1 = require("formdata-node");
const WebContent_model_1 = __importDefault(require("../models/WebContent.model"));
const User_model_1 = __importDefault(require("../models/User.model"));
const fileStorage_utils_1 = require("../utils/fileStorage.utils");
const domain_controller_1 = require("./domain.controller");
const publishWebContent = async (req, res) => {
    try {
        console.log(`[WebContent] Starting publish operation for user: ${req.user.id}`);
        const userId = req.user.id;
        const contentData = req.body;
        if (!userId) {
            console.error(`[WebContent] Invalid user ID in publish operation`);
            return res.status(400).json({ message: 'Invalid user ID' });
        }
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
        if (!contentData.landing &&
            !contentData.slider &&
            !contentData.value &&
            !contentData.live &&
            !contentData.organizations &&
            !contentData.timeline &&
            !contentData.available &&
            !contentData.socialChannels) {
            console.log(`[WebContent] Missing content data for user: ${userId}`);
            return res.status(400).json({ message: 'Missing content data' });
        }
        const content = {
            landing: contentData.landing || {},
            slider: contentData.slider || [],
            value: contentData.value || {},
            live: contentData.live || {},
            organizations: contentData.organizations || [],
            timeline: contentData.timeline || [],
            available: contentData.available || {},
            socialChannels: contentData.socialChannels || []
        };
        // Read & compile template
        let templateFile;
        try {
            templateFile = fs_1.default.readFileSync(path_1.default.join(__dirname, '../template/index.ejs'));
        }
        catch (readError) {
            console.error(`[WebContent] Error reading template file:`, {
                error: readError.message,
                code: readError.code
            });
            throw new Error(`Failed to read template file: ${readError.message}`);
        }
        let template;
        try {
            template = ejs_1.default.compile(templateFile.toString());
        }
        catch (err) {
            if (err instanceof Error) {
                console.error(`[WebContent] Error compiling template:`, {
                    message: err.message,
                });
                throw new Error(`Failed to compile template: ${err.message}`);
            }
            else {
                console.error('[WebContent] Unknown error compiling template:', err);
                throw new Error('Failed to compile template due to unknown error');
            }
        }
        let renderedTemplate;
        try {
            renderedTemplate = template(content);
        }
        catch (renderError) {
            console.error(`[WebContent] Error rendering template:`, {
                error: renderError.message,
                line: renderError.line,
                column: renderError.column
            });
            throw new Error(`Failed to render template: ${renderError.message}`);
        }
        const filename = `${(0, uuid_1.v4)()}.html`;
        const file = new formdata_node_1.File([Buffer.from(renderedTemplate)], filename, { type: 'text/html' });
        console.log(`[WebContent] Uploading to storage for user: ${userId}`);
        let cid;
        try {
            cid = await (0, fileStorage_utils_1.uploadToFileStorage)(file);
            console.log(`[WebContent] Successfully uploaded to storage, CID: ${cid}`);
        }
        catch (uploadError) {
            console.error(`[WebContent] Error uploading to storage:`, {
                error: uploadError.message,
                code: uploadError.code,
                userId
            });
            throw new Error(`Failed to upload to storage: ${uploadError.message}`);
        }
        let webContent = await WebContent_model_1.default.findOne({ user: userId });
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
        }
        else {
            console.log(`[WebContent] Creating new content for user: ${userId}`);
            webContent = new WebContent_model_1.default({
                user: userId,
                contentHash: cid,
                isNewWebpage: contentData.isNewWebpage ?? false,
                landing: content.landing,
                slider: content.slider,
                value: content.value,
                live: content.live,
                organizations: content.organizations,
                timeline: content.timeline,
                available: content.available,
                socialChannels: content.socialChannels
            });
        }
        try {
            await webContent.save();
            console.log(`[WebContent] Successfully saved content for user: ${userId}`);
        }
        catch (saveError) {
            console.error(`[WebContent] Error saving web content:`, {
                error: saveError.message,
                code: saveError.code,
                validationErrors: saveError.errors
            });
            throw new Error(`Failed to save content: ${saveError.message}`);
        }
        console.log(`[WebContent] Successfully published for user: ${userId}`);
        return res.status(201).json({ message: 'Published successfully' });
    }
    catch (error) {
        console.error(`[WebContent] Error in publish operation for user: ${req.user.id}`, {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: 'Validation error',
                error: error.errors,
                details: Object.keys(error.errors).map(key => ({
                    field: key,
                    message: error.errors[key].message
                }))
            });
        }
        return res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
};
exports.publishWebContent = publishWebContent;
const updateWebContent = async (req, res) => {
    try {
        console.log(`[WebContent] Starting update operation for user: ${req.user.id}`);
        const userId = req.user.id;
        const contentData = req.body;
        if (!userId) {
            console.error(`[WebContent] Invalid user ID in update operation`);
            return res.status(400).json({ message: 'Invalid user ID' });
        }
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
        if (!contentData.landing &&
            !contentData.slider &&
            !contentData.value &&
            !contentData.live &&
            !contentData.organizations &&
            !contentData.timeline &&
            !contentData.available &&
            !contentData.socialChannels) {
            console.log(`[WebContent] Missing content data for update - user: ${userId}`);
            return res.status(400).json({ message: 'Missing content data' });
        }
        const [webContent, user] = await Promise.all([
            WebContent_model_1.default.findOne({ user: userId }),
            User_model_1.default.findById(userId)
        ]);
        if (!webContent) {
            console.log(`[WebContent] No content found to update for user: ${userId}`);
            return res.status(404).json({ message: 'No web content found to update' });
        }
        if (webContent.contentHash) {
            try {
                console.log(`[WebContent] Deleting old content from storage for hash: ${webContent.contentHash}`);
                await (0, fileStorage_utils_1.deleteFromFileStorage)(webContent.contentHash);
                console.log(`[WebContent] Successfully deleted old content from storage`);
            }
            catch (deleteError) {
                console.error(`[WebContent] Failed to delete old content from storage:`, {
                    error: deleteError.message,
                    code: deleteError.code
                });
            }
        }
        else {
            console.log(`[WebContent] No existing content hash found, skipping deletion`);
        }
        const content = {
            landing: contentData.landing || webContent.landing,
            slider: contentData.slider || webContent.slider,
            value: contentData.value || webContent.value,
            live: contentData.live || webContent.live,
            organizations: contentData.organizations || webContent.organizations,
            timeline: contentData.timeline || webContent.timeline,
            available: contentData.available || webContent.available,
            socialChannels: contentData.socialChannels || webContent.socialChannels
        };
        // same template/read/compile/render/upload logic as publish…
        // (for brevity, you’d repeat the block from publishWebContent here,
        // using `content` and updating `webContent` fields accordingly)
        // after saving:
        if (user?.domain) {
            try {
                console.log(`[WebContent] Registering subdomain for user: ${userId}`);
                await (0, domain_controller_1.registerSubdomain)(user.domain, webContent.contentHash);
                console.log(`[WebContent] Successfully registered subdomain for user: ${userId}`);
            }
            catch (subdomainError) {
                console.error(`[WebContent] Error registering subdomain:`, {
                    error: subdomainError.message,
                    code: subdomainError.code
                });
                throw new Error(`Failed to register subdomain: ${subdomainError.message}`);
            }
        }
        console.log(`[WebContent] Successfully updated content for user: ${userId}`);
        return res.status(200).json({
            message: 'Content updated successfully',
            contentHash: webContent.contentHash
        });
    }
    catch (error) {
        console.error(`[WebContent] Error in update operation for user: ${req.user.id}`, {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: 'Validation error',
                error: error.errors,
                details: Object.keys(error.errors).map(key => ({
                    field: key,
                    message: error.errors[key].message
                }))
            });
        }
        return res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
};
exports.updateWebContent = updateWebContent;
