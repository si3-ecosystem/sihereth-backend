"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateToken = exports.loginUser = exports.approveUser = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_model_1 = __importDefault(require("../models/User.model"));
const WebContent_model_1 = __importDefault(require("../models/WebContent.model"));
const errorResponse = (res, status, message) => res.status(status).json({ message });
const approveUser = async (req, res) => {
    try {
        const { email } = req.query;
        if (!email)
            return errorResponse(res, 400, 'Email is required');
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email))
            return errorResponse(res, 400, 'Invalid email format');
        const existing = await User_model_1.default.findOne({
            email: email.toLowerCase(),
        });
        if (existing) {
            return errorResponse(res, 409, 'User already exists');
        }
        const newUser = new User_model_1.default({
            email: email.toLowerCase(),
            password: null,
        });
        try {
            await newUser.save();
            return res.status(201).json({
                message: 'User successfully approved',
                email: newUser.email,
            });
        }
        catch (saveErr) {
            console.error('[Auth] Error saving new user:', saveErr.message);
            return errorResponse(res, 500, 'Failed to create user');
        }
    }
    catch (err) {
        console.error('[Auth] Unexpected error in approveUser:', err.message);
        return errorResponse(res, 500, 'Internal server error');
    }
};
exports.approveUser = approveUser;
const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            console.warn('[LOGIN] Missing email or password');
            return errorResponse(res, 400, 'Email and password are required');
        }
        const user = await User_model_1.default.findOne({
            email: email.toLowerCase(),
        });
        if (!user) {
            return errorResponse(res, 404, 'User does not exist');
        }
        if (!user.password) {
            user.password = password;
            await user.save();
        }
        const isMatch = await bcrypt_1.default.compare(password, user.password);
        if (!isMatch) {
            console.warn('[LOGIN] Incorrect password');
            return errorResponse(res, 403, 'Incorrect password');
        }
        const tokenPayload = {
            id: user._id.toString(),
            email: user.email,
            name: user.name, // if you add name to schema
        };
        const token = jsonwebtoken_1.default.sign(tokenPayload, process.env.JWT_SECRET, {
            expiresIn: '3d',
        });
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 3 * 24 * 60 * 60 * 1000,
        });
        const webContent = await WebContent_model_1.default.findOne({
            user: user._id,
        });
        let formattedDomain = '';
        if (user.domain) {
            formattedDomain = `${user.domain}.siher.eth.link`;
        }
        return res.status(200).json({
            message: 'Login successful',
            user: {
                id: user._id,
                email: user.email,
                domain: formattedDomain,
                webContent: webContent || null,
            },
        });
    }
    catch (err) {
        console.error('[LOGIN] Error:', err);
        next(err);
    }
};
exports.loginUser = loginUser;
const validateToken = (req, res) => {
    try {
        const token = req.cookies?.token;
        if (!token) {
            return errorResponse(res, 401, 'No token provided');
        }
        jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, (err) => {
            if (err) {
                return errorResponse(res, 403, 'Invalid or expired token');
            }
            return res.status(200).json({ success: true });
        });
        // Note: the callback handles the response
        return res;
    }
    catch (err) {
        console.error(err);
        return errorResponse(res, 500, 'Internal server error');
    }
};
exports.validateToken = validateToken;
