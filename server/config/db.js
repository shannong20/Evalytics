const { Pool } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file in the server directory
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

// Allow DB_PASS or DB_PASSWORD environment variable
const DB_PASSWORD = process.env.DB_PASS || process.env.DB_PASSWORD;

// SSL flags via environment
const DB_SSL = String(process.env.DB_SSL || '').toLowerCase() === 'true';
const DB_SSL_REJECT_UNAUTHORIZED = String(process.env.DB_SSL_REJECT_UNAUTHORIZED || 'false').toLowerCase() === 'true';

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
  user: process.env.DB_USER,
  password: DB_PASSWORD,
  database: process.env.DB_NAME,
  // Connection timeout of 5 seconds
  connectionTimeoutMillis: 5000,
  // Maximum number of clients the pool should contain
  max: 20,
  // Maximum time (in milliseconds) a client can remain in the pool
  idleTimeoutMillis: 30000,
  // SSL configuration is now explicit
  ssl: DB_SSL ? { rejectUnauthorized: DB_SSL_REJECT_UNAUTHORIZED } : false,
};

// Log database configuration (without sensitive data)
console.log('Database Configuration:', {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  database: dbConfig.database,
  max: dbConfig.max,
  ssl: DB_SSL ? `enabled (rejectUnauthorized=${DB_SSL_REJECT_UNAUTHORIZED})` : 'disabled'
});

// Validate required configuration
const requiredConfig = ['host', 'port', 'user', 'password', 'database'];
const missingConfig = requiredConfig
  .filter(key => !dbConfig[key])
  .map(key => `DB_${key.toUpperCase()}`);

if (missingConfig.length > 0) {
  console.error('❌ Missing required database configuration:', missingConfig.join(', '));
  process.exit(1);
}

// Create a new pool using the configuration
const pool = new Pool(dbConfig);

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
