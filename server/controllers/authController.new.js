const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const userService = require('../services/userService.new');
const departmentService = require('../services/departmentService');
const { USER_TYPES, USER_ROLES } = userService;

/**
 * Sign up a new user
 * @route POST /api/auth/signup
 */
const signup = async (req, res) => {
  const { 
    firstName, 
    lastName, 
    middleInitial = '', 
    email, 
    password, 
    userType = USER_TYPES.USER, 
    role, 
    departmentId = null,
    departmentName
  } = req.body;

  // Validate request body
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      status: 'error',
      message: 'Validation failed',
      errors: errors.array() 
    });
  }

  // Normalize input to lowercase for validation
  const toLc = (v) => (typeof v === 'string' ? v.trim().toLowerCase() : '');
  const userTypeLc = toLc(userType);
  const roleLc = toLc(role);
  // Sanitize middleInitial: trim spaces, take first char, or set to null
  const cleanMiddleInitial = (typeof middleInitial === 'string' ? middleInitial.trim().slice(0, 1) : '') || null;
  // Build lowercase-allowed sets derived from service enums (handles mixed-case constants)
  const ALLOWED_TYPES_LC = Object.values(USER_TYPES).map(v => (typeof v === 'string' ? v.toLowerCase() : v));
  const ALLOWED_ROLES_LC = Object.values(USER_ROLES).map(v => (typeof v === 'string' ? v.toLowerCase() : v));

  // Validate user type using lowercase enums derived from constants
  if (!ALLOWED_TYPES_LC.includes(userTypeLc)) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid user type',
      validTypes: Object.values(USER_TYPES)
    });
  }

  // Validate role only when userType is 'user'
  if (userTypeLc === 'user' && !ALLOWED_ROLES_LC.includes(roleLc)) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid role for user type',
      validRoles: Object.values(USER_ROLES)
    });
  }

  // Enforce department for applicable roles (student/faculty/supervisor)
  if (
    userTypeLc === 'user' &&
    ['student', 'faculty', 'supervisor'].includes(roleLc) &&
    !departmentId && !departmentName
  ) {
    return res.status(400).json({
      status: 'error',
      message: 'Department is required for the selected role'
    });
  }

  try {
    // Check if user already exists
    const existingUser = await userService.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ 
        status: 'error',
        message: 'Email already in use' 
      });
    }

    // Resolve departmentId if departmentName provided
    console.log('[AUTH] Signup received payload (safe):', {
      firstName,
      lastName,
      middleInitial: cleanMiddleInitial ? '*' : '',
      email,
      userType: userTypeLc,
      role: roleLc,
      departmentId,
      departmentName,
    });
    let resolvedDepartmentId = departmentId;
    if (!resolvedDepartmentId && departmentName) {
      const dep = await departmentService.findDepartmentByName(departmentName);
      if (!dep) {
        return res.status(400).json({ status: 'error', message: 'Invalid department name' });
      }
      resolvedDepartmentId = dep.department_id;
    }
    console.log('[AUTH] Signup resolved department:', {
      providedDepartmentId: departmentId,
      providedDepartmentName: departmentName,
      resolvedDepartmentId,
    });

    // Map userType/role to DB-required capitalization right before insert
    // Example: 'user' -> 'User', 'faculty' -> 'Faculty'
    const TYPE_MAP = { admin: 'Admin', user: 'User' };
    const ROLE_MAP = { faculty: 'Faculty', student: 'Student', supervisor: 'Supervisor' };
    const dbUserType = TYPE_MAP[userTypeLc] || 'User';
    const dbRole = userTypeLc === 'user' ? (ROLE_MAP[roleLc] || null) : null;

    // Create new user
    const newUser = await userService.createUser({
      firstName,
      lastName,
      middleInitial: cleanMiddleInitial,
      email,
      password,
      userType: dbUserType,
      role: dbRole,
      departmentId: resolvedDepartmentId
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: newUser.user_id, 
        email: newUser.email,
        userType: newUser.user_type,
        role: newUser.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    // Return success response
    return res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      token,
      data: {
        user: {
          id: newUser.user_id,
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          middleInitial: newUser.middle_initial,
          email: newUser.email,
          userType: newUser.user_type,
          role: newUser.role,
          departmentId: newUser.department_id,
          isActive: newUser.is_active ?? true
        }
      }
    });
  } catch (error) {
    // Gracefully handle common DB errors
    // 23505: unique_violation, 23503: foreign_key_violation, 23514: check_violation, 23502: not_null_violation
    if (error && error.code === '23505') {
      return res.status(409).json({ 
        status: 'error', 
        message: 'Email already in use',
        dbError: { code: error.code, message: error.message, detail: error.detail, constraint: error.constraint, schema: error.schema, table: error.table }
      });
    }
    if (error && error.code === '23503') {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Invalid department reference',
        dbError: { code: error.code, message: error.message, detail: error.detail, constraint: error.constraint, schema: error.schema, table: error.table }
      });
    }
    if (error && error.code === '23514') {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Invalid userType or role',
        dbError: { code: error.code, message: error.message, detail: error.detail, constraint: error.constraint, schema: error.schema, table: error.table }
      });
    }
    if (error && error.code === '23502') {
      // NOT NULL violation (likely department_id is NOT NULL in schema)
      return res.status(400).json({
        status: 'error',
        message: 'Database requires a non-null value for a field',
        hint: 'If this is about department_id for Admin, either supply a department or alter the DB to allow NULL for Admin users.',
        dbError: { code: error.code, message: error.message, detail: error.detail, column: error.column, constraint: error.constraint, schema: error.schema, table: error.table }
      });
    }
    console.error('Signup error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error during signup',
      dbError: process.env.NODE_ENV !== 'production' ? { code: error.code, message: error.message, detail: error.detail, constraint: error.constraint, schema: error.schema, table: error.table } : undefined
    });
  }
};

