const { Pool } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file in the server directory
const envPath = path.resolve(__dirname, 'server/.env');
dotenv.config({ path: envPath });

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASS || process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
};

console.log('Database Configuration:', {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  database: dbConfig.database,
});

async function testConnection() {
  const pool = new Pool(dbConfig);
  let client;
  
  try {
    console.log('Attempting to connect to the database...');
    client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connection successful!');
    console.log('Current database time:', result.rows[0].now);
    
    // Test if users table exists
    const tableCheck = await client.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')"
    );
    console.log('Users table exists:', tableCheck.rows[0].exists);
    
    if (tableCheck.rows[0].exists) {
      const userCount = await client.query('SELECT COUNT(*) FROM users');
      console.log('Number of users in database:', userCount.rows[0].count);
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Error details:', error);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

testConnection();
