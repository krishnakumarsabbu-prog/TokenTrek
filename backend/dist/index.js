"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const seed_1 = require("./seed");
const overview_1 = __importDefault(require("./routes/overview"));
const data_1 = __importDefault(require("./routes/data"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)({ origin: '*' }));
app.use(express_1.default.json({ limit: '10mb' }));
(0, seed_1.seed)();
app.use('/api/overview', overview_1.default);
app.use('/api/data', data_1.default);
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.listen(PORT, () => {
    console.log(`[TokenTrek] API → http://localhost:${PORT}`);
});
