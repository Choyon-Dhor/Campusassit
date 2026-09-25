const fs = require('fs');
const path = require('path');
const db = require('../config/database');
const notificationService = require('../services/NotificationService');

const UPLOAD_DIR = path.join(__dirname, '../uploads/assignments');

function normalizeAttachment(val) {
  if (!val) return null;
  if (typeof val === 'string') return val.trim() || null;
  if (typeof val === 'object') {
    const fp = [val.file_path, val.path, val.filename].find((e) => typeof e === 'string' && e.trim());
    return fp ? { ...val, file_path: fp } : null;
  }
  return null;
}

function normalizeAttachments(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(normalizeAttachment).filter(Boolean);
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map(normalizeAttachment).filter(Boolean);
      const obj = normalizeAttachment(parsed);
      if (obj) return [obj];
    } catch {
      return [trimmed];
    }
    return [trimmed];
  }
  if (typeof val === 'object') {
    const obj = normalizeAttachment(val);
    return obj ? [obj] : [];
  }
  return [];
}

function getPrimaryAttachmentPath(attachments) {
  const list = normalizeAttachments(attachments);
  if (!list.length) return null;
  const first = list[0];
  return typeof first === 'string' ? first : first.file_path || first.path || first.filename || null;
}

function withAttachmentMetadata(record) {
  if (!record) return null;
  const attachments = normalizeAttachments(record.attachments);
  return {
    ...record,
    attachments,
    file_path: getPrimaryAttachmentPath(attachments),
  };
}

const parsePoints = (val, fallback = 100) => {
  const num = Number(val);
  return Number.isFinite(num) ? num : fallback;
};

const serializeAttachments = (val) => JSON.stringify(normalizeAttachments(val));

const formatDueDate = (val) => {
  if (!val) return 'No due date';
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? 'No due date' : d.toLocaleString();
};

const getPriority = (val) => {
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return 'medium';
  const diff = d.getTime() - Date.now();
  if (diff <= 3 * 86400000) return 'high';
  if (diff <= 7 * 86400000) return 'medium';
  return 'low';
};

function buildAssignmentSummary({ classroom, description, dueDate, points }) {
  const label = classroom.course_name ? `${classroom.course_code} - ${classroom.course_name}` : classroom.course_code;
  const parts = [
    `A new assignment has been posted for ${label}.`,
    `Due ${formatDueDate(dueDate)}.`,
    `${points} points.`,
  ];
  if (description?.trim()) parts.push(description.trim());
  return parts.join(' ');
}

async function deleteRows(table, ids) {
  if (!ids.length) return;
  const ph = ids.map((_, i) => `$${i + 1}`).join(', ');
  await db.query(`DELETE FROM ${table} WHERE id IN (${ph})`, ids);
}

async function getClassroomStudentIds(classroomId) {
  const rows = await db.query(
    'SELECT student_id FROM classroom_students WHERE classroom_id = $1',
    [classroomId]
  );
  return rows.map((r) => Number(r.student_id));
}

async function syncAssignmentMark({ assignmentId, classroomId, studentId, submissionId, title, grade, totalMarks, feedback, gradedAt }) {
  const markDate = (gradedAt ? new Date(gradedAt) : new Date()).toISOString().slice(0, 10);
  const existing =
    (await db.queryOne('SELECT id FROM classroom_marks WHERE submission_id = $1', [submissionId])) ||
    (await db.queryOne('SELECT id FROM classroom_marks WHERE assignment_id = $1 AND student_id = $2', [assignmentId, studentId])) ||
    (await db.queryOne(
      `SELECT id FROM classroom_marks
       WHERE source = 'manual' AND classroom_id = $1 AND student_id = $2 AND title = $3 AND total_marks = $4
       ORDER BY updated_at DESC, created_at DESC LIMIT 1`,
      [classroomId, studentId, title, totalMarks]
    ));

  if (existing) {
    const rows = await db.query(
      `UPDATE classroom_marks SET
         classroom_id = $1, student_id = $2, assignment_id = $3, submission_id = $4,
         source = 'assignment', title = $5, marks_obtained = $6, total_marks = $7,
         feedback = $8, date = $9, updated_at = NOW()
       WHERE id = $10 RETURNING *`,
      [classroomId, studentId, assignmentId, submissionId, title, grade, totalMarks, feedback || '', markDate, existing.id]
    );
    return rows[0];
  }

  const rows = await db.query(
    `INSERT INTO classroom_marks (classroom_id, student_id, assignment_id, submission_id, source, title, marks_obtained, total_marks, feedback, date)
     VALUES ($1, $2, $3, $4, 'assignment', $5, $6, $7, $8, $9) RETURNING *`,
    [classroomId, studentId, assignmentId, submissionId, title, grade, totalMarks, feedback || '', markDate]
  );
  return rows[0];
}

