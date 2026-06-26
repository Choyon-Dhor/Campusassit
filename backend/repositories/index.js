// ============================================================
// repositories/index.js — All Repository Implementations (pg)
// ============================================================
const BaseRepository = require('./BaseRepository');
const db = require('../config/database');

// Day ordering helper (replaces MySQL's FIELD())
const DAY_ORDER = `CASE day
  WHEN 'Monday'    THEN 1 WHEN 'Tuesday'  THEN 2 WHEN 'Wednesday' THEN 3
  WHEN 'Thursday'  THEN 4 WHEN 'Friday'   THEN 5 WHEN 'Saturday'  THEN 6
  WHEN 'Sunday'    THEN 7 ELSE 8 END`;

// ── User Repository ──────────────────────────────────────────
class UserRepository extends BaseRepository {
  constructor() { super('users'); }

  async findByEmail(email) {
    return await this.db.queryOne(
      `SELECT * FROM users WHERE email = $1`, [email]
    );
  }

  async findActive() {
    return await this.db.query(
      `SELECT id, name, email, role, department, avatar,
              student_number, batch_number, batch_section, created_at
       FROM users WHERE is_active = TRUE ORDER BY name`
    );
  }

  async findAllForAdmin() {
    return await this.db.query(
      `SELECT id, name, email, role, department, avatar, is_active,
              student_number, batch_number, batch_section, created_at
       FROM users
       ORDER BY name`
    );
  }

  async findTeachers() {
    return await this.db.query(
      `SELECT id, name, email, department
       FROM users WHERE role = 'teacher' AND is_active = TRUE ORDER BY name`
    );
  }
}

class PasswordResetTokenRepository extends BaseRepository {
  constructor() { super('password_reset_tokens'); }

  async createForUser(userId, tokenHash, expiresAt) {
    await this.markUserTokensUsed(userId);
    const rows = await this.db.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, tokenHash, expiresAt]
    );
    return rows[0];
  }

  async findValidByHash(tokenHash) {
    return await this.db.queryOne(
      `SELECT prt.*, u.email, u.role, u.is_active
       FROM password_reset_tokens prt
       JOIN users u ON u.id = prt.user_id
       WHERE prt.token_hash = $1
         AND prt.used_at IS NULL
         AND prt.expires_at > NOW()
       LIMIT 1`,
      [tokenHash]
    );
  }

  async markUserTokensUsed(userId) {
    return await this.db.query(
      `UPDATE password_reset_tokens
       SET used_at = NOW()
       WHERE user_id = $1 AND used_at IS NULL`,
      [userId]
    );
  }
}
// ── Announcement Repository ──────────────────────────────────
class AnnouncementRepository extends BaseRepository {
  constructor() { super('announcements'); }

  async findWithAuthor(targetRole = null, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const params = [];
    let sql = `
      SELECT a.*, u.name AS author_name, u.role AS author_role, u.department AS author_dept
      FROM announcements a
      LEFT JOIN users u ON a.author_id = u.id
      WHERE 1=1`;

    if (targetRole && targetRole !== 'admin') {
      params.push(targetRole);
      sql += ` AND (a.target_role = 'all' OR a.target_role = $${params.length})`;
    }

    params.push(limit, offset);
    sql += ` ORDER BY a.is_pinned DESC, a.created_at DESC
             LIMIT $${params.length - 1} OFFSET $${params.length}`;

    return await this.db.query(sql, params);
  }

  async countByRole(role = null) {
    if (!role || role === 'admin') return this.count();
    const rows = await this.db.query(
      `SELECT COUNT(*)::int AS count FROM announcements
       WHERE target_role = 'all' OR target_role = $1`, [role]
    );
    return rows[0]?.count || 0;
  }
}

// ── Resource Repository ──────────────────────────────────────
class ResourceRepository extends BaseRepository {
  constructor() { super('resources'); }

  async findWithUploader(filters = {}, page = 1, limit = 12) {
    const offset = (page - 1) * limit;
    const params = [];
    let sql = `
      SELECT r.*, u.name AS uploader_name, u.department AS uploader_dept
      FROM resources r
      LEFT JOIN users u ON r.uploader_id = u.id
      WHERE 1=1`;

    if (filters.file_type) { params.push(filters.file_type); sql += ` AND r.file_type = $${params.length}`; }
    if (filters.department) { params.push(filters.department); sql += ` AND r.department = $${params.length}`; }
    if (filters.course_code) { params.push(filters.course_code); sql += ` AND r.course_code = $${params.length}`; }
    if (filters.search) {
      const s = `%${filters.search}%`;
      params.push(s, s, s);
      const i = params.length;
      sql += ` AND (r.title ILIKE $${i-2} OR r.course_name ILIKE $${i-1} OR r.course_code ILIKE $${i})`;
    }

    const orderMap = {
      newest:      'r.created_at DESC',
      rating:      'r.average_rating DESC',
      downloads:   'r.download_count DESC',
      recommended: 'r.recommendation_score DESC',
    };
    sql += ` ORDER BY ${orderMap[filters.sort] || orderMap.recommended}`;
    params.push(limit, offset);
    sql += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

    return await this.db.query(sql, params);
  }

