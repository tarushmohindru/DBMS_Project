"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const wallet_controller_1 = require("../controllers/wallet.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/:company_id', auth_1.authenticate, (0, auth_1.authorize)('company_admin', 'marketplace_admin'), auth_1.ownCompanyOnly, wallet_controller_1.getWallet);
router.get('/:company_id/history', auth_1.authenticate, (0, auth_1.authorize)('company_admin', 'marketplace_admin'), auth_1.ownCompanyOnly, wallet_controller_1.getWalletHistory);
exports.default = router;
//# sourceMappingURL=wallet.routes.js.map