async function upsertAssignmentAnnouncement({ assignmentId, classroomId, title, content, authorId, legacyTitles = [] }) {
  const existing = await db.queryOne(
    'SELECT id FROM classroom_announcements WHERE assignment_id = $1',
    [assignmentId]
  );

  let targetId = existing?.id;
  if (!targetId && legacyTitles.length) {
    const legacy = await db.queryOne(
      `SELECT id FROM classroom_announcements
       WHERE assignment_id IS NULL AND classroom_id = $1 AND title = ANY($2::text[])
       ORDER BY created_at DESC LIMIT 1`,
      [classroomId, legacyTitles]
    );
    targetId = legacy?.id;
  }

  if (targetId) {
    await db.query(
      `UPDATE classroom_announcements SET classroom_id = $1, title = $2, content = $3, assignment_id = $4, updated_at = NOW()
       WHERE id = $5`,
      [classroomId, title, content, assignmentId, targetId]
    );
    return;
  }

  await db.query(
    `INSERT INTO classroom_announcements (classroom_id, title, content, assignment_id, author_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [classroomId, title, content, assignmentId, authorId]
  );
}

async function syncAssignmentDeadlines({ assignmentId, studentIds, title, description, classroom, dueDate, priority, legacyTitles = [] }) {
  if (!studentIds.length || !dueDate) {
    await db.query('DELETE FROM deadlines WHERE assignment_id = $1', [assignmentId]);
    return;
  }

  if (legacyTitles.length) {
    await db.query(
      `UPDATE deadlines SET assignment_id = $1, updated_at = NOW()
       WHERE assignment_id IS NULL AND type = 'assignment' AND course_code = $2 AND title = ANY($3::text[]) AND user_id = ANY($4::int[])`,
      [assignmentId, classroom.course_code, legacyTitles, studentIds]
    );
  }

  const existingDeadlines = await db.query(
    'SELECT id, user_id FROM deadlines WHERE assignment_id = $1',
    [assignmentId]
  );
  const desired = new Set(studentIds.map(Number));
  const staleIds = existingDeadlines.filter((d) => !desired.has(Number(d.user_id))).map((d) => d.id);
  await deleteRows('deadlines', staleIds);

  await db.query(
    `UPDATE deadlines SET
       title = $1, description = $2, course_code = $3, course_name = $4,
       deadline_date = $5, type = 'assignment', priority = $6, updated_at = NOW()
     WHERE assignment_id = $7`,
    [title, description, classroom.course_code, classroom.course_name, dueDate, priority, assignmentId]
  );

  const existingSet = new Set(existingDeadlines.filter((d) => desired.has(Number(d.user_id))).map((d) => Number(d.user_id)));
  const missing = studentIds.filter((id) => !existingSet.has(Number(id)));
  if (!missing.length) return;

  const ph = [];
  const params = [];
  missing.forEach((id, idx) => {
    const b = idx * 8;
    ph.push(`($${b + 1}, $${b + 2}, $${b + 3}, $${b + 4}, $${b + 5}, $${b + 6}, $${b + 7}, $${b + 8})`);
    params.push(title, description, classroom.course_code, classroom.course_name, dueDate, assignmentId, priority, Number(id));
  });

  await db.query(
    `INSERT INTO deadlines (title, description, course_code, course_name, deadline_date, assignment_id, priority, user_id)
     VALUES ${ph.join(', ')}`,
    params
  );
}

async function canAccessClassroom(classroomId, user) {
  if (user.role === 'admin') return true;
  const classroom = await db.queryOne('SELECT teacher_id FROM classrooms WHERE id = $1', [classroomId]);
  if (!classroom) return false;
  if (classroom.teacher_id === user.id) return true;
  if (user.role !== 'student') return false;

  const row = await db.queryOne(
    'SELECT 1 FROM classroom_students WHERE classroom_id = $1 AND student_id = $2',
    [classroomId, user.id]
  );
  return Boolean(row);
}

exports.createAssignment = async (req, res, next) => {
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
    const storedAttachments = req.file ? [req.file.filename] : normalizeAttachments(attachments);

    const rows = await db.query(
      `INSERT INTO assignments (classroom_id, teacher_id, title, description, due_date, points, attachments)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [classroom_id, req.user.id, title, description || '', due_date || null, normalizedPoints, serializeAttachments(storedAttachments)]
    );

    const assignment = withAttachmentMetadata(rows[0]);
    const studentIds = await getClassroomStudentIds(classroom_id);
    const annTitle = `New Assignment: ${title}`;
    const annContent = buildAssignmentSummary({ classroom, description, dueDate: due_date, points: normalizedPoints });

    await upsertAssignmentAnnouncement({
      assignmentId: assignment.id,
      classroomId: classroom_id,
      title: annTitle,
      content: annContent,
      authorId: req.user.id,
      legacyTitles: [annTitle],
    });

    await syncAssignmentDeadlines({
      assignmentId: assignment.id,
      studentIds,
      title,
      description: annContent,
      classroom,
      dueDate: due_date,
      priority: getPriority(due_date),
      legacyTitles: [title],
    });

    if (studentIds.length) {
      await notificationService.notify('ASSIGNMENT_CREATED', {
        userIds: studentIds,
        title: `New Assignment: ${title}`,
        message: annContent,
        type: 'deadline',
        referenceId: assignment.id,
      });
    }

    res.status(201).json({ success: true, assignment });
  } catch (err) {
    next(err);
  }
};

