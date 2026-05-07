"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const compliance_controller_1 = require("../controllers/compliance.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/authorities', compliance_controller_1.listAuthorities);
router.get('/summary', auth_1.authenticate, (0, auth_1.authorize)('regulatory_authority', 'marketplace_admin'), compliance_controller_1.getComplianceSummary);
router.get('/periodic/:authority_id', auth_1.authenticate, (0, auth_1.authorize)('regulatory_authority', 'marketplace_admin'), compliance_controller_1.getPeriodicSummary);
router.get('/', auth_1.authenticate, compliance_controller_1.listReports);
router.post('/', auth_1.authenticate, (0, auth_1.authorize)('company_admin'), compliance_controller_1.generateReport);
router.get('/:id', auth_1.authenticate, compliance_controller_1.getReport);
router.put('/:id/audit', auth_1.authenticate, (0, auth_1.authorize)('regulatory_authority'), compliance_controller_1.auditReport);
exports.default = router;
//# sourceMappingURL=compliance.routes.js.map