"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSubdomain = exports.publishDomain = void 0;
// src/controllers/domain.controller.ts
const axios_1 = __importDefault(require("axios"));
const User_model_1 = __importDefault(require("../models/User.model"));
const WebContent_model_1 = __importDefault(require("../models/WebContent.model"));
// Environment variables (asserted non-null)
const NAMESTONE_API_KEY = process.env.NAMESTONE_API_KEY;
const NAMESTONE_API_URL = process.env.NAMESTONE_API_URL;
const ADDRESS = process.env.ADDRESS;
const DOMAIN = process.env.DOMAIN;
const errorResponse = (res, status, message) => res.status(status).json({ message });
const publishDomain = async (req, res) => {
    try {
        const { domain } = req.body;
        if (!domain) {
            return errorResponse(res, 400, 'Domain is required.');
        }
        // Check if subdomain is already taken
        const existingUser = await User_model_1.default.findOne({ domain }).exec();
        if (existingUser) {
            return errorResponse(res, 400, 'Subdomain already registered.');
        }
        // Ensure content is published
        const webpage = await WebContent_model_1.default.findOne({ user: req.user.id }).exec();
        const cid = webpage?.contentHash ?? '';
        if (!cid) {
            console.log('[publishDomain] No content hash found for user:', req.user.id);
            return errorResponse(res, 400, 'Before selecting your domain name, please publish your webpage first.');
        }
        // Register subdomain on external service
        const success = await (0, exports.registerSubdomain)(domain, cid);
        if (!success) {
            return errorResponse(res, 400, 'Could not register subdomain.');
        }
        // Update user record
        const updatedUser = await User_model_1.default.findByIdAndUpdate(req.user.id, { domain }, { new: true }).exec();
        if (!updatedUser) {
            return errorResponse(res, 404, 'User not found.');
        }
        return res
            .status(200)
            .json({ domain: `${updatedUser.domain}.siher.eth.link` });
    }
    catch (error) {
        console.error('[publishDomain] Error:', error);
        return errorResponse(res, 500, error.message ?? 'Failed to publish domain');
    }
};
exports.publishDomain = publishDomain;
/**
 * Registers a subdomain via the Namestone API.
 * @param subdomain - chosen subdomain
 * @param contenthash - IPFS content hash (without protocol)
 * @returns true if registration succeeded, false otherwise
 */
const registerSubdomain = async (subdomain, contenthash) => {
    try {
        console.log('[registerSubdomain] Registering subdomain:', subdomain, 'with contenthash:', contenthash);
        const response = await axios_1.default.post(NAMESTONE_API_URL, {
            domain: DOMAIN,
            address: ADDRESS,
            contenthash: `ipfs://${contenthash}`,
            name: subdomain,
        }, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: NAMESTONE_API_KEY,
            },
        });
        console.log('[registerSubdomain] API response status:', response.status);
        return response.status === 200;
    }
    catch (err) {
        console.error('[registerSubdomain] Error registering subdomain:', err.response?.data || err.message);
        return false;
    }
};
exports.registerSubdomain = registerSubdomain;