exports.updateAssignment = async (req, res, next) => {
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
         title = $1, description = $2, due_date = $3, points = $4, attachments = $5, updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [title, description || '', due_date || null, normalizedPoints, serializeAttachments(nextAttachments), id]
    );

    const updated = withAttachmentMetadata(rows[0]);
    const classroom = await db.queryOne('SELECT * FROM classrooms WHERE id = $1', [assignment.classroom_id]);
    const studentIds = await getClassroomStudentIds(assignment.classroom_id);
    const annTitle = `Updated Assignment: ${updated.title}`;
    const annContent = buildAssignmentSummary({ classroom, description: updated.description, dueDate: updated.due_date, points: updated.points });

    await upsertAssignmentAnnouncement({
      assignmentId: updated.id,
      classroomId: assignment.classroom_id,
      title: annTitle,
      content: annContent,
      authorId: req.user.id,
      legacyTitles: [`New Assignment: ${assignment.title}`, `Updated Assignment: ${assignment.title}`, `New Assignment: ${updated.title}`, annTitle],
    });

    await syncAssignmentDeadlines({
      assignmentId: updated.id,
      studentIds,
      title: updated.title,
      description: annContent,
      classroom,
      dueDate: updated.due_date,
      priority: getPriority(updated.due_date),
      legacyTitles: [assignment.title, updated.title],
    });

    await db.query(
      `UPDATE classroom_marks SET title = $1, total_marks = $2, updated_at = NOW() WHERE assignment_id = $3`,
      [updated.title, updated.points, updated.id]
    );

    if (studentIds.length) {
      await notificationService.notify('ASSIGNMENT_UPDATED', {
        userIds: studentIds,
        title: `Assignment Updated: ${updated.title}`,
        message: annContent,
        type: 'deadline',
        referenceId: updated.id,
      });
    }

    res.json({ success: true, assignment: updated });
  } catch (err) {
    next(err);
  }
};

exports.deleteAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const assignment = await db.queryOne('SELECT * FROM assignments WHERE id = $1', [id]);
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found.' });

    if (assignment.teacher_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only assignment creator or admin can delete.' });
    }

    const classroom = await db.queryOne('SELECT * FROM classrooms WHERE id = $1', [assignment.classroom_id]);
    const studentIds = await getClassroomStudentIds(assignment.classroom_id);
    const legacyAnnTitles = [`New Assignment: ${assignment.title}`, `Updated Assignment: ${assignment.title}`];

    await db.query('DELETE FROM classroom_announcements WHERE assignment_id = $1', [id]);
    if (legacyAnnTitles.length) {
      await db.query(
        `DELETE FROM classroom_announcements WHERE assignment_id IS NULL AND classroom_id = $1 AND title = ANY($2::text[])`,
        [assignment.classroom_id, legacyAnnTitles]
      );
    }

    await db.query('DELETE FROM deadlines WHERE assignment_id = $1', [id]);
    if (studentIds.length) {
      await db.query(
        `DELETE FROM deadlines WHERE assignment_id IS NULL AND type = 'assignment' AND course_code = $1 AND title = ANY($2::text[]) AND user_id = ANY($3::int[])`,
        [classroom?.course_code || '', [assignment.title], studentIds]
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
    next(err);
  }
};

