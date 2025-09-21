const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/evalytics'
});

const departments = [
  'Computer Science',
  'Information Technology',
  'Information Systems',
  'Computer Engineering',
  'Data Science',
  'Cybersecurity',
  'Software Engineering',
  'Computer Network',
  'Multimedia Arts',
  'Digital Forensics'
];

async function seedDepartments() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Insert departments
    for (const name of departments) {
      await client.query(
        'INSERT INTO department (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
        [name]
      );
      console.log(`Added department: ${name}`);
    }
    
    await client.query('COMMIT');
    console.log('Successfully seeded departments');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error seeding departments:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seedDepartments()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