  async incrementDownload(id) {
    return await this.db.query(
      `UPDATE resources SET download_count = download_count + 1 WHERE id = $1`, [id]
    );
  }

  async updateAverageRating(id) {
    const rows = await this.db.query(
      `SELECT COALESCE(AVG(rating), 0)::numeric(3,2) AS avg
       FROM resource_ratings WHERE resource_id = $1`, [id]
    );
    const avg = parseFloat(rows[0]?.avg || 0);
    await this.db.query(
      `UPDATE resources SET average_rating = $1 WHERE id = $2`, [avg, id]
    );
    return avg;
  }

  async getUserRating(resourceId, userId) {
    return await this.db.queryOne(
      `SELECT * FROM resource_ratings WHERE resource_id = $1 AND user_id = $2`,
      [resourceId, userId]
    );
  }

  async upsertRating(resourceId, userId, rating) {
    await this.db.query(
      `INSERT INTO resource_ratings (resource_id, user_id, rating)
       VALUES ($1, $2, $3)
       ON CONFLICT ON CONSTRAINT unique_rating
       DO UPDATE SET rating = EXCLUDED.rating`,
      [resourceId, userId, rating]
    );
    return this.updateAverageRating(resourceId);
  }
}

// ── Study Group Repository ───────────────────────────────────
class StudyGroupRepository extends BaseRepository {
  constructor() {
    super('study_groups');
    this.usersLastActiveColumn = null;
  }

  async hasUsersLastActiveColumn() {
    if (this.usersLastActiveColumn !== null) {
      return this.usersLastActiveColumn;
    }

    const result = await this.db.queryOne(
      `SELECT EXISTS (
         SELECT 1
         FROM information_schema.columns
         WHERE table_name = 'users' AND column_name = 'last_active_at'
       ) AS exists`
    );

    this.usersLastActiveColumn = Boolean(result?.exists);
    return this.usersLastActiveColumn;
  }

  async findWithDetails(userId = null) {
    const uid = userId || 0;
    return await this.db.query(
      `SELECT sg.*,
              u.name AS creator_name,
              COUNT(DISTINCT sgm.user_id)::int AS member_count,
              MAX(CASE WHEN sgm2.user_id = $1 THEN 1 ELSE 0 END)::int AS is_member
       FROM study_groups sg
       LEFT JOIN users u ON sg.creator_id = u.id
       LEFT JOIN study_group_members sgm  ON sg.id = sgm.group_id
       LEFT JOIN study_group_members sgm2 ON sg.id = sgm2.group_id AND sgm2.user_id = $2
       GROUP BY sg.id, u.name
       ORDER BY sg.created_at DESC`,
      [uid, uid]
    );
  }

  async getMembers(groupId) {
    const hasLastActiveColumn = await this.hasUsersLastActiveColumn();
    const lastActiveSelect = hasLastActiveColumn
      ? `u.last_active_at,
              CASE
                WHEN u.last_active_at IS NOT NULL AND u.last_active_at >= NOW() - INTERVAL '2 minutes'
                THEN TRUE
                ELSE FALSE
              END AS is_online,`
      : `NULL::timestamptz AS last_active_at,
              FALSE AS is_online,`;

    return await this.db.query(
      `SELECT u.id, u.name, u.email, u.department, u.avatar,
              ${lastActiveSelect}
              sgm.role, sgm.joined_at
       FROM study_group_members sgm
       LEFT JOIN users u ON sgm.user_id = u.id
       WHERE sgm.group_id = $1
       ORDER BY CASE sgm.role WHEN 'creator' THEN 0 ELSE 1 END, sgm.joined_at`,
      [groupId]
    );
  }

