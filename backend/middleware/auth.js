// ============================================================
// middleware/auth.js — JWT Authentication Middleware (pg)
// ============================================================
const jwt = require('jsonwebtoken');
const db  = require('../config/database');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const token   = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // pg: positional $1 placeholder, returns rows array
    const user = await db.queryOne(
      `SELECT id, name, email, role, department, avatar, is_active,
              student_number, batch_number, batch_section
       FROM users WHERE id = $1`,
      [decoded.id]
    );

    if (!user) {
      return res.status(401).json({ success: false, message: 'Token invalid: user not found.' });
    }
    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account deactivated. Contact admin.' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please log in again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

// Role-based access control
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized.' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Required: ${roles.join(' or ')}. Your role: ${req.user.role}`,
    });
  }
  next();
};

const isAdmin          = requireRole('admin');
const isTeacherOrAdmin = requireRole('teacher', 'admin');
const isStudent        = requireRole('student');

module.exports = { auth, requireRole, isAdmin, isTeacherOrAdmin, isStudent };
