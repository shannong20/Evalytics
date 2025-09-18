const { Pool } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from the server/.env explicitly
const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

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

const DB_SSL = String(process.env.DB_SSL || '').toLowerCase() === 'true';
const DB_SSL_REJECT_UNAUTHORIZED = String(process.env.DB_SSL_REJECT_UNAUTHORIZED || 'false').toLowerCase() === 'true';

const pool = new Pool({
  host: requiredEnv.DB_HOST,
  port: port,
  user: requiredEnv.DB_USER,
  password: requiredEnv.DB_PASSWORD,
  database: requiredEnv.DB_NAME,
  ssl: DB_SSL ? { rejectUnauthorized: DB_SSL_REJECT_UNAUTHORIZED } : false,
  connectionTimeoutMillis: 5000, // 5 seconds
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
