"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribeEmail = exports.getUsers = void 0;
const User_model_1 = __importDefault(require("../models/User.model"));
const SubscriberEmail_model_1 = __importDefault(require("../models/SubscriberEmail.model"));
/**
 * Returns a list of users with published web content.
 */
const getUsers = async (req, res, next) => {
    try {
        const users = (await User_model_1.default.aggregate([
            { $match: { password: { $ne: null } } },
            {
                $lookup: {
                    from: 'web_contents',
                    localField: '_id',
                    foreignField: 'user',
                    as: 'webContent',
                },
            },
            { $unwind: { path: '$webContent', preserveNullAndEmptyArrays: false } },
            {
                $match: {
                    domain: { $exists: true, $ne: null },
                    'webContent.landing.image': { $exists: true, $ne: null },
                },
            },
            {
                $project: {
                    _id: 1,
                    domain: { $concat: ['$domain', '.siher.eth.link'] },
                    fullName: '$webContent.landing.fullName',
                    image: '$webContent.landing.image',
                },
            },
        ]));
        return res.status(200).json(users);
    }
    catch (err) {
        return next(err);
    }
};
exports.getUsers = getUsers;
/**
 * Subscribes an email if not already present.
 */
const subscribeEmail = async (req, res, next) => {
    try {
        const { email } = req.query;
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Please provide a valid email address' });
        }
        const existing = await SubscriberEmail_model_1.default.findOne({ email });
        if (existing) {
            return res.status(409).json({ message: 'Email is already subscribed' });
        }
        const newSub = new SubscriberEmail_model_1.default({ email });
        await newSub.save();
        return res.status(201).json({
            message: 'Email subscribed successfully',
            email,
        });
    }
    catch (err) {
        return next(err);
    }
};
exports.subscribeEmail = subscribeEmail;
