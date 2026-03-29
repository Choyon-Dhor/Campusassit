// ============================================================
// controllers/featureControllers.js (pg)
// ============================================================
const db = require('../config/database');
const {
  studyGroupRepo, deadlineRepo, consultationRepo, resourceRepo,
} = require('../repositories');
const notificationService  = require('../services/NotificationService');
const recommendationService = require('../services/RecommendationService');

// ============================================================
// Study Groups
// ============================================================
exports.studyGroup = {
  getAll: async (req, res) => {
    try {
      const groups = await studyGroupRepo.findWithDetails(req.user.id);
      res.json({ success: true, groups });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },

  create: async (req, res) => {
    try {
      const { name, description, course_code, course_name,
              max_members = 10, is_private = false, meeting_schedule } = req.body;
      if (!name) return res.status(400).json({ success: false, message: 'Group name required.' });

      const group = await studyGroupRepo.create({
        name, description, course_code, course_name,
        creator_id: req.user.id, max_members, is_private, meeting_schedule,
      });
      await studyGroupRepo.joinGroup(group.id, req.user.id, 'creator');
      res.status(201).json({ success: true, group });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },

  join: async (req, res) => {
    try {
      const group = await studyGroupRepo.findById(req.params.id);
      if (!group) return res.status(404).json({ success: false, message: 'Group not found.' });
      if (await studyGroupRepo.isMember(req.params.id, req.user.id))
        return res.status(400).json({ success: false, message: 'Already a member.' });

      const members = await studyGroupRepo.getMembers(req.params.id);
      if (members.length >= group.max_members)
        return res.status(400).json({ success: false, message: 'Group is full.' });

      await studyGroupRepo.joinGroup(req.params.id, req.user.id);
      await notificationService.notifyStudyGroupInvite(group, req.user.id);
      res.json({ success: true, message: 'Joined group successfully.' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },

  leave: async (req, res) => {
    try {
      await studyGroupRepo.leaveGroup(req.params.id, req.user.id);
      res.json({ success: true, message: 'Left group.' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },

  getMembers: async (req, res) => {
    try {
      const members = await studyGroupRepo.getMembers(req.params.id);
      res.json({ success: true, members });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },

  delete: async (req, res) => {
    try {
      const group = await studyGroupRepo.findById(req.params.id);
      if (!group) return res.status(404).json({ success: false, message: 'Not found.' });
      if (group.creator_id !== req.user.id && req.user.role !== 'admin')
        return res.status(403).json({ success: false, message: 'Permission denied.' });
      await studyGroupRepo.delete(req.params.id);
      res.json({ success: true, message: 'Group deleted.' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },
};

// ============================================================
// Deadlines
// ============================================================
exports.deadline = {
  getAll: async (req, res) => {
    try {
      const { completed, type } = req.query;
      const filters = {};
      if (completed !== undefined) filters.completed = completed === 'true';
      if (type) filters.type = type;
      const deadlines = await deadlineRepo.findByUser(req.user.id, filters);
      res.json({ success: true, deadlines });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },

  getUpcoming: async (req, res) => {
    try {
      const deadlines = await deadlineRepo.getUpcoming(req.user.id, parseInt(req.query.days) || 7);
      res.json({ success: true, deadlines });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },

  create: async (req, res) => {
    try {
      const { title, description, course_code, course_name,
              deadline_date, type = 'assignment', priority = 'medium' } = req.body;
      if (!title || !deadline_date)
        return res.status(400).json({ success: false, message: 'Title and deadline date required.' });
      const deadline = await deadlineRepo.create({
        title, description, course_code, course_name,
        deadline_date, type, priority, user_id: req.user.id,
      });
      res.status(201).json({ success: true, deadline });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },

  update: async (req, res) => {
    try {
      const d = await deadlineRepo.findById(req.params.id);
      if (!d || d.user_id !== req.user.id)
        return res.status(404).json({ success: false, message: 'Not found.' });
      const updated = await deadlineRepo.update(req.params.id, req.body);
      res.json({ success: true, deadline: updated });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },

  delete: async (req, res) => {
    try {
      const d = await deadlineRepo.findById(req.params.id);
      if (!d || d.user_id !== req.user.id)
        return res.status(404).json({ success: false, message: 'Not found.' });
      await deadlineRepo.delete(req.params.id);
      res.json({ success: true, message: 'Deleted.' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },

  toggleComplete: async (req, res) => {
    try {
      const d = await deadlineRepo.findById(req.params.id);
      if (!d || d.user_id !== req.user.id)
        return res.status(404).json({ success: false, message: 'Not found.' });
      const updated = await deadlineRepo.update(req.params.id, { is_completed: !d.is_completed });
      res.json({ success: true, deadline: updated });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },
};

// ============================================================
// Consultations
// ============================================================
exports.consultation = {
  getHours: async (req, res) => {
    try {
      const hours = await consultationRepo.findWithTeacher();
      res.json({ success: true, consultationHours: hours });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },

  createHours: async (req, res) => {
    try {
      const { day, start_time, end_time, location, notes } = req.body;
      if (!day || !start_time || !end_time)
        return res.status(400).json({ success: false, message: 'Day, start and end time required.' });

      const rows = await db.query(
        `INSERT INTO consultation_hours (teacher_id,day,start_time,end_time,location,notes)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [req.user.id, day, start_time, end_time, location || null, notes || null]
      );
      res.status(201).json({ success: true, consultationHour: rows[0] });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },

  bookAppointment: async (req, res) => {
    try {
      const { consultation_id, appointment_date, start_time, purpose } = req.body;
      if (!consultation_id || !appointment_date || !start_time || !purpose)
        return res.status(400).json({ success: false, message: 'All fields required.' });

      const ch = await consultationRepo.findById(consultation_id);
      if (!ch) return res.status(404).json({ success: false, message: 'Consultation hour not found.' });

      const appt = await consultationRepo.createAppointment({
        consultation_id, student_id: req.user.id, teacher_id: ch.teacher_id,
        appointment_date, start_time, purpose,
      });
      res.status(201).json({ success: true, appointment: appt });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },

  getAppointments: async (req, res) => {
    try {
      const filters = {};
      if (req.user.role === 'student') filters.student_id = req.user.id;
      if (req.user.role === 'teacher') filters.teacher_id = req.user.id;
      const appointments = await consultationRepo.getAppointments(filters);
      res.json({ success: true, appointments });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },

  updateAppointmentStatus: async (req, res) => {
    try {
      const { status, teacher_notes } = req.body;
      const rows = await db.query(
        `SELECT * FROM consultation_appointments WHERE id = $1`, [req.params.id]
      );
      const appt = rows[0];
      if (!appt) return res.status(404).json({ success: false, message: 'Appointment not found.' });
      if (appt.teacher_id !== req.user.id && req.user.role !== 'admin')
        return res.status(403).json({ success: false, message: 'Permission denied.' });

      await consultationRepo.updateAppointmentStatus(req.params.id, status, teacher_notes);
      await notificationService.notifyConsultationUpdate(appt, appt.student_id, status);
      res.json({ success: true, message: 'Status updated.' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },
};

// ============================================================
// Notifications
// ============================================================
exports.notification = {
  getAll: async (req, res) => {
    try {
      const { page = 1 } = req.query;
      const [notifications, unreadCount] = await Promise.all([
        notificationService.getUserNotifications(req.user.id, parseInt(page)),
        notificationService.getUnreadCount(req.user.id),
      ]);
      res.json({ success: true, notifications, unreadCount });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },

  markRead: async (req, res) => {
    try {
      await notificationService.markAsRead(req.params.id, req.user.id);
      res.json({ success: true, message: 'Marked as read.' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },

  markAllRead: async (req, res) => {
    try {
      await notificationService.markAllAsRead(req.user.id);
      res.json({ success: true, message: 'All marked as read.' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },
};

// ============================================================
// Dashboard stats
// ============================================================
exports.dashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('[dashboardStats] Starting for user:', userId);
    
    const [users, anns, ress, groups, upcoming, unread] = await Promise.all([
      db.query(`SELECT COUNT(*)::int AS c FROM users WHERE is_active = TRUE`).then(r => r[0]),
      db.query(`SELECT COUNT(*)::int AS c FROM announcements`).then(r => r[0]),
      db.query(`SELECT COUNT(*)::int AS c FROM resources`).then(r => r[0]),
      db.query(`SELECT COUNT(*)::int AS c FROM study_groups`).then(r => r[0]),
      deadlineRepo.getUpcoming(userId, 7),
      notificationService.getUnreadCount(userId),
    ]);

    console.log('[dashboardStats] Data loaded:', { users, anns, ress, groups, upcoming: upcoming?.length, unread });

    res.json({
      success: true,
      stats: {
        totalUsers:           users?.c || 0,
        totalAnnouncements:   anns?.c || 0,
        totalResources:       ress?.c || 0,
        totalStudyGroups:     groups?.c || 0,
        upcomingDeadlines:    upcoming?.length || 0,
        unreadNotifications:  unread || 0,
      },
      upcomingDeadlines: upcoming || [],
    });
  } catch (err) { 
    console.error('[dashboardStats] Error:', err);
    res.status(500).json({ success: false, message: err.message }); 
  }
};
