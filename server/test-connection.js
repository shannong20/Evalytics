const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function testConnection() {
  try {
    console.log('Testing database connection...');
    const client = await pool.connect();
    console.log('✅ Successfully connected to the database!');
    
    // Test query
    const result = await client.query('SELECT NOW()');
    console.log('🕒 Database time:', result.rows[0].now);
    
    // Check if users table exists
    const tableCheck = await client.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')"
    );
    
    console.log('📋 Users table exists:', tableCheck.rows[0].exists);
    
    // Count users
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    console.log(`👥 Total users: ${userCount.rows[0].count}`);
    
    client.release();
  } catch (error) {
    console.error('❌ Error connecting to the database:');
    console.error(error.message);
  } finally {
    await pool.end();
    process.exit();
  }
}

testConnection();