exports.getAssignments = async (req, res, next) => {
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
      if (!isEnrolled) return res.status(403).json({ success: false, message: 'Access denied.' });
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
    next(err);
  }
};

exports.getAssignment = async (req, res, next) => {
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
      if (!isEnrolled) return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, assignment: withAttachmentMetadata(assignment) });
  } catch (err) {
    next(err);
  }
};

exports.submitAssignment = async (req, res, next) => {
  try {
    const assignment_id = parseInt(req.params.id || req.body.assignment_id, 10);
    const submission_text = req.body.submission_text ?? req.body.comments ?? '';

    if (!assignment_id) return res.status(400).json({ success: false, message: 'assignment_id required.' });

    const assignment = await db.queryOne('SELECT * FROM assignments WHERE id = $1', [assignment_id]);
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found.' });

    const isEnrolled = await db.queryOne(
      'SELECT 1 FROM classroom_students WHERE classroom_id = $1 AND student_id = $2',
      [assignment.classroom_id, req.user.id]
    );
    if (!isEnrolled) return res.status(403).json({ success: false, message: 'You are not enrolled in this classroom.' });

    const existing = await db.queryOne(
      'SELECT * FROM assignment_submissions WHERE assignment_id = $1 AND student_id = $2',
      [assignment_id, req.user.id]
    );

    const incoming = req.file ? [req.file.filename] : normalizeAttachments(req.body.attachments);
    let submission;

    if (existing) {
      const nextAttachments = incoming.length ? incoming : normalizeAttachments(existing.attachments);
      const rows = await db.query(
        `UPDATE assignment_submissions SET submission_text = $1, attachments = $2, submitted_at = NOW(), updated_at = NOW()
         WHERE id = $3 RETURNING *`,
        [submission_text, serializeAttachments(nextAttachments), existing.id]
      );
      submission = rows[0];
    } else {
      const rows = await db.query(
        `INSERT INTO assignment_submissions (assignment_id, student_id, submission_text, attachments, submitted_at)
         VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
        [assignment_id, req.user.id, submission_text, serializeAttachments(incoming)]
      );
      submission = rows[0];
    }

    res.json({ success: true, submission: withAttachmentMetadata(submission) });
  } catch (err) {
    next(err);
  }
};

exports.gradeSubmission = async (req, res, next) => {
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
      `UPDATE assignment_submissions SET grade = $1, feedback = $2, graded_at = NOW(), updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [grade, feedback || '', id]
    );

    const updated = rows[0];
    const mark = await syncAssignmentMark({
      assignmentId: submission.assignment_id,
      classroomId: submission.classroom_id,
      studentId: submission.student_id,
      submissionId: updated.id,
      title: submission.title,
      grade,
      totalMarks: parsePoints(submission.points, 100),
      feedback,
      gradedAt: updated.graded_at || new Date(),
    });

    await notificationService.notify('SUBMISSION_GRADED', {
      userIds: [submission.student_id],
      title: `Assignment Graded: ${submission.title}`,
      message: `Your submission has been graded. Score: ${grade}/${submission.points || 100}`,
      type: 'resource',
      referenceId: updated.id,
    });

    res.json({ success: true, submission: withAttachmentMetadata(updated), mark });
  } catch (err) {
    next(err);
  }
};

exports.getSubmissions = async (req, res, next) => {
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
    next(err);
  }
};

exports.getMySubmission = async (req, res, next) => {
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
    next(err);
  }
};

exports.downloadAssignmentAttachment = async (req, res, next) => {
  try {
    const assignment = await db.queryOne('SELECT * FROM assignments WHERE id = $1', [req.params.id]);
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found.' });

    if (!(await canAccessClassroom(assignment.classroom_id, req.user))) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const filePath = getPrimaryAttachmentPath(assignment.attachments);
    if (!filePath) return res.status(404).json({ success: false, message: 'No attachment found for this assignment.' });

    const absPath = path.join(UPLOAD_DIR, filePath);
    if (!fs.existsSync(absPath)) return res.status(404).json({ success: false, message: 'Attachment file is missing.' });

    res.download(absPath, path.basename(filePath));
  } catch (err) {
    next(err);
  }
};

exports.downloadSubmissionAttachment = async (req, res, next) => {
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
    if (!filePath) return res.status(404).json({ success: false, message: 'No attachment found for this submission.' });

    const absPath = path.join(UPLOAD_DIR, filePath);
    if (!fs.existsSync(absPath)) return res.status(404).json({ success: false, message: 'Submission file is missing.' });

    res.download(absPath, path.basename(filePath));
  } catch (err) {
    next(err);
  }
};
