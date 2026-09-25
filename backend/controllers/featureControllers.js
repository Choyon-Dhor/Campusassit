const db = require('../config/database');
const { studyGroupRepo, deadlineRepo, consultationRepo } = require('../repositories');
const notificationService = require('../services/NotificationService');

const isSchemaError = (err) => err && ['42P01', '42703'].includes(err.code);

const unavailableMsg = (err) => {
  const rel = err?.message?.match(/relation "([^"]+)"/i)?.[1] || '';
  if (rel.includes('message')) return 'Study group chat is unavailable until the database update is applied.';
  if (rel.includes('announcement')) return 'Study group announcements are unavailable until the database update is applied.';
  if (rel.includes('resource')) return 'Study group resources are unavailable until the database update is applied.';
  if (rel.includes('activit')) return 'Study group activity is unavailable until the database update is applied.';
  return 'This study group feature is unavailable until the database update is applied.';
};

exports.studyGroup = {
  getAll: async (req, res, next) => {
    try {
      await studyGroupRepo.touchUserActivity(req.user.id);
      const groups = await studyGroupRepo.findWithDetails(req.user.id);
      res.json({ success: true, groups });
    } catch (err) {
      next(err);
    }
  },

  create: async (req, res, next) => {
    try {
      const { name, description, course_code, course_name, max_members = 10, is_private = false, meeting_schedule } = req.body;
      if (!name) return res.status(400).json({ success: false, message: 'Group name required.' });

      const group = await studyGroupRepo.create({
        name, description, course_code, course_name,
        creator_id: req.user.id, max_members, is_private, meeting_schedule,
      });
      await studyGroupRepo.joinGroup(group.id, req.user.id, 'creator');
      await studyGroupRepo.touchUserActivity(req.user.id);
      res.status(201).json({ success: true, group });
    } catch (err) {
      next(err);
    }
  },

  join: async (req, res, next) => {
    try {
      const group = await studyGroupRepo.findById(req.params.id);
      if (!group) return res.status(404).json({ success: false, message: 'Group not found.' });
      if (await studyGroupRepo.isMember(req.params.id, req.user.id)) {
        return res.status(400).json({ success: false, message: 'Already a member.' });
      }

      const members = await studyGroupRepo.getMembers(req.params.id);
      if (members.length >= group.max_members) {
        return res.status(400).json({ success: false, message: 'Group is full.' });
      }

      await studyGroupRepo.joinGroup(req.params.id, req.user.id);
      await studyGroupRepo.addActivity(req.params.id, req.user.id, 'member_joined', { user_name: req.user.name });
      await notificationService.notifyStudyGroupInvite(group, req.user.id);
      await studyGroupRepo.touchUserActivity(req.user.id);
      res.json({ success: true, message: 'Joined group successfully.' });
    } catch (err) {
      next(err);
    }
  },

  leave: async (req, res, next) => {
    try {
      await studyGroupRepo.leaveGroup(req.params.id, req.user.id);
      await studyGroupRepo.addActivity(req.params.id, req.user.id, 'member_left', { user_name: req.user.name });
      await studyGroupRepo.touchUserActivity(req.user.id);
      res.json({ success: true, message: 'Left group.' });
    } catch (err) {
      next(err);
    }
  },

  getMembers: async (req, res, next) => {
    try {
      await studyGroupRepo.touchUserActivity(req.user.id);
      const members = await studyGroupRepo.getMembers(req.params.id);
      res.json({ success: true, members });
    } catch (err) {
      next(err);
    }
  },

  getOne: async (req, res, next) => {
    try {
      const group = await studyGroupRepo.findById(req.params.id, req.user.id);
      if (!group) return res.status(404).json({ success: false, message: 'Group not found.' });
      if (group.is_private && !group.is_member && group.creator_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'This group is private.' });
      }
      await studyGroupRepo.touchUserActivity(req.user.id);
      res.json({ success: true, group });
    } catch (err) {
      next(err);
    }
  },

  delete: async (req, res, next) => {
    try {
      const group = await studyGroupRepo.findById(req.params.id);
      if (!group) return res.status(404).json({ success: false, message: 'Not found.' });
      if (group.creator_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Permission denied.' });
      }
      await studyGroupRepo.delete(req.params.id);
      await studyGroupRepo.addActivity(req.params.id, req.user.id, 'group_deleted', { group_name: group.name });
      res.json({ success: true, message: 'Group deleted.' });
    } catch (err) {
      next(err);
    }
  },

  getMessages: async (req, res, next) => {
    try {
      if (!(await studyGroupRepo.isMember(req.params.id, req.user.id))) {
        return res.status(403).json({ success: false, message: 'Permission denied.' });
      }
      await studyGroupRepo.touchUserActivity(req.user.id);
      await studyGroupRepo.markMessagesRead(req.params.id, req.user.id);
      const messages = await studyGroupRepo.getMessagesDetailed(req.params.id, req.user.id, req.query.q || '');
      const typing = await studyGroupRepo.getTypingUsers(req.params.id, req.user.id);
      res.json({ success: true, messages, typing });
    } catch (err) {
      if (isSchemaError(err)) return res.json({ success: true, messages: [], typing: [] });
      next(err);
    }
  },

  postMessage: async (req, res, next) => {
    try {
      const { message, message_type = 'text', attachment_url = null, attachment_name = null, metadata = {} } = req.body;
      if (!message?.trim()) return res.status(400).json({ success: false, message: 'Message is required.' });
      if (!(await studyGroupRepo.isMember(req.params.id, req.user.id))) {
        return res.status(403).json({ success: false, message: 'Permission denied.' });
      }

      const rows = await studyGroupRepo.addMessage(req.params.id, req.user.id, message.trim(), {
        message_type, attachment_url, attachment_name, metadata,
      });
      await studyGroupRepo.setTypingStatus(req.params.id, req.user.id, false);
      await studyGroupRepo.touchUserActivity(req.user.id);
      await studyGroupRepo.addActivity(req.params.id, req.user.id, 'message_posted', {
        preview: message.trim().substring(0, 80),
        message_type,
      });
      res.status(201).json({ success: true, message: rows[0] });
    } catch (err) {
      if (isSchemaError(err)) return res.status(503).json({ success: false, message: unavailableMsg(err) });
      next(err);
    }
  },

  reactToMessage: async (req, res, next) => {
    try {
      const { reaction } = req.body;
      if (!reaction) return res.status(400).json({ success: false, message: 'Reaction is required.' });
      if (!(await studyGroupRepo.isMember(req.params.id, req.user.id))) {
        return res.status(403).json({ success: false, message: 'Permission denied.' });
      }

      const msg = await studyGroupRepo.findMessageById(req.params.messageId);
      if (!msg || Number(msg.group_id) !== Number(req.params.id)) {
        return res.status(404).json({ success: false, message: 'Message not found.' });
      }

      const result = await studyGroupRepo.toggleMessageReaction(req.params.messageId, req.user.id, reaction);
      await studyGroupRepo.touchUserActivity(req.user.id);
      const messages = await studyGroupRepo.getMessagesDetailed(req.params.id, req.user.id);
      res.json({
        success: true,
        removed: result.removed,
        message: messages.find((m) => Number(m.id) === Number(req.params.messageId)),
      });
    } catch (err) {
      if (isSchemaError(err)) return res.status(503).json({ success: false, message: unavailableMsg(err) });
      next(err);
    }
  },

  markMessagesRead: async (req, res, next) => {
    try {
      if (!(await studyGroupRepo.isMember(req.params.id, req.user.id))) {
        return res.status(403).json({ success: false, message: 'Permission denied.' });
      }
      await studyGroupRepo.markMessagesRead(req.params.id, req.user.id);
      await studyGroupRepo.touchUserActivity(req.user.id);
      res.json({ success: true });
    } catch (err) {
      if (isSchemaError(err)) return res.json({ success: true });
      next(err);
    }
  },

  setTypingStatus: async (req, res, next) => {
    try {
      if (!(await studyGroupRepo.isMember(req.params.id, req.user.id))) {
        return res.status(403).json({ success: false, message: 'Permission denied.' });
      }
      await studyGroupRepo.setTypingStatus(req.params.id, req.user.id, req.body?.is_typing !== false);
      await studyGroupRepo.touchUserActivity(req.user.id);
      const typing = await studyGroupRepo.getTypingUsers(req.params.id, req.user.id);
      res.json({ success: true, typing });
    } catch (err) {
      if (isSchemaError(err)) return res.json({ success: true, typing: [] });
      next(err);
    }
  },

  getAnnouncements: async (req, res, next) => {
    try {
      if (!(await studyGroupRepo.isMember(req.params.id, req.user.id))) {
        return res.status(403).json({ success: false, message: 'Permission denied.' });
      }

      await studyGroupRepo.touchUserActivity(req.user.id);
      const announcements = await studyGroupRepo.getAnnouncements(req.params.id);
      const withComments = await Promise.all(
        announcements.map(async (a) => ({
          ...a,
          comments: await studyGroupRepo.getAnnouncementComments(a.id),
        }))
      );
      res.json({ success: true, announcements: withComments });
    } catch (err) {
      if (isSchemaError(err)) return res.json({ success: true, announcements: [] });
      next(err);
    }
  },

  commentAnnouncement: async (req, res, next) => {
    try {
      const { content } = req.body;
      if (!content?.trim()) return res.status(400).json({ success: false, message: 'Comment is required.' });
      if (!(await studyGroupRepo.isMember(req.params.id, req.user.id))) {
        return res.status(403).json({ success: false, message: 'Permission denied.' });
      }

      const ann = await studyGroupRepo.findAnnouncementById(req.params.announcementId);
      if (!ann || Number(ann.group_id) !== Number(req.params.id)) {
        return res.status(404).json({ success: false, message: 'Announcement not found.' });
      }

      const comment = (await studyGroupRepo.addAnnouncementComment(req.params.announcementId, req.user.id, content.trim()))[0];
      await studyGroupRepo.touchUserActivity(req.user.id);
      await studyGroupRepo.addActivity(req.params.id, req.user.id, 'announcement_commented', { title: ann.title });
      res.status(201).json({ success: true, comment });
    } catch (err) {
      if (isSchemaError(err)) return res.status(503).json({ success: false, message: unavailableMsg(err) });
      next(err);
    }
  },

  getResources: async (req, res, next) => {
    try {
      if (!(await studyGroupRepo.isMember(req.params.id, req.user.id))) {
        return res.status(403).json({ success: false, message: 'Permission denied.' });
      }
      await studyGroupRepo.touchUserActivity(req.user.id);
      const resources = await studyGroupRepo.getResources(req.params.id);
      res.json({ success: true, resources });
    } catch (err) {
      if (isSchemaError(err)) return res.json({ success: true, resources: [] });
      next(err);
    }
  },

  postResource: async (req, res, next) => {
    try {
      if (!(await studyGroupRepo.isMember(req.params.id, req.user.id))) {
        return res.status(403).json({ success: false, message: 'Permission denied.' });
      }

      const { title, description, resource_type, resource_url } = req.body;
      if (!title || !resource_type || (!resource_url && resource_type === 'link')) {
        return res.status(400).json({ success: false, message: 'Title, type and URL are required for link resource.' });
      }

      const rows = await studyGroupRepo.addResource(req.params.id, req.user.id, {
        title, description, resource_type, resource_url,
      });
      await studyGroupRepo.addActivity(req.params.id, req.user.id, 'resource_shared', { title, resource_type, resource_url });
      await studyGroupRepo.touchUserActivity(req.user.id);
      res.status(201).json({ success: true, resource: rows[0] });
    } catch (err) {
      if (isSchemaError(err)) return res.status(503).json({ success: false, message: unavailableMsg(err) });
      next(err);
    }
  },

  postAnnouncement: async (req, res, next) => {
    try {
      const { title, content, category = 'update', is_pinned = false, content_format = 'markdown' } = req.body;
      if (!title || !content) return res.status(400).json({ success: false, message: 'Title and content are required.' });
      if (!(await studyGroupRepo.isMember(req.params.id, req.user.id))) {
        return res.status(403).json({ success: false, message: 'Permission denied.' });
      }

      const rows = await studyGroupRepo.addAnnouncement(req.params.id, req.user.id, title.trim(), content.trim(), {
        category, is_pinned: Boolean(is_pinned), content_format,
      });
      await studyGroupRepo.addActivity(req.params.id, req.user.id, 'announcement_posted', {
        title: title.trim(), category, is_pinned: Boolean(is_pinned),
      });
      await studyGroupRepo.touchUserActivity(req.user.id);

      const members = await studyGroupRepo.getMembers(req.params.id);
      const notifyIds = members.map((m) => Number(m.id)).filter((id) => id !== Number(req.user.id));
      await notificationService.notify('STUDY_GROUP_ANNOUNCEMENT', {
        userIds: notifyIds,
        title: `New Study Group Announcement: ${title.trim()}`,
        message: content.trim().substring(0, 150),
        type: 'studygroup',
        referenceId: rows[0].id,
      });

      res.status(201).json({ success: true, announcement: rows[0] });
    } catch (err) {
      if (isSchemaError(err)) return res.status(503).json({ success: false, message: unavailableMsg(err) });
      next(err);
    }
  },

  getActivity: async (req, res, next) => {
    try {
      if (!(await studyGroupRepo.isMember(req.params.id, req.user.id))) {
        return res.status(403).json({ success: false, message: 'Permission denied.' });
      }
      await studyGroupRepo.touchUserActivity(req.user.id);
      const activities = await studyGroupRepo.getActivity(req.params.id);
      res.json({ success: true, activities });
    } catch (err) {
      if (isSchemaError(err)) return res.json({ success: true, activities: [] });
      next(err);
    }
  },
};

