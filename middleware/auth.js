/**
 * Authentication Middleware
 * Provides JWT token verification and user authentication
 */

const jwt = require('jsonwebtoken');

// JWT Secret - Should be in environment variables for production
// JWT Secret - Should match the one used in authentication module
const JWT_SECRET = 'employdex-base-v1-secure-jwt-secret';

/**
 * Authentication middleware to verify JWT tokens
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  console.log('[Auth Middleware] Request to:', req.method, req.path);
  console.log('[Auth Middleware] Auth header:', authHeader ? 'Present' : 'Missing');
  console.log('[Auth Middleware] Token extracted:', token ? 'Present' : 'Missing');
  
  if (!token) {
    console.log('[Auth Middleware] No token provided - returning 401');
    return res.status(401).json({ error: 'Access token is required' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('[Auth Middleware] JWT verification error:', err.message);
      console.log('[Auth Middleware] Token that failed:', token.substring(0, 20) + '...');
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    console.log('[Auth Middleware] Token verified successfully for user:', decoded.user?.email);
    console.log('[Auth Middleware] User roles:', decoded.user?.roles);
    
    // Extract the user object from the decoded token payload
    // The user information is nested under the 'user' property in the JWT payload
    req.user = decoded.user;
    next();
  });
};

/**
 * Permission check middleware
 * @param {String} permission - Permission required to access the route
 * @returns {Function} Express middleware function
 */
const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    // Check if the user has the required permission
    // This assumes that permissions are stored in the user object from the JWT
    if (req.user.permissions && req.user.permissions.includes(permission)) {
      return next();
    }

    // If user is admin, allow all permissions
    if (req.user.role === 'admin') {
      return next();
    }

    return res.status(403).json({ error: 'Insufficient permissions' });
  };
};

module.exports = {
  authenticateToken,
  checkPermission,
  JWT_SECRET
};
