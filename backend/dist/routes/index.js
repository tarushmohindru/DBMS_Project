"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const company_routes_1 = __importDefault(require("./company.routes"));
const plant_routes_1 = __importDefault(require("./plant.routes"));
const productionLog_routes_1 = __importDefault(require("./productionLog.routes"));
const credit_routes_1 = __importDefault(require("./credit.routes"));
const wallet_routes_1 = __importDefault(require("./wallet.routes"));
const listing_routes_1 = __importDefault(require("./listing.routes"));
const transaction_routes_1 = __importDefault(require("./transaction.routes"));
const compliance_routes_1 = __importDefault(require("./compliance.routes"));
const analytics_routes_1 = __importDefault(require("./analytics.routes"));
const router = (0, express_1.Router)();
router.use('/auth', auth_routes_1.default);
router.use('/companies', company_routes_1.default);
router.use('/plants', plant_routes_1.default);
router.use('/production-logs', productionLog_routes_1.default);
router.use('/credits', credit_routes_1.default);
router.use('/wallet', wallet_routes_1.default);
router.use('/listings', listing_routes_1.default);
router.use('/transactions', transaction_routes_1.default);
router.use('/compliance-reports', compliance_routes_1.default);
router.use('/analytics', analytics_routes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map