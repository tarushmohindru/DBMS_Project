"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const credit_controller_1 = require("../controllers/credit.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticate, credit_controller_1.listCredits);
router.get('/summary', auth_1.authenticate, credit_controller_1.getCreditSummary);
router.get('/company/:id', auth_1.authenticate, credit_controller_1.getCreditsByCompany);
router.get('/:id', auth_1.authenticate, credit_controller_1.getCredit);
exports.default = router;
//# sourceMappingURL=credit.routes.js.map