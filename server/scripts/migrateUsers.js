const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file in the server directory
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

// Verify required environment variables
const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.log('Current environment variables:', {
    DB_HOST: process.env.DB_HOST ? '*****' : 'MISSING',
    DB_PORT: process.env.DB_PORT ? '*****' : 'MISSING',
    DB_USER: process.env.DB_USER ? '*****' : 'MISSING',
    DB_PASSWORD: process.env.DB_PASSWORD ? '*****' : 'MISSING',
    DB_NAME: process.env.DB_NAME ? '*****' : 'MISSING'
  });
  process.exit(1);
}

const { query } = require('../config/db');
const bcrypt = require('bcryptjs');

/**
 * Migrate users from old schema to new schema
 * This script handles splitting the name field into first_name and last_name
 * and setting appropriate user_type and role values.
 */
async function migrateUsers() {
  console.log('Starting user migration...');
  
  try {
    // Check if the new columns exist, if not, add them
    console.log('Checking/creating new columns...');
    await query(`
      DO $$
      BEGIN
        -- Add first_name if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'users' AND column_name = 'first_name') THEN
          ALTER TABLE users ADD COLUMN first_name VARCHAR(100);
        END IF;
        
        -- Add last_name if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'users' AND column_name = 'last_name') THEN
          ALTER TABLE users ADD COLUMN last_name VARCHAR(100);
        END IF;
        
        -- Add middle_initial if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'users' AND column_name = 'middle_initial') THEN
          ALTER TABLE users ADD COLUMN middle_initial VARCHAR(1) DEFAULT '';
        END IF;
        
        -- Add user_type if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'users' AND column_name = 'user_type') THEN
          ALTER TABLE users ADD COLUMN user_type VARCHAR(20) DEFAULT 'user';
        END IF;
        
        -- Add role if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'users' AND column_name = 'role') THEN
          ALTER TABLE users ADD COLUMN role VARCHAR(20);
        END IF;
        
        -- Add department_id if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'users' AND column_name = 'department_id') THEN
          ALTER TABLE users ADD COLUMN department_id UUID REFERENCES departments(department_id);
        END IF;
      END $$;
    `);
    
    // Get all users with the old schema
    console.log('Fetching existing users...');
    const { rows: users } = await query('SELECT * FROM users');
    
    console.log(`Migrating ${users.length} users...`);
    
    // Process each user
    for (const user of users) {
      try {
        // Skip if already migrated (has first_name and last_name)
        if (user.first_name && user.last_name) {
          console.log(`Skipping already migrated user: ${user.email}`);
          continue;
        }
        
        // Split name into first and last name
        let firstName = '';
        let lastName = '';
        let middleInitial = '';
        
        if (user.name) {
          const nameParts = user.name.trim().split(/\s+/);
          
          if (nameParts.length === 1) {
            // Only one name part, use as last name
            lastName = nameParts[0];
          } else if (nameParts.length === 2) {
            // Two name parts, assume first and last name
            [firstName, lastName] = nameParts;
          } else {
            // More than two parts, assume first, middle initial, last
            firstName = nameParts[0];
            lastName = nameParts[nameParts.length - 1];
            
            // Get middle initial if available
            if (nameParts.length > 2) {
              const middleName = nameParts[1];
              middleInitial = middleName[0].toUpperCase();
            }
          }
        }
        
        // Determine user type and role
        let userType = 'user';
        let role = null;
        
        // Check if user is admin (you'll need to adjust this based on your current admin detection)
        if (user.is_admin) {
          userType = 'admin';
        } else {
          // Try to determine role from existing data
          // This is just an example - adjust based on your current schema
          if (user.role) {
            // If you already have a role column
            role = user.role.toLowerCase();
          } else {
            // Default to student if no role is set
            role = 'student';
          }
        }
        
        // Update user with new schema
        await query(
          `UPDATE users 
           SET first_name = $1, 
               last_name = $2, 
               middle_initial = $3,
               user_type = $4,
               role = $5,
               updated_at = NOW()
           WHERE id = $6`,
          [firstName, lastName, middleInitial, userType, role, user.id]
        );
        
        console.log(`Migrated user: ${user.email} (${firstName} ${lastName})`);
      } catch (error) {
        console.error(`Error migrating user ${user.email || user.id}:`, error.message);
      }
    }
    
    console.log('User migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateUsers();
