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
exports.listReports = listReports;
exports.getReport = getReport;
exports.generateReport = generateReport;
exports.auditReport = auditReport;
exports.getComplianceSummary = getComplianceSummary;
exports.getPeriodicSummary = getPeriodicSummary;
exports.listAuthorities = listAuthorities;
const ComplianceService = __importStar(require("../services/compliance.service"));
const compliance_validator_1 = require("../validators/compliance.validator");
const errors_1 = require("../services/errors");
async function listReports(req, res) {
    try {
        const { status } = req.query;
        const company_id = req.user?.role === 'company_admin' ? req.user.company_id ?? undefined : undefined;
        const authority_id = req.user?.role === 'regulatory_authority' ? req.user.authority_id ?? undefined : undefined;
        const reports = await ComplianceService.getAllReports({ company_id, authority_id, status });
        res.json({ success: true, data: reports });
    }
    catch (err) {
        const m = (0, errors_1.mapDbError)(err);
        res.status(m.status).json({ success: false, error: m.message, code: m.code });
    }
}
async function getReport(req, res) {
    try {
        const report = await ComplianceService.getReportById(parseInt(req.params.id, 10));
        if (!report) {
            res.status(404).json({ success: false, error: 'Report not found' });
            return;
        }
        if (req.user?.role === 'company_admin' && report.company_id !== req.user.company_id) {
            res.status(403).json({ success: false, error: 'Access denied to another company\'s compliance report' });
            return;
        }
        if (req.user?.role === 'regulatory_authority' && report.authority_id !== req.user.authority_id) {
            res.status(403).json({ success: false, error: 'Access denied to another authority\'s compliance report' });
            return;
        }
        res.json({ success: true, data: report });
    }
    catch (err) {
        const m = (0, errors_1.mapDbError)(err);
        res.status(m.status).json({ success: false, error: m.message, code: m.code });
    }
}
async function generateReport(req, res) {
    const parse = compliance_validator_1.generateReportSchema.safeParse(req.body);
    if (!parse.success) {
        res.status(400).json({ success: false, error: parse.error.errors[0].message });
        return;
    }
    try {
        const company_id = req.user.company_id;
        const report = await ComplianceService.generateReport(company_id, parse.data);
        res.status(201).json({ success: true, data: report });
    }
    catch (err) {
        const m = (0, errors_1.mapDbError)(err);
        res.status(m.status).json({ success: false, error: m.message, code: m.code });
    }
}
async function auditReport(req, res) {
    const parse = compliance_validator_1.auditReportSchema.safeParse(req.body);
    if (!parse.success) {
        res.status(400).json({ success: false, error: parse.error.errors[0].message });
        return;
    }
    try {
        const report = await ComplianceService.auditReport(parseInt(req.params.id, 10), req.user.authority_id, parse.data);
        res.json({ success: true, data: report });
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
async function getComplianceSummary(req, res) {
    try {
        const summary = await ComplianceService.getComplianceSummaryView();
        res.json({ success: true, data: summary });
    }
    catch (err) {
        const m = (0, errors_1.mapDbError)(err);
        res.status(m.status).json({ success: false, error: m.message, code: m.code });
    }
}
async function getPeriodicSummary(req, res) {
    try {
        const authority_id = parseInt(req.params.authority_id, 10);
        if (req.user?.role === 'regulatory_authority' && authority_id !== req.user.authority_id) {
            res.status(403).json({ success: false, error: 'Access denied to another authority\'s summary' });
            return;
        }
        const data = await ComplianceService.getPeriodicComplianceSummary(authority_id);
        res.json({ success: true, data });
    }
    catch (err) {
        const m = (0, errors_1.mapDbError)(err);
        res.status(m.status).json({ success: false, error: m.message, code: m.code });
    }
}
async function listAuthorities(req, res) {
    try {
        const authorities = await ComplianceService.getAllAuthorities();
        res.json({ success: true, data: authorities });
    }
    catch (err) {
        const m = (0, errors_1.mapDbError)(err);
        res.status(m.status).json({ success: false, error: m.message, code: m.code });
    }
}
//# sourceMappingURL=compliance.controller.js.map