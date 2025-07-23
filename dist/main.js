"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/index.ts
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./middlewares/auth"));
const cors_2 = require("./utils/cors");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const users_routes_1 = __importDefault(require("./routes/users.routes"));
const webcontent_routes_1 = __importDefault(require("./routes/webcontent.routes"));
const domain_routes_1 = __importDefault(require("./routes/domain.routes"));
const test_routes_1 = __importDefault(require("./routes/test.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)(cors_2.corsOptions));
app.use('/auth', auth_routes_1.default);
app.use('/users', users_routes_1.default);
app.use('/webcontent', auth_1.default, webcontent_routes_1.default);
app.use('/domain', auth_1.default, domain_routes_1.default);
app.use('/test', test_routes_1.default);
app.get('/', (_req, res) => {
    return res.send('Server is running');
});
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
const DB_URL = process.env.DB_URL;
mongoose_1.default
    .connect(DB_URL)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
exports.default = app;
