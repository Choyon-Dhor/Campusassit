// ============================================================
// controllers/announcementController.js (pg)
// ============================================================
const { announcementRepo } = require('../repositories');
const notificationService  = require('../services/NotificationService');
const db = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
    const role = req.user.role;

    const globalParams = [];
    let globalFilter = '';
    if (role !== 'admin') {
      globalParams.push(role);
      globalFilter = `WHERE a.target_role = 'all' OR a.target_role = $1`;
    }

    const globalAnnouncements = await db.query(
      `SELECT a.*, u.name AS author_name, u.role AS author_role, u.department AS author_dept,
              'global' AS source, FALSE AS is_readonly, NULL::text AS classroom_label
       FROM announcements a
       LEFT JOIN users u ON a.author_id = u.id
       ${globalFilter}`,
      globalParams
    );

    let classroomSql = `
      SELECT ca.*, u.name AS author_name, u.role AS author_role, u.department AS author_dept,
             'academic' AS category, 'all' AS target_role, FALSE AS is_pinned, NULL::varchar AS attachment,
             'classroom' AS source, TRUE AS is_readonly,
             c.course_code || ' - ' || c.course_name AS classroom_label
      FROM classroom_announcements ca
      JOIN users u ON ca.author_id = u.id
      JOIN classrooms c ON ca.classroom_id = c.id`;
    const classroomParams = [];

    if (role === 'teacher') {
      classroomParams.push(req.user.id);
      classroomSql += ' WHERE c.teacher_id = $1';
    } else if (role === 'student') {
      classroomParams.push(req.user.id);
      classroomSql += `
        JOIN classroom_students cs ON cs.classroom_id = ca.classroom_id
        WHERE cs.student_id = $1`;
    }

    const classroomAnnouncements = (await db.query(classroomSql, classroomParams)).map((announcement) => ({
      ...announcement,
      id: `classroom-${announcement.id}`,
      source_id: announcement.id,
    }));

    const combined = [...globalAnnouncements, ...classroomAnnouncements]
      .sort((left, right) => {
        if (left.is_pinned !== right.is_pinned) return left.is_pinned ? -1 : 1;
        return new Date(right.created_at) - new Date(left.created_at);
      });

    const total = combined.length;
    const offset = (page - 1) * limit;
    const announcements = combined.slice(offset, offset + limit);

    res.json({
      success: true,
      announcements,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
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
