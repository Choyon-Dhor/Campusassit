// ============================================================
// services/NotificationService.js — Observer Pattern (pg)
// ============================================================
const db = require('../config/database');

class NotificationObserver {
  async update(event, data) { throw new Error('update() must be implemented'); }
}

class DatabaseNotificationObserver extends NotificationObserver {
  async update(event, data) {
    try {
      const { userIds, title, message, type, referenceId } = data;
      if (!userIds || userIds.length === 0) return;

      // Build multi-row INSERT with positional params
      const placeholders = userIds.map((_, i) => {
        const base = i * 5;
        return `($${base+1}, $${base+2}, $${base+3}, $${base+4}, $${base+5})`;
      }).join(', ');

      const values = userIds.flatMap(uid =>
        [uid, title, message, type, referenceId || null]
      );

      await db.query(
        `INSERT INTO notifications (user_id, title, message, type, reference_id)
         VALUES ${placeholders}`,
        values
      );
      console.log(`📬 Notifications sent to ${userIds.length} user(s): [${event}] ${title}`);
    } catch (err) {
      console.error('DatabaseNotificationObserver error:', err.message);
    }
  }
}

class ConsoleLogObserver extends NotificationObserver {
  async update(event, data) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔔 [${event}]`, { title: data.title, recipients: data.userIds?.length || 0 });
    }
  }
}

// ── Subject (Publisher) ───────────────────────────────────────
class NotificationService {
  constructor() {
    if (NotificationService.instance) return NotificationService.instance;
    this.observers = [];
    this.subscribe(new DatabaseNotificationObserver());
    this.subscribe(new ConsoleLogObserver());
    NotificationService.instance = this;
  }

  subscribe(observer)   { this.observers.push(observer); }
  unsubscribe(observer) { this.observers = this.observers.filter(o => o !== observer); }

  async notify(event, data) {
    await Promise.allSettled(this.observers.map(o => o.update(event, data)));
  }

  // ── Convenience helpers ───────────────────────────────────
  async notifyNewAnnouncement(announcement, userIds) {
    await this.notify('NEW_ANNOUNCEMENT', {
      userIds,
      title: `📢 New Announcement: ${announcement.title}`,
      message: (announcement.content || '').substring(0, 150) + '…',
      type: 'announcement',
      referenceId: announcement.id,
    });
  }

  async notifyConsultationUpdate(appointment, userId, status) {
    const icon = status === 'approved' ? '✅' : '❌';
    await this.notify('CONSULTATION_UPDATE', {
      userIds: [userId],
      title: `${icon} Consultation Request ${status}`,
      message: `Your consultation appointment has been ${status}.`,
      type: 'consultation',
      referenceId: appointment.id,
    });
  }

  async notifyStudyGroupInvite(group, userId) {
    await this.notify('STUDY_GROUP_JOIN', {
      userIds: [userId],
      title: `👥 Joined: ${group.name}`,
      message: `You have joined the study group "${group.name}".`,
      type: 'studygroup',
      referenceId: group.id,
    });
  }

  // ── CRUD ──────────────────────────────────────────────────
  async getUserNotifications(userId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    return await db.query(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
  }

  async getUnreadCount(userId) {
    const rows = await db.query(
      `SELECT COUNT(*)::int AS count FROM notifications
       WHERE user_id = $1 AND is_read = FALSE`,
      [userId]
    );
    return rows[0]?.count || 0;
  }

  async markAsRead(notificationId, userId) {
    return await db.query(
      `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2`,
      [notificationId, userId]
    );
  }

  async markAllAsRead(userId) {
    return await db.query(
      `UPDATE notifications SET is_read = TRUE WHERE user_id = $1`, [userId]
    );
  }
}

const notificationService = new NotificationService();
module.exports = notificationService;
