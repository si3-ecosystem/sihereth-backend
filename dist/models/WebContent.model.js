"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// src/models/WebContent.model.ts
const mongoose_1 = __importStar(require("mongoose"));
const LandingSchema = new mongoose_1.Schema({
    fullName: String,
    title: String,
    headline: String,
    hashTags: [String],
    region: String,
    organizationAffiliations: [String],
    communityAffiliations: [String],
    superPowers: [String],
    image: String,
    pronoun: String
}, { _id: false });
const ValueSchema = new mongoose_1.Schema({
    experience: String,
    values: String
}, { _id: false });
const LiveDetailsSchema = new mongoose_1.Schema({
    title: String,
    heading: String,
    body: String
}, { _id: false });
const LiveSchema = new mongoose_1.Schema({
    image: String,
    video: String,
    url: String,
    walletUrl: String,
    details: [LiveDetailsSchema]
}, { _id: false });
const TimelineSchema = new mongoose_1.Schema({
    title: String,
    to: String,
    from: String
}, { _id: false });
const AvailableSchema = new mongoose_1.Schema({
    avatar: String,
    availableFor: [String],
    ctaUrl: String,
    ctaText: String
}, { _id: false });
const SocialChannelSchema = new mongoose_1.Schema({
    text: String,
    url: String,
    icon: String
}, { _id: false });
const webContentSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    contentHash: { type: String },
    landing: { type: LandingSchema, default: {} },
    slider: { type: [String], default: [] },
    value: { type: ValueSchema, default: {} },
    live: { type: LiveSchema, default: {} },
    organizations: { type: [String], default: [] },
    timeline: { type: [TimelineSchema], default: [] },
    available: { type: AvailableSchema, default: {} },
    socialChannels: { type: [SocialChannelSchema], default: [] },
    isNewWebpage: { type: Boolean, default: true },
}, {
    timestamps: true,
    collection: 'web_contents'
});
const WebContent = mongoose_1.default.model('WebContent', webContentSchema);
exports.default = WebContent;
