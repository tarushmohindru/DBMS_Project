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
exports.listLogs = listLogs;
exports.getLog = getLog;
exports.createLog = createLog;
exports.verifyLog = verifyLog;
const LogService = __importStar(require("../services/productionLog.service"));
const productionLog_validator_1 = require("../validators/productionLog.validator");
const errors_1 = require("../services/errors");
async function listLogs(req, res) {
    try {
        const { verification_status, plant_id } = req.query;
        const company_id = req.user?.role === 'company_admin' ? req.user.company_id ?? undefined : undefined;
        const logs = await LogService.getAllLogs({
            verification_status,
            company_id,
            plant_id: plant_id ? parseInt(plant_id, 10) : undefined,
        });
        res.json({ success: true, data: logs });
    }
    catch (err) {
        const m = (0, errors_1.mapDbError)(err);
        res.status(m.status).json({ success: false, error: m.message, code: m.code });
    }
}
async function getLog(req, res) {
    try {
        const log = await LogService.getLogById(parseInt(req.params.id, 10));
        if (!log) {
            res.status(404).json({ success: false, error: 'Production log not found' });
            return;
        }
        if (req.user?.role === 'company_admin' && log.company_id !== req.user.company_id) {
            res.status(403).json({ success: false, error: 'Access denied to another company\'s production log' });
            return;
        }
        res.json({ success: true, data: log });
    }
    catch (err) {
        const m = (0, errors_1.mapDbError)(err);
        res.status(m.status).json({ success: false, error: m.message, code: m.code });
    }
}
async function createLog(req, res) {
    const parse = productionLog_validator_1.createProductionLogSchema.safeParse(req.body);
    if (!parse.success) {
        res.status(400).json({ success: false, error: parse.error.errors[0].message });
        return;
    }
    try {
        const log = await LogService.createLog(req.user.company_id, parse.data);
        res.status(201).json({ success: true, data: log });
    }
    catch (err) {
        const e = err;
        if (e.status) {
            res.status(e.status).json({ success: false, error: e.message, code: e.code });
            return;
        }
        const m = (0, errors_1.mapDbError)(err);
        res.status(m.status).json({ success: false, error: m.message, code: m.code });
    }
}
async function verifyLog(req, res) {
    const parse = productionLog_validator_1.verifyProductionLogSchema.safeParse(req.body);
    if (!parse.success) {
        res.status(400).json({ success: false, error: parse.error.errors[0].message });
        return;
    }
    try {
        const authority_id = req.user.authority_id;
        const log = await LogService.verifyLog(parseInt(req.params.id, 10), authority_id, parse.data);
        res.json({ success: true, data: log });
    }
    catch (err) {
        const m = (0, errors_1.mapDbError)(err);
        res.status(m.status).json({ success: false, error: m.message, code: m.code });
    }
}
//# sourceMappingURL=productionLog.controller.js.map