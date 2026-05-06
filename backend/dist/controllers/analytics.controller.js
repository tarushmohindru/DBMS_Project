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
exports.getDashboardKPIs = getDashboardKPIs;
exports.getPublicSummary = getPublicSummary;
exports.getTopBuyers = getTopBuyers;
exports.getCreditIssuanceTrends = getCreditIssuanceTrends;
exports.getMarketplaceVolume = getMarketplaceVolume;
exports.getCompanyPerformance = getCompanyPerformance;
exports.getFullAnalytics = getFullAnalytics;
const AnalyticsService = __importStar(require("../services/analytics.service"));
const errors_1 = require("../services/errors");
async function getDashboardKPIs(req, res) {
    try {
        if (req.user?.role === 'company_admin' && req.user.company_id) {
            const kpis = await AnalyticsService.getCompanyDashboardKPIs(req.user.company_id);
            res.json({ success: true, data: kpis });
        }
        else {
            const kpis = await AnalyticsService.getDashboardKPIs();
            res.json({ success: true, data: kpis });
        }
    }
    catch (err) {
        const m = (0, errors_1.mapDbError)(err);
        res.status(m.status).json({ success: false, error: m.message, code: m.code });
    }
}
async function getPublicSummary(_req, res) {
    try {
        const summary = await AnalyticsService.getPublicSummary();
        res.json({ success: true, data: summary });
    }
    catch (err) {
        const m = (0, errors_1.mapDbError)(err);
        res.status(m.status).json({ success: false, error: m.message, code: m.code });
    }
}
async function getTopBuyers(req, res) {
    try {
        const data = await AnalyticsService.getTopBuyers();
        res.json({ success: true, data });
    }
    catch (err) {
        const m = (0, errors_1.mapDbError)(err);
        res.status(m.status).json({ success: false, error: m.message, code: m.code });
    }
}
async function getCreditIssuanceTrends(req, res) {
    try {
        const data = await AnalyticsService.getCreditIssuanceTrends();
        res.json({ success: true, data });
    }
    catch (err) {
        const m = (0, errors_1.mapDbError)(err);
        res.status(m.status).json({ success: false, error: m.message, code: m.code });
    }
}
async function getMarketplaceVolume(req, res) {
    try {
        const data = await AnalyticsService.getMarketplaceVolume();
        res.json({ success: true, data });
    }
    catch (err) {
        const m = (0, errors_1.mapDbError)(err);
        res.status(m.status).json({ success: false, error: m.message, code: m.code });
    }
}
async function getCompanyPerformance(req, res) {
    try {
        const data = await AnalyticsService.getCompanyPerformance();
        res.json({ success: true, data });
    }
    catch (err) {
        const m = (0, errors_1.mapDbError)(err);
        res.status(m.status).json({ success: false, error: m.message, code: m.code });
    }
}
async function getFullAnalytics(req, res) {
    try {
        const data = await AnalyticsService.getFullAnalytics();
        res.json({ success: true, data });
    }
    catch (err) {
        const m = (0, errors_1.mapDbError)(err);
        res.status(m.status).json({ success: false, error: m.message, code: m.code });
    }
}
//# sourceMappingURL=analytics.controller.js.map