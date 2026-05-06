import bcrypt   from 'bcryptjs';
import { pool } from '../config/db';
import { CreateCompanyWithUserInput } from '../validators/company.validator';

export async function getAllCompanies() {
  const result = await pool.query(
    `SELECT c.*, cw.balance AS wallet_balance
     FROM   Company c
     LEFT JOIN CreditWallet cw ON c.company_id = cw.company_id
     ORDER  BY c.created_at DESC`
  );
  return result.rows;
}

export async function getCompanyById(company_id: number) {
  const result = await pool.query(
    `SELECT c.*, cw.balance AS wallet_balance, cw.last_updated AS wallet_updated
     FROM   Company c
     LEFT JOIN CreditWallet cw ON c.company_id = cw.company_id
     WHERE  c.company_id = $1`,
    [company_id]
  );
  return result.rows[0] ?? null;
}

// Registers a new company AND creates a linked company_admin user atomically
export async function registerCompanyWithAdmin(input: CreateCompanyWithUserInput) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const companyResult = await client.query(
      `INSERT INTO Company (name, industry, registration_no)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [input.company.name, input.company.industry ?? null, input.company.registration_no]
    );
    const company = companyResult.rows[0];

    const hash = await bcrypt.hash(input.user.password, 12);
    const userResult = await client.query(
      `INSERT INTO Users (username, password_hash, role, company_id)
       VALUES ($1, $2, 'company_admin', $3)
       RETURNING user_id, username, role, company_id`,
      [input.user.username, hash, company.company_id]
    );

    await client.query('COMMIT');
    return { company, user: userResult.rows[0] };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
