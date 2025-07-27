"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/webcontent.routes.ts
const express_1 = require("express");
const webcontent_controller_1 = require("../controllers/webcontent.controller");
const auth_1 = __importDefault(require("../middlewares/auth"));
const router = (0, express_1.Router)();
router.post('/publish', auth_1.default, webcontent_controller_1.publishWebContent);
router.post('/update', auth_1.default, webcontent_controller_1.updateWebContent);
exports.default = router;
