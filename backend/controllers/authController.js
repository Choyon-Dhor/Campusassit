const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { userRepo, passwordResetTokenRepo } = require('../repositories');
const { UserFactory } = require('../services/UserFactory');

const PASSWORD_MIN_LENGTH = 6;
const RESET_MSG = 'If an account exists for that email, password reset instructions have been sent.';
const VALID_ROLES = new Set(['student', 'teacher', 'admin']);

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const getResetTtl = () => {
  const parsed = parseInt(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 30;
};

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const isValidPassword = (pw) => typeof pw === 'string' && pw.length >= PASSWORD_MIN_LENGTH;
const getFrontendUrl = () => (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');

function sanitize(user) {
  const { password, ...safe } = user;
  return safe;
}

exports.register = async (req, res, next) => {
  try {
    const {
      name, email, password,
      role = 'student', department,
      student_number, batch_number, batch_section,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    if (await userRepo.findByEmail(email)) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    if (student_number && await userRepo.findOne({ student_number })) {
      return res.status(409).json({ success: false, message: 'That Student ID is already linked to another account.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const payload = {
      name,
      email,
      password: hashedPassword,
      role: VALID_ROLES.has(role) ? role : 'student',
      department,
      ...(student_number && { student_number }),
      ...(batch_number && { batch_number: parseInt(batch_number, 10) }),
      ...(batch_section && { batch_section }),
    };

    const user = await userRepo.create(payload);

    if (student_number) {
      await db.query(
        `UPDATE results SET student_id = $1 WHERE student_number = $2 AND student_id IS NULL`,
        [user.id, student_number]
      );
    }

    const userObj = UserFactory.create(user);
    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token: signToken(user.id),
      user: userObj.toJSON(),
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await userRepo.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account deactivated.' });
    }

    const userObj = UserFactory.create(user);
    res.json({
      success: true,
      message: 'Login successful.',
      token: signToken(user.id),
      user: userObj.toJSON(),
    });
  } catch (err) {
    next(err);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const email = (req.body.email || '').trim();
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const user = await userRepo.findByEmail(email);
    let resetToken = null;

    if (user && user.is_active !== false) {
      resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + getResetTtl() * 60 * 1000);
      await passwordResetTokenRepo.createForUser(user.id, hashToken(resetToken), expiresAt);
    }

    const resPayload = { success: true, message: RESET_MSG };
    if (resetToken && (process.env.NODE_ENV !== 'production' || process.env.RETURN_PASSWORD_RESET_TOKEN === 'true')) {
      resPayload.resetToken = resetToken;
      resPayload.resetUrl = `${getFrontendUrl()}/reset-password/${resetToken}`;
    }

    res.json(resPayload);
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !isValidPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: `Token and a password with at least ${PASSWORD_MIN_LENGTH} characters are required.`,
      });
    }

    const resetRecord = await passwordResetTokenRepo.findValidByHash(hashToken(token));
    if (!resetRecord || resetRecord.is_active === false) {
      return res.status(400).json({ success: false, message: 'Password reset link is invalid or expired.' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await userRepo.update(resetRecord.user_id, { password: hashed });
    await passwordResetTokenRepo.markUserTokensUsed(resetRecord.user_id);

    res.json({ success: true, message: 'Password has been reset. You can now sign in.' });
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await userRepo.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    const userObj = UserFactory.create(sanitize(user));
    res.json({ success: true, user: userObj.toJSON() });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, department, student_number, batch_number, batch_section } = req.body;
    const payload = { name, department };
    if (student_number !== undefined) payload.student_number = student_number || null;
    if (batch_number !== undefined) payload.batch_number = batch_number ? parseInt(batch_number, 10) : null;
    if (batch_section !== undefined) payload.batch_section = batch_section || null;

    await userRepo.update(req.user.id, payload);
    const updated = await userRepo.findById(req.user.id);
    res.json({ success: true, message: 'Profile updated.', user: sanitize(updated) });
  } catch (err) {
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !isValidPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: `Current password and a new password with at least ${PASSWORD_MIN_LENGTH} characters are required.`,
      });
    }

    const user = await userRepo.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (!(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await userRepo.update(req.user.id, { password: hashed });
    await passwordResetTokenRepo.markUserTokensUsed(req.user.id);
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    next(err);
  }
};

exports.getAllUsers = async (_req, res, next) => {
  try {
    const users = await userRepo.findAllForAdmin();
    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
};

exports.adminUpdateUser = async (req, res, next) => {
  try {
    const { name, department, student_number, batch_number, batch_section } = req.body;
    const { id } = req.params;

    const existing = await userRepo.findById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'User not found.' });

    if (student_number && student_number !== existing.student_number) {
      const claimed = await userRepo.findOne({ student_number });
      if (claimed && claimed.id !== parseInt(id, 10)) {
        return res.status(409).json({ success: false, message: 'That Student ID is already linked to another account.' });
      }
    }

    const payload = {};
    if (name !== undefined) payload.name = name;
    if (department !== undefined) payload.department = department;
    if (student_number !== undefined) payload.student_number = student_number || null;
    if (batch_number !== undefined) payload.batch_number = batch_number ? parseInt(batch_number, 10) : null;
    if (batch_section !== undefined) payload.batch_section = batch_section || null;

    const updated = await userRepo.update(id, payload);

    if (student_number && student_number !== existing.student_number) {
      await db.query(
        `UPDATE results SET student_id = $1 WHERE student_number = $2 AND student_id IS NULL`,
        [id, student_number]
      );
    }

    res.json({ success: true, message: 'User updated.', user: sanitize(updated) });
  } catch (err) {
    next(err);
  }
};

exports.adminResetUserPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!isValidPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: `New password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
      });
    }

    const user = await userRepo.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await userRepo.update(id, { password: hashed });
    await passwordResetTokenRepo.markUserTokensUsed(id);

    res.json({ success: true, message: `Password reset for ${user.email}.` });
  } catch (err) {
    next(err);
  }
};

exports.adminToggleUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await userRepo.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot deactivate admin accounts.' });

    const updated = await userRepo.update(id, { is_active: !user.is_active });
    res.json({
      success: true,
      message: `User ${updated.is_active ? 'activated' : 'deactivated'}.`,
      user: updated,
    });
  } catch (err) {
    next(err);
  }
};
