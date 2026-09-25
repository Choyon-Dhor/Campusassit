const db = require('../config/database');

async function sendDatabaseNotifications(data) {
  const { userIds, title, message, type, referenceId } = data;
  if (!userIds?.length) return;

  const placeholders = userIds.map((_, i) => {
    const base = i * 5;
    return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`;
  }).join(', ');

  const values = userIds.flatMap((uid) => [uid, title, message, type, referenceId || null]);
  await db.query(
    `INSERT INTO notifications (user_id, title, message, type, reference_id) VALUES ${placeholders}`,
    values
  );
}

class NotificationService {
  async notify(event, data) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Notification] ${event}: ${data.title} -> ${data.userIds?.length || 0} user(s)`);
    }
    await sendDatabaseNotifications(data);
  }

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

  async getUserNotifications(userId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    return db.query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
  }

  async getUnreadCount(userId) {
    const rows = await db.query(
      `SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND is_read = FALSE`,
      [userId]
    );
    return rows[0]?.count || 0;
  }

  async markAsRead(notificationId, userId) {
    return db.query(
      `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2`,
      [notificationId, userId]
    );
  }

  async markAllAsRead(userId) {
    return db.query(`UPDATE notifications SET is_read = TRUE WHERE user_id = $1`, [userId]);
  }
}

module.exports = new NotificationService();
