const { pool, query } = require('../config/db');
const bcrypt = require('bcryptjs');

// User types and their allowed roles
const USER_TYPES = {
  ADMIN: 'Admin',
  USER: 'User'
};

const USER_ROLES = {
  FACULTY: 'Faculty',
  STUDENT: 'Student',
  SUPERVISOR: 'Supervisor'
};

/**
 * Find a user by email
 * @param {string} email - User's email
 * @param {boolean} includePassword - Whether to include password hash in the result
 * @returns {Promise<object|null>} User object or null if not found
 */
async function findUserByEmail(email, includePassword = false) {
  try {
    const fields = [
      'user_id', 'first_name', 'last_name', 'middle_initial', 'email',
      'user_type', 'role', 'department_id'
    ];
    
    if (includePassword) {
      fields.push('password');
    }
    
    const sql = `
      SELECT ${fields.join(', ')}
      FROM users
      WHERE email = $1
      LIMIT 1
    `;
    
    const { rows } = await query(sql, [email]);
    return rows[0] || null;
  } catch (error) {
    console.error('Error finding user by email:', error);
    throw error;
  }
}

/**
 * Find a user by ID
 * @param {string} userId - User's ID
 * @param {boolean} includePassword - Whether to include password hash in the result
 * @returns {Promise<object|null>} User object or null if not found
 */
async function findUserById(userId, includePassword = false) {
  try {
    const fields = [
      'user_id', 'first_name', 'last_name', 'middle_initial', 'email',
      'user_type', 'role', 'department_id', 
    ];
    
    if (includePassword) {
      fields.push('password');
    }
    
    const sql = `
      SELECT ${fields.join(', ')}
      FROM users
      WHERE user_id = $1
      LIMIT 1
    `;
    
    const { rows } = await query(sql, [userId]);
    return rows[0] || null;
  } catch (error) {
    console.error('Error finding user by ID:', error);
    throw error;
  }
}

/**
 * Create a new user
 * @param {object} userData - User data
 * @returns {Promise<object>} Created user
 */
async function createUser({
  firstName,
  lastName,
  middleInitial = '',
  email,
  password,
  userType,
  role = null,
  departmentId = null
}) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // Insert user
    const userSql = `
      INSERT INTO users (
        first_name, last_name, middle_initial, email, 
        password, user_type, role, department_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING user_id, first_name, last_name, middle_initial, email, 
                user_type, role, department_id
    `;
    
    const userParams = [
      firstName,
      lastName,
      middleInitial,
      email,
      passwordHash,
      userType,
      role,
      departmentId
    ];
    
    const userResult = await client.query(userSql, userParams);
    const user = userResult.rows[0];
    
    await client.query('COMMIT');
    return user;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating user:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} Updated user
 */
async function updateUser(userId, updates) {
  const allowedFields = [
    'first_name', 'last_name', 'middle_initial', 'email',
    'user_type', 'role', 'department_id'
  ];
  
  const validUpdates = {};
  Object.keys(updates).forEach(key => {
    if (allowedFields.includes(key) && updates[key] !== undefined) {
      validUpdates[key] = updates[key];
    }
  });
  
  if (Object.keys(validUpdates).length === 0) {
    return findUserById(userId);
  }
  
  const setClause = Object.keys(validUpdates)
    .map((key, index) => `${key} = $${index + 2}`)
    .join(', ');
  
  const values = Object.values(validUpdates);
  values.unshift(userId);
  
  const sql = `
    UPDATE users
    SET ${setClause}, updated_at = NOW()
    WHERE user_id = $1
    RETURNING user_id, first_name, last_name, middle_initial, email, 
              user_type, role, department_id
  `;
  
  try {
    const { rows } = await query(sql, values);
    return rows[0] || null;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

/**
 * Update user password
 * @param {string} userId - User ID
 * @param {string} newPassword - New password
 * @returns {Promise<void>}
 */
async function updateUserPassword(userId, newPassword) {
  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    
    const sql = `
      UPDATE users
      SET password = $1, updated_at = NOW()
      WHERE user_id = $2
    `;
    
    await query(sql, [passwordHash, userId]);
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
}

/**
 * List users with optional filters
 * @param {object} filters - Filter criteria
 * @returns {Promise<Array>} List of users
 */
async function listUsers(filters = {}) {
  const { 
    userType, 
    role, 
    departmentId, 
    isActive = true,
    limit = 100,
    offset = 0
  } = filters;
  
  const whereClauses = ['is_active = $1'];
  const params = [isActive];
  let paramIndex = 2;
  
  if (userType) {
    whereClauses.push(`user_type = $${paramIndex++}`);
    params.push(userType);
  }
  
  if (role) {
    whereClauses.push(`role = $${paramIndex++}`);
    params.push(role);
  }
  
  if (departmentId) {
    whereClauses.push(`department_id = $${paramIndex++}`);
    params.push(departmentId);
  }
  
  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  
  const sql = `
    SELECT 
      user_id, first_name, last_name, middle_initial, email,
      user_type, role, department_id
    FROM users
    ${whereClause}
    ORDER BY last_name, first_name
    LIMIT $${paramIndex++} OFFSET $${paramIndex}
  `;
  
  params.push(limit, offset);
  
  try {
    const { rows } = await query(sql, params);
    return rows;
  } catch (error) {
    console.error('Error listing users:', error);
    throw error;
  }
}

// For backward compatibility
async function getUserById(userId) {
  return findUserById(userId);
}

module.exports = {
  // Constants
  USER_TYPES,
  USER_ROLES,
  
  // Core functions
  findUserByEmail,
  findUserById,
  createUser,
  updateUser,
  updateUserPassword,
  listUsers,
  getUserById
};
