"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/users.routes.ts
const express_1 = require("express");
const users_controller_1 = require("../controllers/users.controller");
const router = (0, express_1.Router)();
router.get('/', users_controller_1.getUsers);
router.get('/subscribe', users_controller_1.subscribeEmail);
exports.default = router;
