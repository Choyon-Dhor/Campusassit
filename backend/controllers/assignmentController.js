// ============================================================
// controllers/assignmentController.js
// ============================================================
const fs = require('fs');
const path = require('path');

const db = require('../config/database');
const notificationService = require('../services/NotificationService');

const ASSIGNMENT_UPLOAD_DIR = path.join(__dirname, '../uploads/assignments');

const normalizeAttachmentEntry = (value) => {
  if (!value) return null;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || null;
  }

  if (typeof value === 'object') {
    const filePath = [value.file_path, value.path, value.filename]
      .find((entry) => typeof entry === 'string' && entry.trim());

    if (!filePath) return null;
    return { ...value, file_path: filePath };
  }

  return null;
};

const normalizeAttachments = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map(normalizeAttachmentEntry)
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map(normalizeAttachmentEntry)
          .filter(Boolean);
      }

      const normalizedObject = normalizeAttachmentEntry(parsed);
      if (normalizedObject) return [normalizedObject];
    } catch (_) {
      // Plain string attachment path.
    }

    return [trimmed];
  }

  if (typeof value === 'object') {
    const normalizedObject = normalizeAttachmentEntry(value);
    return normalizedObject ? [normalizedObject] : [];
  }
  return [];
};

const getPrimaryAttachmentPath = (attachments) => {
  const list = normalizeAttachments(attachments);
  if (!list.length) return null;

  const first = list[0];
  if (typeof first === 'string') return first;

  return first.file_path || first.path || first.filename || null;
};

const withAttachmentMetadata = (record) => {
  if (!record) return null;

  const attachments = normalizeAttachments(record.attachments);
  const file_path = getPrimaryAttachmentPath(attachments);

  return {
    ...record,
    attachments,
    file_path,
  };
};

const parsePoints = (value, fallback = 100) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const serializeAttachmentsForDb = (value) => JSON.stringify(normalizeAttachments(value));

const formatDueDateLabel = (value) => {
  if (!value) return 'No due date';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'No due date';

  return parsed.toLocaleString();
};

const getDeadlinePriority = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'medium';

  const diffMs = parsed.getTime() - Date.now();
  if (diffMs <= 3 * 24 * 60 * 60 * 1000) return 'high';
  if (diffMs <= 7 * 24 * 60 * 60 * 1000) return 'medium';
  return 'low';
};

const buildAssignmentSummary = ({ classroom, description, dueDate, points }) => {
  const courseLabel = classroom.course_name
    ? `${classroom.course_code} - ${classroom.course_name}`
    : classroom.course_code;

  const parts = [
    `A new assignment has been posted for ${courseLabel}.`,
    `Due ${formatDueDateLabel(dueDate)}.`,
    `${points} points.`,
  ];

  if (description && description.trim()) {
    parts.push(description.trim());
  }

  return parts.join(' ');
};

const buildAssignmentAnnouncementTitle = (title, mode = 'created') => (
  mode === 'updated' ? `Updated Assignment: ${title}` : `New Assignment: ${title}`
);

const deleteRowsByIds = async (tableName, ids) => {
  if (!ids.length) return;

  const placeholders = ids.map((_, index) => `$${index + 1}`).join(', ');
  await db.query(`DELETE FROM ${tableName} WHERE id IN (${placeholders})`, ids);
};

const getClassroomStudentIds = async (classroomId) => {
  const students = await db.query(
    'SELECT student_id FROM classroom_students WHERE classroom_id = $1',
    [classroomId]
  );

  return students.map((student) => Number(student.student_id));
};

const findExistingAssignmentMark = async ({
  assignmentId,
  classroomId,
  studentId,
  submissionId,
  title,
  totalMarks,
}) => {
  const bySubmission = await db.queryOne(
    'SELECT id FROM classroom_marks WHERE submission_id = $1',
    [submissionId]
  );
  if (bySubmission) return bySubmission;

  const byAssignment = await db.queryOne(
    'SELECT id FROM classroom_marks WHERE assignment_id = $1 AND student_id = $2',
    [assignmentId, studentId]
  );
  if (byAssignment) return byAssignment;

  return db.queryOne(
    `SELECT id
     FROM classroom_marks
     WHERE source = 'manual'
       AND classroom_id = $1
       AND student_id = $2
       AND title = $3
       AND total_marks = $4
     ORDER BY updated_at DESC, created_at DESC
     LIMIT 1`,
    [classroomId, studentId, title, totalMarks]
  );
};

