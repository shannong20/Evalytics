const { Pool } = require('pg');
require('dotenv').config();

// Allow DB_PASS or DB_PASSWORD
const DB_PASSWORD = process.env.DB_PASS || process.env.DB_PASSWORD;

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
  port: parseInt(process.env.DB_PORT, 10),
  user: process.env.DB_USER,
  password: DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 10,
});

// Test the database connection once on startup
async function testConnection() {
  let client;
  try {
    console.log(
      `🔌 Trying to connect to PostgreSQL at ${process.env.DB_HOST}:${parseInt(process.env.DB_PORT, 10)} (db=${process.env.DB_NAME}, user=${process.env.DB_USER})`
    );
    client = await pool.connect();
    const { rows } = await client.query('SELECT NOW() AS now');
    console.log(`✅ Database connection successful. Server time: ${rows[0].now}`);
  } catch (err) {
    console.error('❌ Error connecting to the database:');
    console.error(`   ${err.message}`);
  } finally {
    if (client) client.release();
  }
}

testConnection();

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};
