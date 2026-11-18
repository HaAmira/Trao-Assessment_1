const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const config = require('../config/env');
const { isConnected } = require('../config/db');

// In-memory fallback users store for offline/demo operation when MongoDB daemon is not running
const memoryUsers = new Map();

function sendTokenCookie(res, user) {
  const token = jwt.sign(
    { id: user._id || user.id, email: user.email, name: user.name },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );

  const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  };

  res.cookie(config.COOKIE_NAME, token, cookieOptions);
  return token;
}

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (isConnected()) {
      const existing = await User.findOne({ email: cleanEmail });
      if (existing) {
        return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      }

      const user = await User.create({ name: name.trim(), email: cleanEmail, password });
      const token = sendTokenCookie(res, user);

      return res.status(201).json({
        success: true,
        message: 'Account registered successfully.',
        token,
        user: { id: user._id, name: user.name, email: user.email }
      });
    } else {
      // Memory Store Fallback
      if (memoryUsers.has(cleanEmail)) {
        return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const id = 'user_' + Date.now();
      const user = { _id: id, id, name: name.trim(), email: cleanEmail, password: hashedPassword };
      memoryUsers.set(cleanEmail, user);

      const token = sendTokenCookie(res, user);
      return res.status(201).json({
        success: true,
        message: 'Account registered successfully (local store).',
        token,
        user: { id: user._id, name: user.name, email: user.email }
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (isConnected()) {
      const user = await User.findOne({ email: cleanEmail });
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
      }

      const token = sendTokenCookie(res, user);
      return res.json({
        success: true,
        message: 'Logged in successfully.',
        token,
        user: { id: user._id, name: user.name, email: user.email }
      });
    } else {
      // Memory Store Fallback
      const user = memoryUsers.get(cleanEmail);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
      }

      const token = sendTokenCookie(res, user);
      return res.json({
        success: true,
        message: 'Logged in successfully.',
        token,
        user: { id: user._id, name: user.name, email: user.email }
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.logout = (req, res) => {
  res.clearCookie(config.COOKIE_NAME, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: config.NODE_ENV === 'production' ? 'none' : 'lax'
  });

  return res.json({ success: true, message: 'Logged out successfully.' });
};

exports.getMe = (req, res) => {
  return res.json({
    success: true,
    user: {
      id: req.user._id || req.user.id,
      name: req.user.name,
      email: req.user.email
    }
  });
};

