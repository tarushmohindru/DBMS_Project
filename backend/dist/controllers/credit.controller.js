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
exports.listCredits = listCredits;
exports.getCredit = getCredit;
exports.getCreditsByCompany = getCreditsByCompany;
exports.getCreditSummary = getCreditSummary;
const CreditService = __importStar(require("../services/credit.service"));
const errors_1 = require("../services/errors");
async function listCredits(req, res) {
    try {
        const { from, to } = req.query;
        const company_id = req.user?.role === 'company_admin' ? req.user.company_id ?? undefined : undefined;
        const credits = await CreditService.getAllCredits({ company_id, from, to });
        res.json({ success: true, data: credits });
    }
    catch (err) {
        const m = (0, errors_1.mapDbError)(err);
        res.status(m.status).json({ success: false, error: m.message, code: m.code });
    }
}
async function getCredit(req, res) {
    try {
        const credit = await CreditService.getCreditById(parseInt(req.params.id, 10));
        if (!credit) {
            res.status(404).json({ success: false, error: 'Carbon credit not found' });
            return;
        }
        if (req.user?.role === 'company_admin' && credit.company_id !== req.user.company_id) {
            res.status(403).json({ success: false, error: 'Access denied to another company\'s carbon credit' });
            return;
        }
        res.json({ success: true, data: credit });
    }
    catch (err) {
        const m = (0, errors_1.mapDbError)(err);
        res.status(m.status).json({ success: false, error: m.message, code: m.code });
    }
}
async function getCreditsByCompany(req, res) {
    try {
        const company_id = parseInt(req.params.id, 10);
        if (req.user?.role === 'company_admin' && company_id !== req.user.company_id) {
            res.status(403).json({ success: false, error: 'Access denied to another company\'s carbon credits' });
            return;
        }
        const credits = await CreditService.getCreditsByCompany(company_id);
        res.json({ success: true, data: credits });
    }
    catch (err) {
        const m = (0, errors_1.mapDbError)(err);
        res.status(m.status).json({ success: false, error: m.message, code: m.code });
    }
}
async function getCreditSummary(req, res) {
    try {
        const summary = await CreditService.getCreditSummary();
        res.json({ success: true, data: summary });
    }
    catch (err) {
        const m = (0, errors_1.mapDbError)(err);
        res.status(m.status).json({ success: false, error: m.message, code: m.code });
    }
}
//# sourceMappingURL=credit.controller.js.map