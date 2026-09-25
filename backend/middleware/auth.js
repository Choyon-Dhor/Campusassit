const jwt = require('jsonwebtoken');
const db = require('../config/database');

const auth = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  try {
    const token = header.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await db.queryOne(
      `SELECT id, name, email, role, department, avatar, is_active,
              student_number, batch_number, batch_section
       FROM users WHERE id = $1`,
      [decoded.id]
    );

    if (!user) return res.status(401).json({ success: false, message: 'Token invalid: user not found.' });
    if (!user.is_active) return res.status(403).json({ success: false, message: 'Account deactivated. Contact admin.' });

    req.user = user;
    next();
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Token expired. Please log in again.' : 'Invalid token.';
    res.status(401).json({ success: false, message });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized.' });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Required: ${roles.join(' or ')}. Your role: ${req.user.role}`,
    });
  }
  next();
};

module.exports = {
  auth,
  requireRole,
  isAdmin: requireRole('admin'),
  isTeacherOrAdmin: requireRole('teacher', 'admin'),
  isStudent: requireRole('student'),
};
