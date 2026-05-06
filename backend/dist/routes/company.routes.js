"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const company_controller_1 = require("../controllers/company.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/', company_controller_1.registerCompany); // Public — new company registration
router.get('/', auth_1.authenticate, company_controller_1.listCompanies);
router.get('/:id', auth_1.authenticate, company_controller_1.getCompany);
exports.default = router;
//# sourceMappingURL=company.routes.js.map