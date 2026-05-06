"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.authorize = authorize;
exports.ownCompanyOnly = ownCompanyOnly;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ success: false, error: 'Missing or malformed authorization header' });
        return;
    }
    const token = authHeader.slice(7);
    if (!process.env.JWT_SECRET) {
        res.status(500).json({ success: false, error: 'JWT secret is not configured', code: 'AUTH_CONFIG_ERROR' });
        return;
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = payload;
        next();
    }
    catch {
        res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }
}
function authorize(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ success: false, error: 'Unauthenticated' });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({ success: false, error: `Access denied. Required role(s): ${roles.join(', ')}` });
            return;
        }
        next();
    };
}
// Ensures company_admin can only access their own company's data
function ownCompanyOnly(req, res, next) {
    if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthenticated' });
        return;
    }
    if (req.user.role === 'marketplace_admin' || req.user.role === 'regulatory_authority') {
        next();
        return;
    }
    const paramCompanyId = parseInt(req.params.company_id || req.params.id || '0', 10);
    if (req.user.company_id !== paramCompanyId) {
        res.status(403).json({ success: false, error: 'Access denied to another company\'s data' });
        return;
    }
    next();
}
//# sourceMappingURL=auth.js.map