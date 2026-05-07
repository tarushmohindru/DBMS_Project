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
exports.login = login;
exports.registerUser = registerUser;
exports.signupUser = signupUser;
exports.listUsers = listUsers;
exports.getMe = getMe;
const AuthService = __importStar(require("../services/auth.service"));
const auth_validator_1 = require("../validators/auth.validator");
const errors_1 = require("../services/errors");
async function login(req, res) {
    const parse = auth_validator_1.loginSchema.safeParse(req.body);
    if (!parse.success) {
        res.status(400).json({ success: false, error: parse.error.errors[0].message });
        return;
    }
    try {
        const result = await AuthService.loginUser(parse.data);
        res.json({ success: true, data: result });
    }
    catch (err) {
        const e = err;
        if (e.status) {
            res.status(e.status).json({ success: false, error: e.message, code: e.code });
        }
        else {
            const mapped = (0, errors_1.mapDbError)(err);
            res.status(mapped.status).json({ success: false, error: mapped.message, code: mapped.code });
        }
    }
}
async function registerUser(req, res) {
    const parse = auth_validator_1.registerUserSchema.safeParse(req.body);
    if (!parse.success) {
        res.status(400).json({ success: false, error: parse.error.errors[0].message });
        return;
    }
    try {
        const user = await AuthService.registerUser(parse.data);
        res.status(201).json({ success: true, data: user });
    }
    catch (err) {
        const mapped = (0, errors_1.mapDbError)(err);
        res.status(mapped.status).json({ success: false, error: mapped.message, code: mapped.code });
    }
}
async function signupUser(req, res) {
    const parse = auth_validator_1.registerUserSchema.safeParse(req.body);
    if (!parse.success) {
        res.status(400).json({ success: false, error: parse.error.errors[0].message });
        return;
    }
    try {
        const user = await AuthService.registerUser(parse.data);
        res.status(201).json({ success: true, data: user });
    }
    catch (err) {
        const mapped = (0, errors_1.mapDbError)(err);
        res.status(mapped.status).json({ success: false, error: mapped.message, code: mapped.code });
    }
}
async function listUsers(_req, res) {
    try {
        const users = await AuthService.listUsers();
        res.json({ success: true, data: users });
    }
    catch (err) {
        const mapped = (0, errors_1.mapDbError)(err);
        res.status(mapped.status).json({ success: false, error: mapped.message, code: mapped.code });
    }
}
function getMe(req, res) {
    res.json({ success: true, data: req.user });
}
//# sourceMappingURL=auth.controller.js.map