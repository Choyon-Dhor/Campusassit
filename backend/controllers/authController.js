// ============================================================
// controllers/authController.js
// ============================================================
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { userRepo }    = require('../repositories');
const { UserFactory } = require('../services/UserFactory');

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const {
      name, email, password,
      role = 'student', department,
      student_number,          // e.g. "231-115-094"
      batch_number,            // e.g. 58
      batch_section,           // e.g. "C"
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const existing = await userRepo.findByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    // If a student_number is given, make sure no one else already claimed it
    if (student_number) {
      const claimed = await userRepo.findOne({ student_number });
      if (claimed) {
        return res.status(409).json({ success: false, message: 'That Student ID is already linked to another account.' });
      }
    }

    const validRoles = ['student', 'teacher', 'admin'];
    const userRole = validRoles.includes(role) ? role : 'student';

    const hashedPassword = await bcrypt.hash(password, 10);

    // Build insert payload — only include optional fields when present
    const payload = { name, email, password: hashedPassword, role: userRole, department };
    if (student_number)  payload.student_number  = student_number;
    if (batch_number)    payload.batch_number    = parseInt(batch_number);
    if (batch_section)   payload.batch_section   = batch_section;

    const newUser = await userRepo.create(payload);

    // If this student_number already has results stored, link them to the new account
    if (student_number) {
      await require('../config/database').query(
        `UPDATE results SET student_id = $1
         WHERE student_number = $2 AND student_id IS NULL`,
        [newUser.id, student_number]
      );
    }

    const userObj = UserFactory.create(newUser);
    const token   = generateToken(newUser.id);

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
    if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    if (!user.is_active) return res.status(403).json({ success: false, message: 'Account deactivated.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    const userObj = UserFactory.create(user);
    const token   = generateToken(user.id);

    res.json({ success: true, message: 'Login successful.', token, user: userObj.toJSON() });
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
    const { name, department, student_number, batch_number, batch_section } = req.body;
    const payload = { name, department };
    if (student_number !== undefined) payload.student_number = student_number || null;
    if (batch_number   !== undefined) payload.batch_number   = batch_number ? parseInt(batch_number) : null;
    if (batch_section  !== undefined) payload.batch_section  = batch_section || null;
    await userRepo.update(req.user.id, payload);
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
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
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
    const users = await userRepo.findAllForAdmin();
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /api/auth/admin/users/:id  — admin edits any user
exports.adminUpdateUser = async (req, res) => {
  try {
    const { name, department, student_number, batch_number, batch_section } = req.body;
    const { id } = req.params;

    const existing = await userRepo.findById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'User not found.' });

    // If student_number is changing, check uniqueness
    if (student_number && student_number !== existing.student_number) {
      const claimed = await userRepo.findOne({ student_number });
      if (claimed && claimed.id !== parseInt(id)) {
        return res.status(409).json({ success: false, message: 'That Student ID is already linked to another account.' });
      }
    }

    const payload = {};
    if (name           !== undefined) payload.name           = name;
    if (department     !== undefined) payload.department     = department;
    if (student_number !== undefined) payload.student_number = student_number || null;
    if (batch_number   !== undefined) payload.batch_number   = batch_number ? parseInt(batch_number) : null;
    if (batch_section  !== undefined) payload.batch_section  = batch_section || null;

    const updated = await userRepo.update(id, payload);

    // Re-link results if student_number changed
    if (student_number && student_number !== existing.student_number) {
      const db = require('../config/database');
      await db.query(
        `UPDATE results SET student_id = $1 WHERE student_number = $2 AND student_id IS NULL`,
        [id, student_number]
      );
    }

    const { password, ...safe } = updated;
    res.json({ success: true, message: 'User updated.', user: safe });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/auth/admin/users/:id/toggle  — activate / deactivate
exports.adminToggleUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userRepo.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot deactivate admin accounts.' });

    const updated = await userRepo.update(id, { is_active: !user.is_active });
    res.json({ success: true, message: `User ${updated.is_active ? 'activated' : 'deactivated'}.`, user: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