  async findById(groupId, userId = 0) {
    return await this.db.queryOne(
      `SELECT sg.*, u.name AS creator_name,
              COUNT(DISTINCT sgm.user_id)::int AS member_count,
              MAX(CASE WHEN sgm2.user_id = $2 THEN 1 ELSE 0 END)::int AS is_member
       FROM study_groups sg
       LEFT JOIN users u ON sg.creator_id = u.id
       LEFT JOIN study_group_members sgm ON sg.id = sgm.group_id
       LEFT JOIN study_group_members sgm2 ON sg.id = sgm2.group_id AND sgm2.user_id = $2
       WHERE sg.id = $1
       GROUP BY sg.id, u.name`,
      [groupId, userId]
    );
  }

  async isMember(groupId, userId) {
    const rows = await this.db.query(
      `SELECT id FROM study_group_members WHERE group_id = $1 AND user_id = $2`,
      [groupId, userId]
    );
    return rows.length > 0;
  }

  async joinGroup(groupId, userId, role = 'member') {
    return await this.db.query(
      `INSERT INTO study_group_members (group_id, user_id, role)
       VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
      [groupId, userId, role]
    );
  }

  async leaveGroup(groupId, userId) {
    return await this.db.query(
      `DELETE FROM study_group_members WHERE group_id = $1 AND user_id = $2`,
      [groupId, userId]
    );
  }

  async getMessages(groupId) {
    return await this.getMessagesDetailed(groupId);
  }

  async getMessagesDetailed(groupId, userId = 0, search = '') {
    const hasLastActiveColumn = await this.hasUsersLastActiveColumn();
    const params = [groupId, userId || 0];
    let searchSql = '';
    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      searchSql = ` AND (gm.message ILIKE $${params.length} OR u.name ILIKE $${params.length})`;
    }

    return await this.db.query(
      `SELECT gm.*, u.name AS user_name, u.avatar,
              ${hasLastActiveColumn ? 'u.last_active_at' : 'NULL::timestamptz AS last_active_at'},
              COALESCE(reactions.reactions, '[]'::json) AS reactions,
              COALESCE(reads.read_count, 0) AS read_count,
              COALESCE(readers.readers, '[]'::json) AS readers
       FROM study_group_messages gm
       JOIN users u ON u.id = gm.user_id
       LEFT JOIN LATERAL (
         SELECT json_agg(
                  json_build_object(
                    'reaction', reaction,
                    'count', reaction_count,
                    'reacted_by_me', reacted_by_me
                  )
                  ORDER BY reaction
                ) AS reactions
         FROM (
           SELECT r.reaction,
                  COUNT(*)::int AS reaction_count,
                  MAX(CASE WHEN r.user_id = $2 THEN 1 ELSE 0 END)::int = 1 AS reacted_by_me
           FROM study_group_message_reactions r
           WHERE r.message_id = gm.id
           GROUP BY r.reaction
         ) grouped_reactions
       ) reactions ON TRUE
       LEFT JOIN LATERAL (
         SELECT COUNT(*)::int AS read_count
         FROM study_group_message_reads rr
         WHERE rr.message_id = gm.id
       ) reads ON TRUE
       LEFT JOIN LATERAL (
         SELECT json_agg(
                  json_build_object(
                    'user_id', rr.user_id,
                    'user_name', read_user.name,
                    'read_at', rr.read_at
                  )
                  ORDER BY rr.read_at DESC
                ) AS readers
         FROM study_group_message_reads rr
         JOIN users read_user ON read_user.id = rr.user_id
         WHERE rr.message_id = gm.id
       ) readers ON TRUE
       WHERE gm.group_id = $1${searchSql}
       ORDER BY gm.created_at ASC`,
      params
    );
  }

  async addMessage(groupId, userId, message, options = {}) {
    const {
      message_type = 'text',
      attachment_name = null,
      attachment_url = null,
      metadata = {},
    } = options;
    return await this.db.query(
      `INSERT INTO study_group_messages (group_id, user_id, message, message_type, attachment_name, attachment_url, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb) RETURNING *`,
      [groupId, userId, message, message_type, attachment_name, attachment_url, JSON.stringify(metadata || {})]
    );
  }

  async getAnnouncements(groupId) {
    return await this.db.query(
      `SELECT sa.*, u.name AS user_name,
              COALESCE(comment_stats.comment_count, 0) AS comment_count
       FROM study_group_announcements sa
       JOIN users u ON u.id = sa.user_id
       LEFT JOIN LATERAL (
         SELECT COUNT(*)::int AS comment_count
         FROM study_group_announcement_comments sac
         WHERE sac.announcement_id = sa.id
       ) comment_stats ON TRUE
       WHERE sa.group_id = $1
       ORDER BY sa.is_pinned DESC, sa.created_at DESC`,
      [groupId]
    );
  }

  async addAnnouncement(groupId, userId, title, content, options = {}) {
    const {
      category = 'update',
      is_pinned = false,
      content_format = 'markdown',
    } = options;
    if (is_pinned) {
      await this.db.query(
        `UPDATE study_group_announcements SET is_pinned = FALSE, updated_at = NOW() WHERE group_id = $1`,
        [groupId]
      );
    }
    return await this.db.query(
      `INSERT INTO study_group_announcements (group_id, user_id, title, content, category, is_pinned, content_format)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [groupId, userId, title, content, category, is_pinned, content_format]
    );
  }

