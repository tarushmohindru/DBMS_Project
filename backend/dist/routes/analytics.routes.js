"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analytics_controller_1 = require("../controllers/analytics.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/public-summary', analytics_controller_1.getPublicSummary);
router.get('/dashboard', auth_1.authenticate, analytics_controller_1.getDashboardKPIs);
router.get('/reports', auth_1.authenticate, (0, auth_1.authorize)('marketplace_admin', 'regulatory_authority'), analytics_controller_1.getFullAnalytics);
router.get('/top-buyers', auth_1.authenticate, (0, auth_1.authorize)('marketplace_admin'), analytics_controller_1.getTopBuyers);
router.get('/credit-summary', auth_1.authenticate, analytics_controller_1.getCreditIssuanceTrends);
router.get('/marketplace-volume', auth_1.authenticate, (0, auth_1.authorize)('marketplace_admin'), analytics_controller_1.getMarketplaceVolume);
router.get('/company-performance', auth_1.authenticate, (0, auth_1.authorize)('marketplace_admin', 'regulatory_authority'), analytics_controller_1.getCompanyPerformance);
exports.default = router;
//# sourceMappingURL=analytics.routes.js.map