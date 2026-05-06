"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productionLog_controller_1 = require("../controllers/productionLog.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticate, productionLog_controller_1.listLogs);
router.post('/', auth_1.authenticate, (0, auth_1.authorize)('company_admin'), productionLog_controller_1.createLog);
router.get('/:id', auth_1.authenticate, productionLog_controller_1.getLog);
router.put('/:id/verify', auth_1.authenticate, (0, auth_1.authorize)('regulatory_authority'), productionLog_controller_1.verifyLog);
exports.default = router;
//# sourceMappingURL=productionLog.routes.js.map