"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = __importDefault(require("./app"));
const db_1 = require("./config/db");
const PORT = parseInt(process.env.PORT || '3001', 10);
async function start() {
    try {
        await (0, db_1.testConnection)();
        app_1.default.listen(PORT, () => {
            console.log(`Carbon Credit Marketplace API running on http://localhost:${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    }
    catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}
start();
//# sourceMappingURL=server.js.map