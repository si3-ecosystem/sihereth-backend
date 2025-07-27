"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/auth.routes.ts
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_1 = __importDefault(require("../middlewares/auth"));
const router = (0, express_1.Router)();
router.get('/approve', auth_controller_1.approveUser);
router.post('/login', auth_controller_1.loginUser);
router.get('/validate-token', auth_1.default, auth_controller_1.validateToken);
exports.default = router;
