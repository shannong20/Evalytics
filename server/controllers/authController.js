const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { query } = require('../config/db');

// Cache whether the users.department column exists to avoid repeated lookups
let hasDepartmentColumn;
async function ensureDepartmentColumnChecked() {
  if (typeof hasDepartmentColumn === 'boolean') return hasDepartmentColumn;
  try {
    const check = await query(
      "SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'department' LIMIT 1"
    );
    hasDepartmentColumn = check && check.rowCount > 0;
  } catch (e) {
    // If the check fails, assume column does not exist to avoid breaking signup
    hasDepartmentColumn = false;
  }
  return hasDepartmentColumn;
}

const signup = async (req, res) => {
  const { firstname, lastname, email, password, role, department } = req.body;

  // Handle validation errors from express-validator in routes/auth.js
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Validation error', errors: errors.array() });
  }

  // Normalize and validate role: allow student, professor, supervisor, admin, user
  const allowedRoles = ['student', 'faculty', 'supervisor', 'admin'];
  // Normalize role safely: trim/lowercase; fallback to 'student' if missing or invalid
  const rawRole = typeof role === 'string' ? role : (role == null ? '' : String(role));
  const candidate = rawRole.trim().toLowerCase();
  let normalizedRole = candidate && allowedRoles.includes(candidate) ? candidate : rawRole;
  try {
    // Check once whether department column exists
    await ensureDepartmentColumnChecked();
    if (!candidate || !allowedRoles.includes(candidate)) {
      console.warn('Signup role fallback applied. Received:', rawRole, 'Using:', normalizedRole);
    } else {
      console.log('Signup role received:', rawRole, 'normalized:', normalizedRole);
    }
  } catch {}

  try {
    // Check if user already exists
    const existingUser = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user (conditionally include department if column exists)
    let newUser;
    if (hasDepartmentColumn) {
      newUser = await query(
        'INSERT INTO users (firstname, lastname, email, password, role, department) VALUES ($1, $2, $3, $4, $5, $6) RETURNING user_id, firstname, lastname, email, role, department, created_at',
        [firstname, lastname, email, hashedPassword, normalizedRole, department || null]
      );
    } else {
      newUser = await query(
        'INSERT INTO users (firstname, lastname, email, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING user_id, firstname, lastname, email, role, created_at',
        [firstname, lastname, email, hashedPassword, normalizedRole]
      );
    }

    // Minimal log for diagnostics (no sensitive data)
    try {
      console.log(`Signup: created user ${newUser.rows[0].email} with role ${newUser.rows[0].role}`);
    } catch {}

    // Generate JWT (optional on signup). Keeping for API compatibility
    let token;
    try {
      token = jwt.sign(
        { id: newUser.rows[0].user_id, role: newUser.rows[0].role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );
    } catch (e) {
      console.error('JWT sign error during signup:', e && e.message ? e.message : e);
    }

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      token,
      data: {
        user: newUser.rows[0],
      },
    });
  } catch (error) {
    // Log detailed error info for debugging
    console.error('Signup error:', {
      code: error && error.code,
      message: error && error.message,
      detail: error && error.detail,
      constraint: error && error.constraint,
    });

    // Unique violation (e.g., email already exists)
    if (error && error.code === '23505') {
      return res.status(409).json({ message: 'User already exists with this email' });
    }

    // Check constraint or enum value error for role
    if (error && (error.code === '23514' || error.code === '22P02')) {
      return res.status(400).json({ message: `Invalid role. Allowed roles: ${allowedRoles.join(', ')}` });
    }

    res.status(500).json({ message: 'Error creating user' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const user = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.rows[0].user_id, role: user.rows[0].role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user.rows[0];

    res.status(200).json({
      status: 'success',
      token,
      data: {
        user: userWithoutPassword
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error during login' });
  }
};

module.exports = {
  signup,
  login
};
