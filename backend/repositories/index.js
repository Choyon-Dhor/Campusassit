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
      `SELECT id, name, email, role, department, avatar, created_at
       FROM users WHERE is_active = TRUE ORDER BY name`
    );
  }

  async findTeachers() {
    return await this.db.query(
      `SELECT id, name, email, department
       FROM users WHERE role = 'teacher' AND is_active = TRUE ORDER BY name`
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
  constructor() { super('study_groups'); }

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
    return await this.db.query(
      `SELECT u.id, u.name, u.email, u.department, u.avatar,
              sgm.role, sgm.joined_at
       FROM study_group_members sgm
       LEFT JOIN users u ON sgm.user_id = u.id
       WHERE sgm.group_id = $1
       ORDER BY CASE sgm.role WHEN 'creator' THEN 0 ELSE 1 END, sgm.joined_at`,
      [groupId]
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
  announcementRepo: new AnnouncementRepository(),
  resourceRepo:     new ResourceRepository(),
  studyGroupRepo:   new StudyGroupRepository(),
  deadlineRepo:     new DeadlineRepository(),
  consultationRepo: new ConsultationRepository(),
};
