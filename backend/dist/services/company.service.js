"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCompanies = getAllCompanies;
exports.getCompanyById = getCompanyById;
exports.registerCompanyWithAdmin = registerCompanyWithAdmin;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("../config/db");
async function getAllCompanies() {
    const result = await db_1.pool.query(`SELECT c.*, cw.balance AS wallet_balance
     FROM   Company c
     LEFT JOIN CreditWallet cw ON c.company_id = cw.company_id
     ORDER  BY c.created_at DESC`);
    return result.rows;
}
async function getCompanyById(company_id) {
    const result = await db_1.pool.query(`SELECT c.*, cw.balance AS wallet_balance, cw.last_updated AS wallet_updated
     FROM   Company c
     LEFT JOIN CreditWallet cw ON c.company_id = cw.company_id
     WHERE  c.company_id = $1`, [company_id]);
    return result.rows[0] ?? null;
}
// Registers a new company AND creates a linked company_admin user atomically
async function registerCompanyWithAdmin(input) {
    const client = await db_1.pool.connect();
    try {
        await client.query('BEGIN');
        const companyResult = await client.query(`INSERT INTO Company (name, industry, registration_no)
       VALUES ($1, $2, $3)
       RETURNING *`, [input.company.name, input.company.industry ?? null, input.company.registration_no]);
        const company = companyResult.rows[0];
        const hash = await bcryptjs_1.default.hash(input.user.password, 12);
        const userResult = await client.query(`INSERT INTO Users (username, password_hash, role, company_id)
       VALUES ($1, $2, 'company_admin', $3)
       RETURNING user_id, username, role, company_id`, [input.user.username, hash, company.company_id]);
        await client.query('COMMIT');
        return { company, user: userResult.rows[0] };
    }
    catch (err) {
        await client.query('ROLLBACK');
        throw err;
    }
    finally {
        client.release();
    }
}
//# sourceMappingURL=company.service.js.map