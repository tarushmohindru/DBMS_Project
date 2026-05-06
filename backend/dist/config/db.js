"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.testConnection = testConnection;
const pg_1 = require("pg");
const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'carbon_credits_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: parseInt(process.env.DB_POOL_MAX || '20', 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};
exports.pool = new pg_1.Pool(config);
exports.pool.on('error', (err) => {
    console.error('Unexpected PostgreSQL client error', err);
    process.exit(-1);
});
async function testConnection() {
    const client = await exports.pool.connect();
    try {
        await client.query('SELECT NOW()');
        console.log('PostgreSQL connection established successfully');
    }
    finally {
        client.release();
    }
}
//# sourceMappingURL=db.js.map