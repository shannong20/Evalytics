const { Pool } = require('pg');
require('dotenv').config();

// Allow DB_PASS or DB_PASSWORD
const DB_PASSWORD = process.env.DB_PASS || process.env.DB_PASSWORD;
const port = parseInt(process.env.DB_PORT, 10);

// Validate required environment variables
const requiredEnv = {
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,
};

const missing = Object.entries(requiredEnv)
  .filter(([, v]) => v === undefined || v === null || String(v).trim() === '')
  .map(([k]) => k);

if (missing.length) {
  console.error('❌ Missing required environment variables:', missing.join(', '));
  process.exit(1);
}

const pool = new Pool({
  host: process.env.DB_HOST,
  port,
  user: process.env.DB_USER,
  password: DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionTimeoutMillis: 5000,
});

async function testConnection() {
  try {
    console.log(`🔌 Testing PostgreSQL connection to ${process.env.DB_HOST}:${port} (db=${process.env.DB_NAME}, user=${process.env.DB_USER})`);
    const client = await pool.connect();
    const result = await client.query('SELECT version() AS version, NOW() AS now');
    console.log('✅ Connection successful');
    console.log('🗒️  Version:', result.rows[0].version);
    console.log('🕒 Server time:', result.rows[0].now);
    client.release();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error connecting to the database:');
    console.error(error.message);
    process.exit(1);
  }
}

testConnection();
