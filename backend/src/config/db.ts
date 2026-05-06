import { Pool, PoolConfig } from 'pg';

const config: PoolConfig = {
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME     || 'carbon_credits_db',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max:      parseInt(process.env.DB_POOL_MAX || '20', 10),
  idleTimeoutMillis:    30000,
  connectionTimeoutMillis: 2000,
};

export const pool = new Pool(config);

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL client error', err);
  process.exit(-1);
});

export async function testConnection(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('SELECT NOW()');
    console.log('PostgreSQL connection established successfully');
  } finally {
    client.release();
  }
}