  async getAnnouncementComments(announcementId) {
    return await this.db.query(
      `SELECT sac.*, u.name AS user_name, u.avatar
       FROM study_group_announcement_comments sac
       JOIN users u ON u.id = sac.user_id
       WHERE sac.announcement_id = $1
       ORDER BY sac.created_at ASC`,
      [announcementId]
    );
  }

  async addAnnouncementComment(announcementId, userId, content) {
    return await this.db.query(
      `INSERT INTO study_group_announcement_comments (announcement_id, user_id, content)
       VALUES ($1, $2, $3) RETURNING *`,
      [announcementId, userId, content]
    );
  }

  async findAnnouncementById(announcementId) {
    return await this.db.queryOne(
      `SELECT * FROM study_group_announcements WHERE id = $1`,
      [announcementId]
    );
  }

  async getResources(groupId) {
    return await this.db.query(
      `SELECT sgr.*, u.name AS user_name
       FROM study_group_resources sgr
       JOIN users u ON u.id = sgr.user_id
       WHERE sgr.group_id = $1
       ORDER BY sgr.created_at DESC`,
      [groupId]
    );
  }

  async addResource(groupId, userId, resource) {
    const { title, description, resource_type = 'link', resource_url, file_path } = resource;
    return await this.db.query(
      `INSERT INTO study_group_resources (group_id, user_id, title, description, resource_type, resource_url, file_path)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [groupId, userId, title, description || null, resource_type, resource_url || null, file_path || null]
    );
  }

  async getActivity(groupId, limit = 50) {
    return await this.db.query(
      `SELECT ga.*, u.name AS user_name
       FROM study_group_activities ga
       LEFT JOIN users u ON u.id = ga.user_id
       WHERE ga.group_id = $1
       ORDER BY ga.created_at DESC
       LIMIT $2`,
      [groupId, limit]
    );
  }

  async addActivity(groupId, userId, action, payload = {}) {
    return await this.db.query(
      `INSERT INTO study_group_activities (group_id, user_id, action, payload)
       VALUES ($1, $2, $3, $4::jsonb) RETURNING *`,
      [groupId, userId, action, JSON.stringify(payload || {})]
    );
  }

  async touchUserActivity(userId) {
    if (!await this.hasUsersLastActiveColumn()) {
      return await this.db.query(
        `UPDATE users SET updated_at = NOW() WHERE id = $1`,
        [userId]
      );
    }

    return await this.db.query(
      `UPDATE users SET last_active_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [userId]
    );
  }

  async markMessagesRead(groupId, userId) {
    return await this.db.query(
      `INSERT INTO study_group_message_reads (message_id, user_id, read_at)
       SELECT gm.id, $2, NOW()
       FROM study_group_messages gm
       WHERE gm.group_id = $1
         AND gm.user_id <> $2
       ON CONFLICT (message_id, user_id)
       DO UPDATE SET read_at = EXCLUDED.read_at`,
      [groupId, userId]
    );
  }

  async toggleMessageReaction(messageId, userId, reaction) {
    const existing = await this.db.queryOne(
      `SELECT id FROM study_group_message_reactions
       WHERE message_id = $1 AND user_id = $2 AND reaction = $3`,
      [messageId, userId, reaction]
    );

    if (existing) {
      await this.db.query(
        `DELETE FROM study_group_message_reactions WHERE id = $1`,
        [existing.id]
      );
      return { removed: true };
    }

    await this.db.query(
      `INSERT INTO study_group_message_reactions (message_id, user_id, reaction)
       VALUES ($1, $2, $3)`,
      [messageId, userId, reaction]
    );
    return { removed: false };
  }

  async findMessageById(messageId) {
    return await this.db.queryOne(
      `SELECT * FROM study_group_messages WHERE id = $1`,
      [messageId]
    );
  }

  async setTypingStatus(groupId, userId, isTyping = true) {
    return await this.db.query(
      `INSERT INTO study_group_typing_status (group_id, user_id, is_typing, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (group_id, user_id)
       DO UPDATE SET is_typing = EXCLUDED.is_typing, updated_at = NOW()`,
      [groupId, userId, isTyping]
    );
  }

