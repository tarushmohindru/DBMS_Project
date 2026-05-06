import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { pool } from '../config/db';
import { LoginInput, RegisterUserInput } from '../validators/auth.validator';
import { AuthPayload } from '../middleware/auth';

const SALT_ROUNDS = 12;
const JWT_EXPIRES = (process.env.JWT_EXPIRES || '8h') as SignOptions['expiresIn'];

export async function loginUser(input: LoginInput) {
  const result = await pool.query(
    `SELECT user_id, username, password_hash, role, company_id, authority_id
     FROM   Users
     WHERE  username = $1`,
    [input.username]
  );

  if (result.rowCount === 0) {
    throw { status: 401, message: 'Invalid username or password', code: 'INVALID_CREDENTIALS' };
  }

  const user = result.rows[0];
  const valid = await bcrypt.compare(input.password, user.password_hash);
  if (!valid) {
    throw { status: 401, message: 'Invalid username or password', code: 'INVALID_CREDENTIALS' };
  }

  const payload: AuthPayload = {
    user_id:      user.user_id,
    username:     user.username,
    role:         user.role,
    company_id:   user.company_id  ?? null,
    authority_id: user.authority_id ?? null,
  };

  if (!process.env.JWT_SECRET) {
    throw { status: 500, message: 'JWT secret is not configured', code: 'AUTH_CONFIG_ERROR' };
  }

  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRES });
  return { token, user: payload };
}

export async function registerUser(input: RegisterUserInput) {
  const hash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const result = await pool.query(
    `INSERT INTO Users (username, password_hash, role, company_id, authority_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING user_id, username, role, company_id, authority_id`,
    [input.username, hash, input.role, input.company_id ?? null, input.authority_id ?? null]
  );
  return result.rows[0];
}
