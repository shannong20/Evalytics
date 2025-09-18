const userService = require('../services/userService.new');
const { USER_TYPES, USER_ROLES } = userService;

/**
 * List all users with optional filters
 * @route GET /api/users
 */
const listUsers = async (req, res) => {
  try {
    const { 
      userType, 
      role, 
      departmentId, 
      isActive = true,
      limit = 100,
      offset = 0
    } = req.query;

    const users = await userService.listUsers({
      userType,
      role,
      departmentId: departmentId || undefined,
      isActive: isActive === 'true' || isActive === true,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    return res.status(200).json({
      status: 'success',
      data: { users }
    });
  } catch (error) {
    console.error('List users error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get a single user by ID
 * @route GET /api/users/:id
 */
const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userService.findUserById(id);
    
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
    console.error('Get user error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Create a new user (admin only)
 * @route POST /api/users
 */
const createUser = async (req, res) => {
  const { 
    firstName, 
    lastName, 
    middleInitial = '', 
    email, 
    password, 
    userType = USER_TYPES.USER, 
    role, 
    departmentId = null 
  } = req.body;

  // Validate request body
  const errors = [];
  if (!firstName) errors.push({ field: 'firstName', message: 'First name is required' });
  if (!lastName) errors.push({ field: 'lastName', message: 'Last name is required' });
  if (!email) errors.push({ field: 'email', message: 'Email is required' });
  if (!password) errors.push({ field: 'password', message: 'Password is required' });
  
  if (errors.length > 0) {
    return res.status(400).json({ 
      status: 'error',
      message: 'Validation failed',
      errors
    });
  }

  // Validate user type and role
  if (!Object.values(USER_TYPES).includes(userType)) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid user type',
      validTypes: Object.values(USER_TYPES)
    });
  }

  // Normalize role
  const normalizedRole = role ? role.toLowerCase() : null;
  if (userType === USER_TYPES.USER && normalizedRole && !Object.values(USER_ROLES).includes(normalizedRole)) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid role for user type',
      validRoles: Object.values(USER_ROLES)
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

    // Create new user
    const newUser = await userService.createUser({
      firstName,
      lastName,
      middleInitial,
      email,
      password,
      userType,
      role: normalizedRole,
      departmentId
    });

    // Return success response
    return res.status(201).json({
      status: 'success',
      message: 'User created successfully',
      data: {
        user: newUser
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update a user (admin only)
 * @route PATCH /api/users/:id
 */
const updateUser = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  try {
    // Check if user exists
    const existingUser = await userService.findUserById(id);
    if (!existingUser) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Remove restricted fields if not admin
    const { password, ...allowedUpdates } = updates;
    
    // Update user
    const updatedUser = await userService.updateUser(id, allowedUpdates);
    
    return res.status(200).json({
      status: 'success',
      message: 'User updated successfully',
      data: { user: updatedUser }
    });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Delete a user (admin only)
 * @route DELETE /api/users/:id
 */
const deleteUser = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Check if user exists
    const existingUser = await userService.findUserById(id);
    if (!existingUser) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Soft delete by setting is_active to false
    await userService.updateUser(id, { isActive: false });
    
    return res.status(200).json({
      status: 'success',
      message: 'User deactivated successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * List faculty members with department filter
 * @route GET /api/users/faculty
 */
const listFaculty = async (req, res) => {
  try {
    const { departmentId } = req.query;
    
    const faculty = await userService.listUsers({
      userType: USER_TYPES.USER,
      role: USER_ROLES.FACULTY,
      departmentId: departmentId || undefined,
      isActive: true
    });

    return res.status(200).json({
      status: 'success',
      data: { faculty }
    });
  } catch (error) {
    console.error('List faculty error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * List students with optional filters
 * @route GET /api/users/students
 */
const listStudents = async (req, res) => {
  try {
    const { departmentId } = req.query;
    
    const students = await userService.listUsers({
      userType: USER_TYPES.USER,
      role: USER_ROLES.STUDENT,
      departmentId: departmentId || undefined,
      isActive: true
    });

    return res.status(200).json({
      status: 'success',
      data: { students }
    });
  } catch (error) {
    console.error('List students error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * List supervisors with optional filters
 * @route GET /api/users/supervisors
 */
const listSupervisors = async (req, res) => {
  try {
    const { departmentId } = req.query;
    
    const supervisors = await userService.listUsers({
      userType: USER_TYPES.USER,
      role: USER_ROLES.SUPERVISOR,
      departmentId: departmentId || undefined,
      isActive: true
    });

    return res.status(200).json({
      status: 'success',
      data: { supervisors }
    });
  } catch (error) {
    console.error('List supervisors error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  listFaculty,
  listStudents,
  listSupervisors
};
