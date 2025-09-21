const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const userService = require('../services/userService.new');

// Debug helper function
const debugLog = (message, data = {}) => {
  console.log(`[AUTH MIDDLEWARE] ${new Date().toISOString()} - ${message}`, 
    Object.keys(data).length ? JSON.stringify(data, null, 2) : '');
};

/**
 * Protect routes - require authentication
 */
exports.protect = async (req, res, next) => {
  debugLog('Starting authentication check', {
    url: req.originalUrl,
    method: req.method,
    hasAuthHeader: !!req.headers.authorization,
    hasJwtCookie: !!req.cookies?.jwt,
    hasAuthCookie: !!req.cookies?.auth
  });

  try {
    // 1) Get token and check if it exists
    let token;
    let tokenSource = 'none';
    
    // Check Authorization header first
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
      tokenSource = 'authorization header';
      debugLog('Found token in Authorization header');
    } 
    // Then check cookies
    else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
      tokenSource = 'jwt cookie';
      debugLog('Found token in jwt cookie');
    }
    // Also check for token in the auth cookie (used by the client)
    else if (req.cookies?.auth) {
      try {
        debugLog('Found auth cookie, attempting to parse', { authCookie: req.cookies.auth });
        const authData = JSON.parse(req.cookies.auth);
        if (authData && authData.token) {
          token = authData.token;
          tokenSource = 'auth cookie';
          debugLog('Successfully extracted token from auth cookie');
        } else {
          debugLog('Auth cookie exists but no token found');
        }
      } catch (e) {
        console.error('Error parsing auth cookie:', e);
        debugLog('Error parsing auth cookie', { error: e.message });
      }
    }

    if (!token) {
      debugLog('No authentication token found in request', {
        headers: req.headers,
        cookies: req.cookies
      });
      
      return res.status(401).json({
        status: 'error',
        message: 'You are not logged in! Please log in to get access.'
      });
    }

    // 2) Verify token
    let decoded;
    try {
      debugLog('Verifying JWT token', { tokenSource });
      decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
      debugLog('JWT token verified successfully', { userId: decoded.id });
    } catch (error) {
      debugLog('JWT verification failed', { 
        error: error.message,
        name: error.name,
        expiredAt: error.expiredAt
      });
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          status: 'error',
          message: 'Your session has expired. Please log in again.'
        });
      }
      
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token. Please log in again.'
      });
    }

    // 3) Check if user still exists
    debugLog('Looking up user in database', { userId: decoded.id });
    const currentUser = await userService.findUserById(decoded.id);
    
    if (!currentUser) {
      debugLog('User not found in database', { userId: decoded.id });
      return res.status(401).json({
        status: 'error',
        message: 'The user belonging to this token no longer exists.'
      });
    }

    // 4) Check if user changed password after the token was issued
    // (Not implemented - would require a passwordChangedAt field in the users table)

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    res.locals.user = currentUser;
    
    debugLog('Authentication successful', { 
      userId: currentUser.user_id,
      email: currentUser.email,
      userType: currentUser.user_type,
      role: currentUser.role
    });
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    debugLog('Authentication error', { 
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return res.status(401).json({
      status: 'error',
      message: 'You are not logged in! Please log in to get access.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Restrict access to certain user types/roles
 * @param  {...string} allowedTypes - Array of allowed user types/roles (e.g., 'Admin', 'User', 'Faculty')
 */
exports.restrictTo = (...allowedTypes) => {
  return (req, res, next) => {
    const userType = req.user?.userType || req.user?.role; // Check both userType and role for backward compatibility
    
    debugLog('Checking user access', { 
      userType: req.user?.userType,
      role: req.user?.role,
      allowedTypes 
    });
    
    if (!allowedTypes.includes(userType)) {
      debugLog('Access denied - insufficient permissions', { 
        userType: req.user?.userType,
        role: req.user?.role,
        allowedTypes 
      });
      return res.status(403).json({
        status: 'error',
        message: `You do not have permission to perform this action. Required: ${allowedTypes.join(' or ')}`
      });
    }
    
    debugLog('Access granted', { 
      userType: req.user?.userType,
      role: req.user?.role
    });
    next();
  };
};

/**
 * Check if user is logged in (for server-side rendering)
 * This is a non-blocking check that adds user to res.locals if authenticated
 */
exports.isLoggedIn = async (req, res, next) => {
  debugLog('isLoggedIn middleware checking authentication');
  
  if (req.cookies?.jwt) {
    try {
      const token = req.cookies.jwt;
      debugLog('Found JWT in cookies, attempting to verify', { token: token.substring(0, 10) + '...' });
      
      // 1) Verify token
      const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
      debugLog('JWT verified successfully', { userId: decoded.id });

      // 2) Check if user still exists
      const currentUser = await userService.findUserById(decoded.id);
      if (!currentUser) {
        debugLog('User not found in database', { userId: decoded.id });
        res.locals.user = null;
        return next();
      }

      // 3) There is a logged in user
      debugLog('User is authenticated', { 
        userId: currentUser.id, 
        email: currentUser.email,
        role: currentUser.role 
      });
      
      res.locals.user = currentUser;
      return next();
    } catch (error) {
      debugLog('Error in isLoggedIn middleware', { 
        error: error.message,
        name: error.name,
        expiredAt: error.expiredAt
      });
      
      // Clear invalid/expired token
      res.locals.user = null;
      return next();
    }
  } else {
    debugLog('No JWT cookie found in request');
    res.locals.user = null;
  }
  
  next();
};
