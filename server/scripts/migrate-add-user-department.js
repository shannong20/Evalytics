// Adds department column to users table if it does not exist
const { query } = require('../config/db');

async function run() {
  try {
    console.log('Starting migration: add users.department column if not exists...');
    await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(255)");
    console.log('✅ Migration complete: users.department ensured');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

run();