exports.deadline = {
  getAll: async (req, res, next) => {
    try {
      const { completed, type } = req.query;
      const filters = {};
      if (completed !== undefined) filters.completed = completed === 'true';
      if (type) filters.type = type;
      const deadlines = await deadlineRepo.findByUser(req.user.id, filters);
      res.json({ success: true, deadlines });
    } catch (err) {
      next(err);
    }
  },

  getUpcoming: async (req, res, next) => {
    try {
      const deadlines = await deadlineRepo.getUpcoming(req.user.id, parseInt(req.query.days, 10) || 7);
      res.json({ success: true, deadlines });
    } catch (err) {
      next(err);
    }
  },

  create: async (req, res, next) => {
    try {
      const { title, description, course_code, course_name, deadline_date, type = 'assignment', priority = 'medium' } = req.body;
      if (!title || !deadline_date) {
        return res.status(400).json({ success: false, message: 'Title and deadline date required.' });
      }
      const deadline = await deadlineRepo.create({
        title, description, course_code, course_name, deadline_date, type, priority, user_id: req.user.id,
      });
      res.status(201).json({ success: true, deadline });
    } catch (err) {
      next(err);
    }
  },

  update: async (req, res, next) => {
    try {
      const d = await deadlineRepo.findById(req.params.id);
      if (!d || d.user_id !== req.user.id) return res.status(404).json({ success: false, message: 'Not found.' });
      const updated = await deadlineRepo.update(req.params.id, req.body);
      res.json({ success: true, deadline: updated });
    } catch (err) {
      next(err);
    }
  },

  delete: async (req, res, next) => {
    try {
      const d = await deadlineRepo.findById(req.params.id);
      if (!d || d.user_id !== req.user.id) return res.status(404).json({ success: false, message: 'Not found.' });
      await deadlineRepo.delete(req.params.id);
      res.json({ success: true, message: 'Deleted.' });
    } catch (err) {
      next(err);
    }
  },

  toggleComplete: async (req, res, next) => {
    try {
      const d = await deadlineRepo.findById(req.params.id);
      if (!d || d.user_id !== req.user.id) return res.status(404).json({ success: false, message: 'Not found.' });
      const updated = await deadlineRepo.update(req.params.id, { is_completed: !d.is_completed });
      res.json({ success: true, deadline: updated });
    } catch (err) {
      next(err);
    }
  },
};

