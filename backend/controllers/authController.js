// ============================================================
// controllers/authController.js — MVC Controller Layer
// ============================================================
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { userRepo } = require('../repositories');
const { UserFactory } = require('../services/UserFactory');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, role = 'student', department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const existing = await userRepo.findByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    const validRoles = ['student', 'teacher', 'admin'];
    const userRole = validRoles.includes(role) ? role : 'student';

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await userRepo.create({
      name, email, password: hashedPassword, role: userRole, department,
    });

    const userObj = UserFactory.create(newUser);
    const token = generateToken(newUser.id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: userObj.toJSON(),
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await userRepo.findByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account deactivated. Contact admin.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const userObj = UserFactory.create(user);
    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: userObj.toJSON(),
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await userRepo.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const { password, ...safeUser } = user;
    const userObj = UserFactory.create(safeUser);

    res.json({ success: true, user: userObj.toJSON() });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, department } = req.body;
    await userRepo.update(req.user.id, { name, department });
    const updated = await userRepo.findById(req.user.id);
    const { password, ...safeUser } = updated;
    res.json({ success: true, message: 'Profile updated.', user: safeUser });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /api/auth/change-password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await userRepo.findById(req.user.id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await userRepo.update(req.user.id, { password: hashed });
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/auth/users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await userRepo.findActive();
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
