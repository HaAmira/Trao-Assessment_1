const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');

async function authenticateToken(req, res, next) {
  try {
    let token = null;

    // 1. Check HTTP-only cookie
    if (req.cookies && req.cookies[config.COOKIE_NAME]) {
      token = req.cookies[config.COOKIE_NAME];
    }
    // 2. Check Authorization Bearer header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.'
      });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);
    
    // In memory or mongo mode: check user existence
    let user = null;
    try {
      user = await User.findById(decoded.id).select('-password');
    } catch (e) {
      // In case DB is not reachable or memory fallback
      user = { _id: decoded.id, email: decoded.email, name: decoded.name || 'User' };
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. User not found.'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.'
    });
  }
}

module.exports = {
  authenticateToken
};