const syncAssignmentMark = async ({
  assignmentId,
  classroomId,
  studentId,
  submissionId,
  title,
  grade,
  totalMarks,
  feedback,
  gradedAt,
}) => {
  const markDate = gradedAt
    ? new Date(gradedAt).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  const existingMark = await findExistingAssignmentMark({
    assignmentId,
    classroomId,
    studentId,
    submissionId,
    title,
    totalMarks,
  });

  if (existingMark) {
    const rows = await db.query(
      `UPDATE classroom_marks SET
         classroom_id = $1,
         student_id = $2,
         assignment_id = $3,
         submission_id = $4,
         source = 'assignment',
         title = $5,
         marks_obtained = $6,
         total_marks = $7,
         feedback = $8,
         date = $9,
         updated_at = NOW()
       WHERE id = $10
       RETURNING *`,
      [
        classroomId,
        studentId,
        assignmentId,
        submissionId,
        title,
        grade,
        totalMarks,
        feedback || '',
        markDate,
        existingMark.id,
      ]
    );
    return rows[0];
  }

  const rows = await db.query(
    `INSERT INTO classroom_marks (
       classroom_id,
       student_id,
       assignment_id,
       submission_id,
       source,
       title,
       marks_obtained,
       total_marks,
       feedback,
       date
     )
     VALUES ($1, $2, $3, $4, 'assignment', $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      classroomId,
      studentId,
      assignmentId,
      submissionId,
      title,
      grade,
      totalMarks,
      feedback || '',
      markDate,
    ]
  );
  return rows[0];
};

const syncAssignmentMarksForUpdatedAssignment = async (assignment) => {
  await db.query(
    `UPDATE classroom_marks SET
       title = $1,
       total_marks = $2,
       updated_at = NOW()
     WHERE assignment_id = $3`,
    [assignment.title, assignment.points, assignment.id]
  );
};

const upsertAssignmentAnnouncement = async ({
  assignmentId,
  classroomId,
  title,
  content,
  authorId,
  legacyTitles = [],
}) => {
  const existingAnnouncement = await db.queryOne(
    'SELECT id FROM classroom_announcements WHERE assignment_id = $1',
    [assignmentId]
  );

  let targetAnnouncementId = existingAnnouncement?.id || null;

  if (!targetAnnouncementId && legacyTitles.length) {
    const legacyAnnouncement = await db.queryOne(
      `SELECT id
       FROM classroom_announcements
       WHERE assignment_id IS NULL
         AND classroom_id = $1
         AND title = ANY($2::text[])
       ORDER BY created_at DESC
       LIMIT 1`,
      [classroomId, legacyTitles]
    );
    targetAnnouncementId = legacyAnnouncement?.id || null;
  }

  if (targetAnnouncementId) {
    await db.query(
      `UPDATE classroom_announcements SET
         classroom_id = $1,
         title = $2,
         content = $3,
         assignment_id = $4,
         updated_at = NOW()
       WHERE id = $5`,
      [classroomId, title, content, assignmentId, targetAnnouncementId]
    );
    return;
  }

  await db.query(
    `INSERT INTO classroom_announcements (classroom_id, title, content, assignment_id, author_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [classroomId, title, content, assignmentId, authorId]
  );
};

const syncAssignmentDeadlines = async ({
  assignmentId,
  studentIds,
  title,
  description,
  classroom,
  dueDate,
  priority,
  legacyTitles = [],
}) => {
  if (!studentIds.length || !dueDate) {
    await db.query('DELETE FROM deadlines WHERE assignment_id = $1', [assignmentId]);
    return;
  }

  if (legacyTitles.length) {
    await db.query(
      `UPDATE deadlines SET
         assignment_id = $1,
         updated_at = NOW()
       WHERE assignment_id IS NULL
         AND type = 'assignment'
         AND course_code = $2
         AND title = ANY($3::text[])
         AND user_id = ANY($4::int[])`,
      [assignmentId, classroom.course_code, legacyTitles, studentIds]
    );
  }

  const existingDeadlines = await db.query(
    'SELECT id, user_id FROM deadlines WHERE assignment_id = $1',
    [assignmentId]
  );
  const desiredStudentIds = new Set(studentIds.map(Number));
  const staleDeadlineIds = existingDeadlines
    .filter((deadline) => !desiredStudentIds.has(Number(deadline.user_id)))
    .map((deadline) => deadline.id);

  await deleteRowsByIds('deadlines', staleDeadlineIds);

  await db.query(
    `UPDATE deadlines SET
       title = $1,
       description = $2,
       course_code = $3,
       course_name = $4,
       deadline_date = $5,
       type = 'assignment',
       priority = $6,
       updated_at = NOW()
     WHERE assignment_id = $7`,
    [title, description, classroom.course_code, classroom.course_name, dueDate, priority, assignmentId]
  );

  const existingStudentIds = new Set(
    existingDeadlines
      .filter((deadline) => desiredStudentIds.has(Number(deadline.user_id)))
      .map((deadline) => Number(deadline.user_id))
  );
  const missingStudentIds = studentIds.filter((studentId) => !existingStudentIds.has(Number(studentId)));
  if (!missingStudentIds.length) return;

  const placeholders = [];
  const params = [];

  missingStudentIds.forEach((studentId, index) => {
    const base = index * 8;
    placeholders.push(
      `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8})`
    );
    params.push(
      title,
      description,
      classroom.course_code,
      classroom.course_name,
      dueDate,
      assignmentId,
      priority,
      Number(studentId)
    );
  });

  await db.query(
    `INSERT INTO deadlines (title, description, course_code, course_name, deadline_date, assignment_id, priority, user_id)
     VALUES ${placeholders.join(', ')}`,
    params
  );
};

const canAccessClassroom = async (classroomId, user) => {
  if (user.role === 'admin') return true;

  const classroom = await db.queryOne(
    'SELECT teacher_id FROM classrooms WHERE id = $1',
    [classroomId]
  );

  if (!classroom) return false;
  if (classroom.teacher_id === user.id) return true;
  if (user.role !== 'student') return false;

  const enrollment = await db.queryOne(
    'SELECT 1 FROM classroom_students WHERE classroom_id = $1 AND student_id = $2',
    [classroomId, user.id]
  );

  return !!enrollment;
};

exports.createAssignment = async (req, res) => {
  try {
    const { classroom_id, title, description, due_date, points, attachments } = req.body;

    if (!classroom_id || !title) {
      return res.status(400).json({ success: false, message: 'classroom_id and title required.' });
    }

    const classroom = await db.queryOne('SELECT * FROM classrooms WHERE id = $1', [classroom_id]);
    if (!classroom) return res.status(404).json({ success: false, message: 'Classroom not found.' });

    if (classroom.teacher_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only classroom teacher or admin can create assignments.' });
    }

    const normalizedPoints = parsePoints(points, 100);
    const storedAttachments = req.file
      ? [req.file.filename]
      : normalizeAttachments(attachments);

    const rows = await db.query(
      `INSERT INTO assignments (classroom_id, teacher_id, title, description, due_date, points, attachments)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        classroom_id,
        req.user.id,
        title,
        description || '',
        due_date || null,
        normalizedPoints,
        serializeAttachmentsForDb(storedAttachments),
      ]
    );

    const assignment = withAttachmentMetadata(rows[0]);

    const studentIds = await getClassroomStudentIds(classroom_id);
    const announcementTitle = buildAssignmentAnnouncementTitle(title, 'created');
    const announcementContent = buildAssignmentSummary({
      classroom,
      description,
      dueDate: due_date,
      points: normalizedPoints,
    });

    await upsertAssignmentAnnouncement({
      assignmentId: assignment.id,
      classroomId: classroom_id,
      title: announcementTitle,
      content: announcementContent,
      authorId: req.user.id,
      legacyTitles: [announcementTitle],
    });

    await syncAssignmentDeadlines({
      assignmentId: assignment.id,
      studentIds,
      title,
      description: announcementContent,
      classroom,
      dueDate: due_date,
      priority: getDeadlinePriority(due_date),
      legacyTitles: [title],
    });

    if (studentIds.length) {
      await notificationService.notify('ASSIGNMENT_CREATED', {
        userIds: studentIds,
        title: `New Assignment: ${title}`,
        message: announcementContent,
        type: 'deadline',
        referenceId: assignment.id,
      });
    }

    res.status(201).json({ success: true, assignment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, due_date, points, attachments } = req.body;

    const assignment = await db.queryOne('SELECT * FROM assignments WHERE id = $1', [id]);
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found.' });

    if (assignment.teacher_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only assignment creator or admin can update.' });
    }

    const nextAttachments = req.file
      ? [req.file.filename]
      : attachments !== undefined
        ? normalizeAttachments(attachments)
        : normalizeAttachments(assignment.attachments);
    const normalizedPoints = parsePoints(points, assignment.points || 100);

    const rows = await db.query(
      `UPDATE assignments SET
         title = $1,
         description = $2,
         due_date = $3,
         points = $4,
         attachments = $5,
         updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [
        title,
        description || '',
        due_date || null,
        normalizedPoints,
        serializeAttachmentsForDb(nextAttachments),
        id,
      ]
    );

    const updatedAssignment = withAttachmentMetadata(rows[0]);
    const classroom = await db.queryOne('SELECT * FROM classrooms WHERE id = $1', [assignment.classroom_id]);
    const studentIds = await getClassroomStudentIds(assignment.classroom_id);
    const legacyAnnouncementTitles = [
      buildAssignmentAnnouncementTitle(assignment.title, 'created'),
      buildAssignmentAnnouncementTitle(assignment.title, 'updated'),
      buildAssignmentAnnouncementTitle(updatedAssignment.title, 'created'),
      buildAssignmentAnnouncementTitle(updatedAssignment.title, 'updated'),
    ];
    const legacyDeadlineTitles = [assignment.title, updatedAssignment.title];
    const announcementTitle = buildAssignmentAnnouncementTitle(updatedAssignment.title, 'updated');
    const announcementContent = buildAssignmentSummary({
      classroom,
      description: updatedAssignment.description,
      dueDate: updatedAssignment.due_date,
      points: updatedAssignment.points,
    });

    await upsertAssignmentAnnouncement({
      assignmentId: updatedAssignment.id,
      classroomId: assignment.classroom_id,
      title: announcementTitle,
      content: announcementContent,
      authorId: req.user.id,
      legacyTitles: legacyAnnouncementTitles,
    });

    await syncAssignmentDeadlines({
      assignmentId: updatedAssignment.id,
      studentIds,
      title: updatedAssignment.title,
      description: announcementContent,
      classroom,
      dueDate: updatedAssignment.due_date,
      priority: getDeadlinePriority(updatedAssignment.due_date),
      legacyTitles: legacyDeadlineTitles,
    });

    await syncAssignmentMarksForUpdatedAssignment(updatedAssignment);

    if (studentIds.length) {
      await notificationService.notify('ASSIGNMENT_UPDATED', {
        userIds: studentIds,
        title: `Assignment Updated: ${updatedAssignment.title}`,
        message: announcementContent,
        type: 'deadline',
        referenceId: updatedAssignment.id,
      });
    }

    res.json({ success: true, assignment: updatedAssignment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await db.queryOne('SELECT * FROM assignments WHERE id = $1', [id]);
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found.' });

    if (assignment.teacher_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only assignment creator or admin can delete.' });
    }

    const classroom = await db.queryOne('SELECT * FROM classrooms WHERE id = $1', [assignment.classroom_id]);
    const studentIds = await getClassroomStudentIds(assignment.classroom_id);
    const legacyAnnouncementTitles = [
      buildAssignmentAnnouncementTitle(assignment.title, 'created'),
      buildAssignmentAnnouncementTitle(assignment.title, 'updated'),
    ];
    const legacyDeadlineTitles = [assignment.title];
    await db.query('DELETE FROM classroom_announcements WHERE assignment_id = $1', [id]);
    if (legacyAnnouncementTitles.length) {
      await db.query(
        `DELETE FROM classroom_announcements
         WHERE assignment_id IS NULL
           AND classroom_id = $1
           AND title = ANY($2::text[])`,
        [assignment.classroom_id, legacyAnnouncementTitles]
      );
    }
    await db.query('DELETE FROM deadlines WHERE assignment_id = $1', [id]);
    if (studentIds.length) {
      await db.query(
        `DELETE FROM deadlines
         WHERE assignment_id IS NULL
           AND type = 'assignment'
           AND course_code = $1
           AND title = ANY($2::text[])
           AND user_id = ANY($3::int[])`,
        [classroom?.course_code || '', legacyDeadlineTitles, studentIds]
      );
    }
    await db.query('DELETE FROM assignments WHERE id = $1', [id]);

    if (studentIds.length) {
      await notificationService.notify('ASSIGNMENT_DELETED', {
        userIds: studentIds,
        title: `Assignment Removed: ${assignment.title}`,
        message: `"${assignment.title}" has been removed from ${classroom?.course_code || 'this classroom'}.`,
        type: 'deadline',
        referenceId: Number(id),
      });
    }

    res.json({ success: true, message: 'Assignment deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAssignments = async (req, res) => {
  try {
    const classroom_id = parseInt(req.query.classroom_id, 10);
    if (!classroom_id) return res.status(400).json({ success: false, message: 'classroom_id required.' });

    const classroom = await db.queryOne('SELECT * FROM classrooms WHERE id = $1', [classroom_id]);
    if (!classroom) return res.status(404).json({ success: false, message: 'Classroom not found.' });

    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      const isEnrolled = await db.queryOne(
        'SELECT 1 FROM classroom_students WHERE classroom_id = $1 AND student_id = $2',
        [classroom_id, req.user.id]
      );
      if (!isEnrolled) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    }

    const assignments = await db.query(
      `SELECT a.*, u.name AS teacher_name
       FROM assignments a
       JOIN users u ON a.teacher_id = u.id
       WHERE a.classroom_id = $1
       ORDER BY a.created_at DESC`,
      [classroom_id]
    );

    res.json({ success: true, assignments: assignments.map(withAttachmentMetadata) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await db.queryOne(
      `SELECT a.*, u.name AS teacher_name, c.course_code, c.course_name
       FROM assignments a
       JOIN users u ON a.teacher_id = u.id
       JOIN classrooms c ON a.classroom_id = c.id
       WHERE a.id = $1`,
      [id]
    );

    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found.' });

    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      const isEnrolled = await db.queryOne(
        'SELECT 1 FROM classroom_students WHERE classroom_id = $1 AND student_id = $2',
        [assignment.classroom_id, req.user.id]
      );
      if (!isEnrolled) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    }

    res.json({ success: true, assignment: withAttachmentMetadata(assignment) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.submitAssignment = async (req, res) => {
  try {
    const assignment_id = parseInt(req.params.id || req.body.assignment_id, 10);
    const submission_text = req.body.submission_text ?? req.body.comments ?? '';

    if (!assignment_id) {
      return res.status(400).json({ success: false, message: 'assignment_id required.' });
    }

    const assignment = await db.queryOne('SELECT * FROM assignments WHERE id = $1', [assignment_id]);
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found.' });

    const isEnrolled = await db.queryOne(
      'SELECT 1 FROM classroom_students WHERE classroom_id = $1 AND student_id = $2',
      [assignment.classroom_id, req.user.id]
    );
    if (!isEnrolled) {
      return res.status(403).json({ success: false, message: 'You are not enrolled in this classroom.' });
    }

    const existing = await db.queryOne(
      'SELECT * FROM assignment_submissions WHERE assignment_id = $1 AND student_id = $2',
      [assignment_id, req.user.id]
    );

    const incomingAttachments = req.file
      ? [req.file.filename]
      : normalizeAttachments(req.body.attachments);

    let submission;
    if (existing) {
      const nextAttachments = incomingAttachments.length
        ? incomingAttachments
        : normalizeAttachments(existing.attachments);

      const rows = await db.query(
        `UPDATE assignment_submissions SET
           submission_text = $1,
           attachments = $2,
           submitted_at = NOW(),
           updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [submission_text, serializeAttachmentsForDb(nextAttachments), existing.id]
      );
      submission = rows[0];
    } else {
      const rows = await db.query(
        `INSERT INTO assignment_submissions (assignment_id, student_id, submission_text, attachments, submitted_at)
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING *`,
        [assignment_id, req.user.id, submission_text, serializeAttachmentsForDb(incomingAttachments)]
      );
      submission = rows[0];
    }

    res.json({ success: true, submission: withAttachmentMetadata(submission) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.gradeSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { grade, feedback } = req.body;

    const submission = await db.queryOne(
      `SELECT s.*, a.teacher_id, a.classroom_id, a.title, a.points
       FROM assignment_submissions s
       JOIN assignments a ON s.assignment_id = a.id
       WHERE s.id = $1`,
      [id]
    );

    if (!submission) return res.status(404).json({ success: false, message: 'Submission not found.' });

    if (submission.teacher_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only assignment teacher or admin can grade.' });
    }

    const rows = await db.query(
      `UPDATE assignment_submissions SET
         grade = $1,
         feedback = $2,
         graded_at = NOW(),
         updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [grade, feedback || '', id]
    );

    const updatedSubmission = rows[0];
    const mark = await syncAssignmentMark({
      assignmentId: submission.assignment_id,
      classroomId: submission.classroom_id,
      studentId: submission.student_id,
      submissionId: updatedSubmission.id,
      title: submission.title,
      grade,
      totalMarks: parsePoints(submission.points, 100),
      feedback,
      gradedAt: updatedSubmission.graded_at || new Date(),
    });

    await notificationService.notify('SUBMISSION_GRADED', {
      userIds: [submission.student_id],
      title: `Assignment Graded: ${submission.title}`,
      message: `Your submission has been graded. Score: ${grade}/${submission.points || 100}`,
      type: 'resource',
      referenceId: updatedSubmission.id,
    });

    res.json({ success: true, submission: withAttachmentMetadata(updatedSubmission), mark });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getSubmissions = async (req, res) => {
  try {
    const assignment_id = parseInt(req.query.assignment_id, 10);
    if (!assignment_id) return res.status(400).json({ success: false, message: 'assignment_id required.' });

    const assignment = await db.queryOne('SELECT * FROM assignments WHERE id = $1', [assignment_id]);
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found.' });

    if (assignment.teacher_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only assignment teacher or admin can view submissions.' });
    }

    const submissions = await db.query(
      `SELECT s.*, u.name AS student_name, u.email AS student_email, u.student_number
       FROM assignment_submissions s
       JOIN users u ON s.student_id = u.id
       WHERE s.assignment_id = $1
       ORDER BY s.submitted_at DESC`,
      [assignment_id]
    );

    res.json({ success: true, submissions: submissions.map(withAttachmentMetadata) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMySubmission = async (req, res) => {
  try {
    const assignment_id = parseInt(req.query.assignment_id, 10);
    if (!assignment_id) return res.status(400).json({ success: false, message: 'assignment_id required.' });

    const submission = await db.queryOne(
      `SELECT s.*, a.title, a.points, a.due_date
       FROM assignment_submissions s
       JOIN assignments a ON s.assignment_id = a.id
       WHERE s.assignment_id = $1 AND s.student_id = $2`,
      [assignment_id, req.user.id]
    );

    res.json({ success: true, submission: withAttachmentMetadata(submission) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.downloadAssignmentAttachment = async (req, res) => {
  try {
    const assignment = await db.queryOne('SELECT * FROM assignments WHERE id = $1', [req.params.id]);
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found.' });

    const hasAccess = await canAccessClassroom(assignment.classroom_id, req.user);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const filePath = getPrimaryAttachmentPath(assignment.attachments);
    if (!filePath) {
      return res.status(404).json({ success: false, message: 'No attachment found for this assignment.' });
    }

    const absolutePath = path.join(ASSIGNMENT_UPLOAD_DIR, filePath);
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ success: false, message: 'Attachment file is missing.' });
    }

    res.download(absolutePath, path.basename(filePath));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.downloadSubmissionAttachment = async (req, res) => {
  try {
    const submission = await db.queryOne(
      `SELECT s.*, a.teacher_id
       FROM assignment_submissions s
       JOIN assignments a ON a.id = s.assignment_id
       WHERE s.id = $1`,
      [req.params.id]
    );

    if (!submission) return res.status(404).json({ success: false, message: 'Submission not found.' });

    const isOwner = submission.student_id === req.user.id;
    const isTeacher = submission.teacher_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isTeacher && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const filePath = getPrimaryAttachmentPath(submission.attachments);
    if (!filePath) {
      return res.status(404).json({ success: false, message: 'No attachment found for this submission.' });
    }

    const absolutePath = path.join(ASSIGNMENT_UPLOAD_DIR, filePath);
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ success: false, message: 'Submission file is missing.' });
    }

    res.download(absolutePath, path.basename(filePath));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
