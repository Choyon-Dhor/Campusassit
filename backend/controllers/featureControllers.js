// ============================================================
// controllers/featureControllers.js (pg)
// ============================================================
const db = require('../config/database');
const {
  studyGroupRepo, deadlineRepo, consultationRepo, resourceRepo,
} = require('../repositories');
const notificationService  = require('../services/NotificationService');
const recommendationService = require('../services/RecommendationService');

const isOptionalStudyGroupSchemaError = (err) =>
  err && ['42P01', '42703'].includes(err.code);

const getStudyGroupFeatureUnavailableMessage = (err) => {
  const relation = err?.message?.match(/relation "([^"]+)"/i)?.[1] || '';

  if (relation.includes('study_group_messages') || relation.includes('study_group_message')) {
    return 'Study group chat is unavailable until the database update is applied.';
  }

  if (relation.includes('study_group_announcement')) {
    return 'Study group announcements are unavailable until the database update is applied.';
  }

  if (relation.includes('study_group_resource')) {
    return 'Study group resources are unavailable until the database update is applied.';
  }

  if (relation.includes('study_group_activit')) {
    return 'Study group activity is unavailable until the database update is applied.';
  }

  return 'This study group feature is unavailable until the database update is applied.';
};

// ============================================================
// Study Groups
// ============================================================
exports.studyGroup = {
  getAll: async (req, res) => {
    try {
      await studyGroupRepo.touchUserActivity(req.user.id);
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
      await studyGroupRepo.touchUserActivity(req.user.id);
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
      await studyGroupRepo.addActivity(req.params.id, req.user.id, 'member_joined', { user_name: req.user.name });
      await notificationService.notifyStudyGroupInvite(group, req.user.id);
      await studyGroupRepo.touchUserActivity(req.user.id);
      res.json({ success: true, message: 'Joined group successfully.' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },

  leave: async (req, res) => {
    try {
      await studyGroupRepo.leaveGroup(req.params.id, req.user.id);
      await studyGroupRepo.addActivity(req.params.id, req.user.id, 'member_left', { user_name: req.user.name });
      await studyGroupRepo.touchUserActivity(req.user.id);
      res.json({ success: true, message: 'Left group.' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },

  getMembers: async (req, res) => {
    try {
      await studyGroupRepo.touchUserActivity(req.user.id);
      const members = await studyGroupRepo.getMembers(req.params.id);
      res.json({ success: true, members });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },

  getOne: async (req, res) => {
    try {
      const group = await studyGroupRepo.findById(req.params.id, req.user.id);
      if (!group) return res.status(404).json({ success: false, message: 'Group not found.' });
      if (group.is_private && !group.is_member && group.creator_id !== req.user.id)
        return res.status(403).json({ success: false, message: 'This group is private.' });
      await studyGroupRepo.touchUserActivity(req.user.id);
      res.json({ success: true, group });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },

  delete: async (req, res) => {
    try {
      const group = await studyGroupRepo.findById(req.params.id);
      if (!group) return res.status(404).json({ success: false, message: 'Not found.' });
      if (group.creator_id !== req.user.id && req.user.role !== 'admin')
        return res.status(403).json({ success: false, message: 'Permission denied.' });
      await studyGroupRepo.delete(req.params.id);
      await studyGroupRepo.addActivity(req.params.id, req.user.id, 'group_deleted', { group_name: group.name });
      res.json({ success: true, message: 'Group deleted.' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },

  getMessages: async (req, res) => {
    try {
      if (!await studyGroupRepo.isMember(req.params.id, req.user.id))
        return res.status(403).json({ success: false, message: 'Permission denied.' });
      await studyGroupRepo.touchUserActivity(req.user.id);
      await studyGroupRepo.markMessagesRead(req.params.id, req.user.id);
      const messages = await studyGroupRepo.getMessagesDetailed(req.params.id, req.user.id, req.query.q || '');
      const typing = await studyGroupRepo.getTypingUsers(req.params.id, req.user.id);
      res.json({ success: true, messages, typing });
    } catch (err) {
      if (isOptionalStudyGroupSchemaError(err)) {
        return res.json({ success: true, messages: [], typing: [] });
      }
      res.status(500).json({ success: false, message: err.message });
    }
  },

  postMessage: async (req, res) => {
    try {
      const { message, message_type, attachment_url, attachment_name, metadata } = req.body;
      if (!message || !message.trim())
        return res.status(400).json({ success: false, message: 'Message is required.' });
      if (!await studyGroupRepo.isMember(req.params.id, req.user.id))
        return res.status(403).json({ success: false, message: 'Permission denied.' });

      const newMsg = (await studyGroupRepo.addMessage(req.params.id, req.user.id, message.trim(), {
        message_type: message_type || 'text',
        attachment_url: attachment_url || null,
        attachment_name: attachment_name || null,
        metadata: metadata || {},
      }))[0];
      await studyGroupRepo.setTypingStatus(req.params.id, req.user.id, false);
      await studyGroupRepo.touchUserActivity(req.user.id);
      await studyGroupRepo.addActivity(req.params.id, req.user.id, 'message_posted', {
        preview: message.trim().substring(0, 80),
        message_type: message_type || 'text',
      });
      res.status(201).json({ success: true, message: newMsg });
    } catch (err) {
      if (isOptionalStudyGroupSchemaError(err)) {
        return res.status(503).json({
          success: false,
          message: getStudyGroupFeatureUnavailableMessage(err),
        });
      }
      res.status(500).json({ success: false, message: err.message });
    }
  },

  reactToMessage: async (req, res) => {
    try {
      const { reaction } = req.body;
      if (!reaction) return res.status(400).json({ success: false, message: 'Reaction is required.' });
      if (!await studyGroupRepo.isMember(req.params.id, req.user.id))
        return res.status(403).json({ success: false, message: 'Permission denied.' });

      const message = await studyGroupRepo.findMessageById(req.params.messageId);
      if (!message || Number(message.group_id) !== Number(req.params.id))
        return res.status(404).json({ success: false, message: 'Message not found.' });

      const result = await studyGroupRepo.toggleMessageReaction(req.params.messageId, req.user.id, reaction);
      await studyGroupRepo.touchUserActivity(req.user.id);
      const messages = await studyGroupRepo.getMessagesDetailed(req.params.id, req.user.id);
      const updatedMessage = messages.find((item) => Number(item.id) === Number(req.params.messageId));
      res.json({ success: true, removed: result.removed, message: updatedMessage });
    } catch (err) {
      if (isOptionalStudyGroupSchemaError(err)) {
        return res.status(503).json({
          success: false,
          message: getStudyGroupFeatureUnavailableMessage(err),
        });
      }
      res.status(500).json({ success: false, message: err.message });
    }
  },

  markMessagesRead: async (req, res) => {
    try {
      if (!await studyGroupRepo.isMember(req.params.id, req.user.id))
        return res.status(403).json({ success: false, message: 'Permission denied.' });
      await studyGroupRepo.markMessagesRead(req.params.id, req.user.id);
      await studyGroupRepo.touchUserActivity(req.user.id);
      res.json({ success: true });
    } catch (err) {
      if (isOptionalStudyGroupSchemaError(err)) {
        return res.json({ success: true });
      }
      res.status(500).json({ success: false, message: err.message });
    }
  },

  setTypingStatus: async (req, res) => {
    try {
      if (!await studyGroupRepo.isMember(req.params.id, req.user.id))
        return res.status(403).json({ success: false, message: 'Permission denied.' });
      await studyGroupRepo.setTypingStatus(req.params.id, req.user.id, req.body?.is_typing !== false);
      await studyGroupRepo.touchUserActivity(req.user.id);
      const typing = await studyGroupRepo.getTypingUsers(req.params.id, req.user.id);
      res.json({ success: true, typing });
    } catch (err) {
      if (isOptionalStudyGroupSchemaError(err)) {
        return res.json({ success: true, typing: [] });
      }
      res.status(500).json({ success: false, message: err.message });
    }
  },

  getAnnouncements: async (req, res) => {
    try {
      if (!await studyGroupRepo.isMember(req.params.id, req.user.id))
        return res.status(403).json({ success: false, message: 'Permission denied.' });

      await studyGroupRepo.touchUserActivity(req.user.id);
      const announcements = await studyGroupRepo.getAnnouncements(req.params.id);
      const announcementsWithComments = await Promise.all(
        announcements.map(async (announcement) => ({
          ...announcement,
          comments: await studyGroupRepo.getAnnouncementComments(announcement.id),
        }))
      );
      res.json({ success: true, announcements: announcementsWithComments });
    } catch (err) {
      if (isOptionalStudyGroupSchemaError(err)) {
        return res.json({ success: true, announcements: [] });
      }
      res.status(500).json({ success: false, message: err.message });
    }
  },

  commentAnnouncement: async (req, res) => {
    try {
      const { content } = req.body;
      if (!content || !content.trim())
        return res.status(400).json({ success: false, message: 'Comment is required.' });
      if (!await studyGroupRepo.isMember(req.params.id, req.user.id))
        return res.status(403).json({ success: false, message: 'Permission denied.' });

      const announcement = await studyGroupRepo.findAnnouncementById(req.params.announcementId);
      if (!announcement || Number(announcement.group_id) !== Number(req.params.id))
        return res.status(404).json({ success: false, message: 'Announcement not found.' });

      const comment = (await studyGroupRepo.addAnnouncementComment(req.params.announcementId, req.user.id, content.trim()))[0];
      await studyGroupRepo.touchUserActivity(req.user.id);
      await studyGroupRepo.addActivity(req.params.id, req.user.id, 'announcement_commented', {
        title: announcement.title,
      });
      res.status(201).json({ success: true, comment });
    } catch (err) {
      if (isOptionalStudyGroupSchemaError(err)) {
        return res.status(503).json({
          success: false,
          message: getStudyGroupFeatureUnavailableMessage(err),
        });
      }
      res.status(500).json({ success: false, message: err.message });
    }
  },

  getResources: async (req, res) => {
    try {
      if (!await studyGroupRepo.isMember(req.params.id, req.user.id))
        return res.status(403).json({ success: false, message: 'Permission denied.' });

      await studyGroupRepo.touchUserActivity(req.user.id);
      const resources = await studyGroupRepo.getResources(req.params.id);
      res.json({ success: true, resources });
    } catch (err) {
      if (isOptionalStudyGroupSchemaError(err)) {
        return res.json({ success: true, resources: [] });
      }
      res.status(500).json({ success: false, message: err.message });
    }
  },

  postResource: async (req, res) => {
    try {
      if (!await studyGroupRepo.isMember(req.params.id, req.user.id))
        return res.status(403).json({ success: false, message: 'Permission denied.' });

      const { title, description, resource_type, resource_url } = req.body;
      if (!title || !resource_type || (!resource_url && resource_type === 'link'))
        return res.status(400).json({ success: false, message: 'Title, type and URL are required for link resource.' });

      const newResource = (await studyGroupRepo.addResource(req.params.id, req.user.id, {
        title, description, resource_type, resource_url,
      }))[0];

      await studyGroupRepo.addActivity(req.params.id, req.user.id, 'resource_shared', {
        title,
        resource_type,
        resource_url,
      });
      await studyGroupRepo.touchUserActivity(req.user.id);

      res.status(201).json({ success: true, resource: newResource });
    } catch (err) {
      if (isOptionalStudyGroupSchemaError(err)) {
        return res.status(503).json({
          success: false,
          message: getStudyGroupFeatureUnavailableMessage(err),
        });
      }
      res.status(500).json({ success: false, message: err.message });
    }
  },

  postAnnouncement: async (req, res) => {
    try {
      const { title, content, category, is_pinned, content_format } = req.body;
      if (!title || !content)
        return res.status(400).json({ success: false, message: 'Title and content are required.' });
      if (!await studyGroupRepo.isMember(req.params.id, req.user.id))
        return res.status(403).json({ success: false, message: 'Permission denied.' });

      const newAnn = (await studyGroupRepo.addAnnouncement(
        req.params.id,
        req.user.id,
        title.trim(),
        content.trim(),
        {
          category: category || 'update',
          is_pinned: Boolean(is_pinned),
          content_format: content_format || 'markdown',
        }
      ))[0];
      await studyGroupRepo.addActivity(req.params.id, req.user.id, 'announcement_posted', {
        title: title.trim(),
        category: category || 'update',
        is_pinned: Boolean(is_pinned),
      });
      await studyGroupRepo.touchUserActivity(req.user.id);

      const members = await studyGroupRepo.getMembers(req.params.id);
      const notifyIds = members
        .map((member) => Number(member.id))
        .filter((memberId) => memberId !== Number(req.user.id));
      await notificationService.notify('STUDY_GROUP_ANNOUNCEMENT', {
        userIds: notifyIds,
        title: `New Study Group Announcement: ${title.trim()}`,
        message: content.trim().substring(0, 150),
        type: 'studygroup',
        referenceId: newAnn.id,
      });

      res.status(201).json({ success: true, announcement: newAnn });
    } catch (err) {
      if (isOptionalStudyGroupSchemaError(err)) {
        return res.status(503).json({
          success: false,
          message: getStudyGroupFeatureUnavailableMessage(err),
        });
      }
      res.status(500).json({ success: false, message: err.message });
    }
  },

  getActivity: async (req, res) => {
    try {
      if (!await studyGroupRepo.isMember(req.params.id, req.user.id))
        return res.status(403).json({ success: false, message: 'Permission denied.' });
      await studyGroupRepo.touchUserActivity(req.user.id);
      const activities = await studyGroupRepo.getActivity(req.params.id);
      res.json({ success: true, activities });
    } catch (err) {
      if (isOptionalStudyGroupSchemaError(err)) {
        return res.json({ success: true, activities: [] });
      }
      res.status(500).json({ success: false, message: err.message });
    }
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
