"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = loginUser;
exports.registerUser = registerUser;
exports.listUsers = listUsers;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../config/db");
const SALT_ROUNDS = 12;
const JWT_EXPIRES = (process.env.JWT_EXPIRES || '8h');
async function loginUser(input) {
    const result = await db_1.pool.query(`SELECT user_id, username, password_hash, role, company_id, authority_id
     FROM   Users
     WHERE  username = $1`, [input.username]);
    if (result.rowCount === 0) {
        throw { status: 401, message: 'Invalid username or password', code: 'INVALID_CREDENTIALS' };
    }
    const user = result.rows[0];
    const valid = await bcryptjs_1.default.compare(input.password, user.password_hash);
    if (!valid) {
        throw { status: 401, message: 'Invalid username or password', code: 'INVALID_CREDENTIALS' };
    }
    const payload = {
        user_id: user.user_id,
        username: user.username,
        role: user.role,
        company_id: user.company_id ?? null,
        authority_id: user.authority_id ?? null,
    };
    if (!process.env.JWT_SECRET) {
        throw { status: 500, message: 'JWT secret is not configured', code: 'AUTH_CONFIG_ERROR' };
    }
    const token = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRES });
    return { token, user: payload };
}
async function registerUser(input) {
    const hash = await bcryptjs_1.default.hash(input.password, SALT_ROUNDS);
    const result = await db_1.pool.query(`INSERT INTO Users (username, password_hash, role, company_id, authority_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING user_id, username, role, company_id, authority_id`, [input.username, hash, input.role, input.company_id ?? null, input.authority_id ?? null]);
    return result.rows[0];
}
async function listUsers() {
    const result = await db_1.pool.query(`SELECT u.user_id,
            u.username,
            u.role,
            u.company_id,
            c.name  AS company_name,
            u.authority_id,
            ra.name AS authority_name,
            u.created_at
     FROM   Users u
     LEFT JOIN Company c              ON u.company_id = c.company_id
     LEFT JOIN RegulatoryAuthority ra ON u.authority_id = ra.authority_id
     ORDER  BY u.created_at DESC, u.user_id DESC`);
    return result.rows;
}
//# sourceMappingURL=auth.service.js.map