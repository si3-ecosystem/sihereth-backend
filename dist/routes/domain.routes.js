"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/domain.routes.ts
const express_1 = require("express");
const domain_controller_1 = require("../controllers/domain.controller");
const auth_1 = __importDefault(require("../middlewares/auth"));
const router = (0, express_1.Router)();
router.post('/publish', auth_1.default, domain_controller_1.publishDomain);
exports.default = router;