/**
 * Log in a user
 * @route POST /api/auth/login
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      status: 'error',
      message: 'Validation failed',
      errors: errors.array() 
    });
  }

  try {
    // Find user by email
    const user = await userService.findUserByEmail(email, true); // Include password for verification
    
    if (!user) {
      return res.status(401).json({ 
        status: 'error',
        message: 'Invalid email or password' 
      });
    }

    // Check if user is active (only if the column exists in the current schema)
    if (Object.prototype.hasOwnProperty.call(user, 'is_active') && user.is_active === false) {
      return res.status(403).json({
        status: 'error',
        message: 'Account is deactivated. Please contact an administrator.'
      });
    }

    // Verify password
    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        status: 'error',
        message: 'Invalid email or password' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.user_id, 
        email: user.email,
        userType: user.user_type,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    // Prepare user data for response (exclude sensitive info)
    const userData = {
      id: user.user_id,
      firstName: user.first_name,
      lastName: user.last_name,
      middleInitial: user.middle_initial,
      email: user.email,
      userType: user.user_type,
      role: user.role,
      departmentId: user.department_id,
      isActive: user.is_active,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };

    // Return success response
    return res.status(200).json({
      status: 'success',
      message: 'Login successful',
      token,
      data: {
        user: userData
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get current user's profile
 * @route GET /api/auth/me
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id; // From JWT middleware
    const user = await userService.findUserById(userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    return res.status(200).json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update user profile
 * @route PATCH /api/auth/me
 */
const updateProfile = async (req, res) => {
  const userId = req.user.id; // From JWT middleware
  const updates = { ...req.body };
  // Allow departmentName to be passed and translated into department_id
  const incomingDeptName = updates.departmentName || updates.department_name;
  if (incomingDeptName && !updates.department_id) {
    try {
      const dep = await departmentService.findDepartmentByName(incomingDeptName);
      if (!dep) {
        return res.status(400).json({ status: 'error', message: 'Invalid department name' });
      }
      updates.department_id = dep.department_id;
    } catch (e) {
      console.error('Department lookup error:', e);
      return res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  }
  // Safe log of updates
  const safeUpdates = { ...updates };
  if (safeUpdates.password) safeUpdates.password = '***';
  console.log('[AUTH] Update profile received (safe):', safeUpdates);
  
  // Remove restricted fields
  const { password, userType, role, ...allowedUpdates } = updates;
  
  if (Object.keys(allowedUpdates).length === 0) {
    return res.status(400).json({
      status: 'error',
      message: 'No valid fields to update'
    });
  }
  
  try {
    const updatedUser = await userService.updateUser(userId, allowedUpdates);
    
    if (!updatedUser) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: { user: updatedUser }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Change user password
 * @route POST /api/auth/change-password
 */
const changePassword = async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;
  
  // Validate request
  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      status: 'error',
      message: 'Current password and new password are required'
    });
  }
  
  try {
    // Get user with password hash
    const user = await userService.findUserById(userId, true);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Verify current password
    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Current password is incorrect'
      });
    }
    
    // Update password
    await userService.updateUserPassword(userId, newPassword);
    
    return res.status(200).json({
      status: 'success',
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  signup,
  login,
  getProfile,
  updateProfile,
  changePassword,
  USER_TYPES,
  USER_ROLES
};
