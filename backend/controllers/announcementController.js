// ============================================================
// controllers/announcementController.js (pg)
// ============================================================
const { announcementRepo } = require('../repositories');
const notificationService  = require('../services/NotificationService');
const db = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const role = req.user.role;
    const [announcements, total] = await Promise.all([
      announcementRepo.findWithAuthor(role, parseInt(page), parseInt(limit)),
      announcementRepo.countByRole(role),
    ]);
    res.json({ success: true, announcements, total,
      page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { title, content, category = 'general', target_role = 'all', is_pinned = false } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content required.' });
    }

    const created = await announcementRepo.create({
      title, content, author_id: req.user.id, category, target_role, is_pinned,
    });

    // Observer: notify all relevant users (exclude author)
    let userQuery = `SELECT id FROM users WHERE is_active = TRUE AND id != $1`;
    const params  = [req.user.id];
    if (target_role !== 'all') {
      params.push(target_role);
      userQuery += ` AND role = $2`;
    }
    const users = await db.query(userQuery, params);
    await notificationService.notifyNewAnnouncement(created, users.map(u => u.id));

    res.status(201).json({ success: true, announcement: created });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const ann = await announcementRepo.findById(req.params.id);
    if (!ann) return res.status(404).json({ success: false, message: 'Not found.' });
    if (ann.author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Permission denied.' });
    }
    const updated = await announcementRepo.update(req.params.id, req.body);
    res.json({ success: true, announcement: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const ann = await announcementRepo.findById(req.params.id);
    if (!ann) return res.status(404).json({ success: false, message: 'Not found.' });
    if (ann.author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Permission denied.' });
    }
    await announcementRepo.delete(req.params.id);
    res.json({ success: true, message: 'Deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