  async getTypingUsers(groupId, excludeUserId = 0) {
    return await this.db.query(
      `SELECT ts.user_id, u.name AS user_name, ts.updated_at
       FROM study_group_typing_status ts
       JOIN users u ON u.id = ts.user_id
       WHERE ts.group_id = $1
         AND ts.user_id <> $2
         AND ts.is_typing = TRUE
         AND ts.updated_at >= NOW() - INTERVAL '8 seconds'
       ORDER BY ts.updated_at DESC`,
      [groupId, excludeUserId]
    );
  }
}


// ── Deadline Repository ──────────────────────────────────────
class DeadlineRepository extends BaseRepository {
  constructor() { super('deadlines'); }

  async findByUser(userId, filters = {}) {
    const params = [userId];
    let sql = `SELECT * FROM deadlines WHERE user_id = $1`;
    if (filters.completed !== undefined) {
      params.push(filters.completed);
      sql += ` AND is_completed = $${params.length}`;
    }
    if (filters.type) {
      params.push(filters.type);
      sql += ` AND type = $${params.length}`;
    }
    sql += ` ORDER BY deadline_date ASC`;
    return await this.db.query(sql, params);
  }

  async getUpcoming(userId, days = 7) {
    return await this.db.query(
      `SELECT * FROM deadlines
       WHERE user_id = $1
         AND is_completed = FALSE
         AND deadline_date BETWEEN NOW() AND NOW() + ($2 * INTERVAL '1 day')
       ORDER BY deadline_date ASC`,
      [userId, days]
    );
  }
}

// ── Consultation Repository ──────────────────────────────────
class ConsultationRepository extends BaseRepository {
  constructor() { super('consultation_hours'); }

  async findWithTeacher() {
    return await this.db.query(
      `SELECT ch.*, u.name AS teacher_name, u.email AS teacher_email, u.department
       FROM consultation_hours ch
       LEFT JOIN users u ON ch.teacher_id = u.id
       WHERE ch.is_active = TRUE
       ORDER BY ${DAY_ORDER.replace(/day/g,'ch.day')}, ch.start_time`
    );
  }

  async getAppointments(filters = {}) {
    const params = [];
    let sql = `
      SELECT ca.*,
             s.name AS student_name, s.email AS student_email,
             t.name AS teacher_name, t.email AS teacher_email, t.department
      FROM consultation_appointments ca
      LEFT JOIN users s ON ca.student_id = s.id
      LEFT JOIN users t ON ca.teacher_id = t.id
      WHERE 1=1`;

    if (filters.student_id) { params.push(filters.student_id); sql += ` AND ca.student_id = $${params.length}`; }
    if (filters.teacher_id) { params.push(filters.teacher_id); sql += ` AND ca.teacher_id = $${params.length}`; }
    if (filters.status)     { params.push(filters.status);     sql += ` AND ca.status = $${params.length}`; }

    sql += ` ORDER BY ca.appointment_date ASC, ca.start_time ASC`;
    return await this.db.query(sql, params);
  }

  async createAppointment(data) {
    const keys = Object.keys(data);
    const vals = Object.values(data);
    const cols = keys.join(', ');
    const phs  = keys.map((_, i) => `$${i + 1}`).join(', ');
    const rows = await this.db.query(
      `INSERT INTO consultation_appointments (${cols}) VALUES (${phs}) RETURNING *`,
      vals
    );
    const appt = rows[0];
    // Enrich with names
    const enriched = await this.db.queryOne(
      `SELECT ca.*,
              s.name AS student_name,
              t.name AS teacher_name
       FROM consultation_appointments ca
       LEFT JOIN users s ON ca.student_id = s.id
       LEFT JOIN users t ON ca.teacher_id = t.id
       WHERE ca.id = $1`,
      [appt.id]
    );
    return enriched;
  }

  async updateAppointmentStatus(id, status, teacherNotes = null) {
    return await this.db.query(
      `UPDATE consultation_appointments
       SET status = $1, teacher_notes = $2, updated_at = NOW()
       WHERE id = $3`,
      [status, teacherNotes, id]
    );
  }
}

module.exports = {
  userRepo:         new UserRepository(),
  passwordResetTokenRepo: new PasswordResetTokenRepository(),
  announcementRepo: new AnnouncementRepository(),
  resourceRepo:     new ResourceRepository(),
  studyGroupRepo:   new StudyGroupRepository(),
  deadlineRepo:     new DeadlineRepository(),
  consultationRepo: new ConsultationRepository(),
};