exports.consultation = {
  getHours: async (_req, res, next) => {
    try {
      const hours = await consultationRepo.findWithTeacher();
      res.json({ success: true, consultationHours: hours });
    } catch (err) {
      next(err);
    }
  },

  createHours: async (req, res, next) => {
    try {
      const { day, start_time, end_time, location, notes } = req.body;
      if (!day || !start_time || !end_time) {
        return res.status(400).json({ success: false, message: 'Day, start and end time required.' });
      }

      const rows = await db.query(
        `INSERT INTO consultation_hours (teacher_id, day, start_time, end_time, location, notes)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [req.user.id, day, start_time, end_time, location || null, notes || null]
      );
      res.status(201).json({ success: true, consultationHour: rows[0] });
    } catch (err) {
      next(err);
    }
  },

  bookAppointment: async (req, res, next) => {
    try {
      const { consultation_id, appointment_date, start_time, purpose } = req.body;
      if (!consultation_id || !appointment_date || !start_time || !purpose) {
        return res.status(400).json({ success: false, message: 'All fields required.' });
      }

      const ch = await consultationRepo.findById(consultation_id);
      if (!ch) return res.status(404).json({ success: false, message: 'Consultation hour not found.' });

      const appt = await consultationRepo.createAppointment({
        consultation_id, student_id: req.user.id, teacher_id: ch.teacher_id,
        appointment_date, start_time, purpose,
      });
      res.status(201).json({ success: true, appointment: appt });
    } catch (err) {
      next(err);
    }
  },

  getAppointments: async (req, res, next) => {
    try {
      const filters = {};
      if (req.user.role === 'student') filters.student_id = req.user.id;
      if (req.user.role === 'teacher') filters.teacher_id = req.user.id;
      const appointments = await consultationRepo.getAppointments(filters);
      res.json({ success: true, appointments });
    } catch (err) {
      next(err);
    }
  },

  updateAppointmentStatus: async (req, res, next) => {
    try {
      const { status, teacher_notes } = req.body;
      const rows = await db.query(`SELECT * FROM consultation_appointments WHERE id = $1`, [req.params.id]);
      const appt = rows[0];
      if (!appt) return res.status(404).json({ success: false, message: 'Appointment not found.' });
      if (appt.teacher_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Permission denied.' });
      }

      await consultationRepo.updateAppointmentStatus(req.params.id, status, teacher_notes);
      await notificationService.notifyConsultationUpdate(appt, appt.student_id, status);
      res.json({ success: true, message: 'Status updated.' });
    } catch (err) {
      next(err);
    }
  },
};

exports.notification = {
  getAll: async (req, res, next) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const [notifications, unreadCount] = await Promise.all([
        notificationService.getUserNotifications(req.user.id, page),
        notificationService.getUnreadCount(req.user.id),
      ]);
      res.json({ success: true, notifications, unreadCount });
    } catch (err) {
      next(err);
    }
  },

  markRead: async (req, res, next) => {
    try {
      await notificationService.markAsRead(req.params.id, req.user.id);
      res.json({ success: true, message: 'Marked as read.' });
    } catch (err) {
      next(err);
    }
  },

  markAllRead: async (req, res, next) => {
    try {
      await notificationService.markAllAsRead(req.user.id);
      res.json({ success: true, message: 'All marked as read.' });
    } catch (err) {
      next(err);
    }
  },
};

exports.dashboardStats = async (req, res, next) => {
  try {
    const { id: userId } = req.user;
    const [users, anns, ress, groups, upcoming, unread] = await Promise.all([
      db.query(`SELECT COUNT(*)::int AS c FROM users WHERE is_active = TRUE`).then((r) => r[0]),
      db.query(`SELECT COUNT(*)::int AS c FROM announcements`).then((r) => r[0]),
      db.query(`SELECT COUNT(*)::int AS c FROM resources`).then((r) => r[0]),
      db.query(`SELECT COUNT(*)::int AS c FROM study_groups`).then((r) => r[0]),
      deadlineRepo.getUpcoming(userId, 30),
      notificationService.getUnreadCount(userId),
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers: users?.c || 0,
        totalAnnouncements: anns?.c || 0,
        totalResources: ress?.c || 0,
        totalStudyGroups: groups?.c || 0,
        upcomingDeadlines: upcoming?.length || 0,
        unreadNotifications: unread || 0,
      },
      upcomingDeadlines: upcoming || [],
    });
  } catch (err) {
    next(err);
  }
};
