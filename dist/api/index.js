"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const main_1 = __importDefault(require("../main"));
function handler(req, res) {
    return (0, main_1.default)(req, res);
}
