"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const transaction_controller_1 = require("../controllers/transaction.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticate, transaction_controller_1.listTransactions);
router.post('/', auth_1.authenticate, (0, auth_1.authorize)('company_admin'), transaction_controller_1.executePurchase);
router.get('/:id', auth_1.authenticate, transaction_controller_1.getTransaction);
exports.default = router;
//# sourceMappingURL=transaction.routes.js.map