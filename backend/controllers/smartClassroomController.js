const db = require('../config/database');
const notificationService = require('../services/NotificationService');

function computeAttendanceStats(rows) {
  const total = rows.length;
  const present = rows.filter((r) => r.status === 'present').length;
  const absent = rows.filter((r) => r.status === 'absent').length;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
  return { totalClasses: total, present, absent, percentage, lowAttendance: percentage < 75 };
}

exports.createClassroom = async (req, res, next) => {
  try {
    const { course_code, course_name, description = '', batch, section, semester } = req.body;
    if (!course_code || !course_name || !batch || !section || !semester) {
      return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }

    const existing = await db.queryOne(
      `SELECT id FROM classrooms WHERE course_code=$1 AND batch=$2 AND section=$3 AND semester=$4`,
      [course_code, batch, section, semester]
    );
    if (existing) {
      return res.status(409).json({ success: false, message: 'Classroom with same course/batch/section/semester already exists.' });
    }

    const rows = await db.query(
      `INSERT INTO classrooms (course_code, course_name, description, teacher_id, batch, section, semester)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [course_code, course_name, description, req.user.id, batch, section, semester]
    );

    res.status(201).json({ success: true, classroom: rows[0] });
  } catch (err) {
    next(err);
  }
};

exports.updateClassroom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { course_code, course_name, description = '', batch, section, semester } = req.body;

    const classroom = await db.queryOne('SELECT * FROM classrooms WHERE id=$1', [id]);
    if (!classroom) return res.status(404).json({ success: false, message: 'Classroom not found.' });

    if (classroom.teacher_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only classroom teacher or admin can update classroom.' });
    }

    const rows = await db.query(
      `UPDATE classrooms SET
        course_code = $1, course_name = $2, description = $3,
        batch = $4, section = $5, semester = $6, updated_at = NOW()
       WHERE id = $7 RETURNING *`,
      [course_code, course_name, description, batch, section, semester, id]
    );

    res.json({ success: true, classroom: rows[0] });
  } catch (err) {
    next(err);
  }
};

exports.deleteClassroom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const classroom = await db.queryOne('SELECT * FROM classrooms WHERE id=$1', [id]);
    if (!classroom) return res.status(404).json({ success: false, message: 'Classroom not found.' });

    if (classroom.teacher_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only classroom teacher or admin can delete classroom.' });
    }

    await db.query('DELETE FROM classrooms WHERE id = $1', [id]);
    res.json({ success: true, message: 'Classroom deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

exports.uploadStudents = async (req, res, next) => {
  try {
    const { classroom_id, student_numbers, csv } = req.body;
    const classroom = await db.queryOne('SELECT * FROM classrooms WHERE id=$1', [classroom_id]);
    if (!classroom) return res.status(404).json({ success: false, message: 'Classroom not found.' });

    if (classroom.teacher_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only classroom teacher or admin can add students.' });
    }

    let numbers = [];
    if (Array.isArray(student_numbers) && student_numbers.length) {
      numbers = student_numbers.map((n) => n.toString().trim()).filter(Boolean);
    } else if (typeof csv === 'string' && csv.trim()) {
      numbers = csv
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => {
          const parts = l.split(/,|\t/);
          return (parts[1] || parts[0]).trim();
        });
    }

    if (!numbers.length) return res.status(400).json({ success: false, message: 'No students provided.' });

    const uniqueNumbers = [...new Set(numbers)];
    const studentRows = await db.query(
      `SELECT id, student_number FROM users WHERE student_number = ANY($1::text[]) AND role='student'`,
      [uniqueNumbers]
    );

    const foundIds = studentRows.map((s) => s.id);
    const existingNumSet = new Set(studentRows.map((s) => s.student_number));
    const missing = uniqueNumbers.filter((n) => !existingNumSet.has(n));

    if (foundIds.length) {
      const valuesSql = foundIds.map((id) => `(${classroom_id}, ${id})`).join(',');
      await db.query(`INSERT INTO classroom_students (classroom_id, student_id) VALUES ${valuesSql} ON CONFLICT DO NOTHING`);

      await notificationService.notify('CLASSROOM_ADDED', {
        userIds: foundIds,
        title: `📚 Added to ${classroom.course_code} - ${classroom.course_name}`,
        message: `You have been added to classroom ${classroom.course_name} (${classroom.course_code}) by ${req.user.name}.`,
        type: 'studygroup',
        referenceId: classroom.id,
      });
    }

    res.json({
      success: true,
      classroom_id,
      added_student_count: foundIds.length,
      missing_student_numbers: missing,
    });
  } catch (err) {
    next(err);
  }
};

exports.markAttendance = async (req, res, next) => {
  try {
    const { classroom_id, student_id, date, status } = req.body;
    if (!classroom_id || !student_id || !date || !['present', 'absent'].includes(status)) {
      return res.status(400).json({ success: false, message: 'classroom_id, student_id, date, status required.' });
    }

    const classroom = await db.queryOne('SELECT * FROM classrooms WHERE id=$1', [classroom_id]);
    if (!classroom) return res.status(404).json({ success: false, message: 'Classroom not found.' });

    if (classroom.teacher_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only classroom teacher or admin can mark attendance.' });
    }

    const existing = await db.queryOne(
      `SELECT id FROM classroom_attendance WHERE classroom_id=$1 AND student_id=$2 AND date=$3`,
      [classroom_id, student_id, date]
    );

    let attendance;
    if (existing) {
      const rows = await db.query(
        `UPDATE classroom_attendance SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *`,
        [status, existing.id]
      );
      attendance = rows[0];
    } else {
      const rows = await db.query(
        `INSERT INTO classroom_attendance (classroom_id, student_id, date, status)
         VALUES ($1,$2,$3,$4) RETURNING *`,
        [classroom_id, student_id, date, status]
      );
      attendance = rows[0];
    }

    await notificationService.notify('ATTENDANCE_MARKED', {
      userIds: [student_id],
      title: `📝 Attendance ${status.toUpperCase()} for ${classroom.course_code}`,
      message: `Your attendance on ${date} for ${classroom.course_code} has been marked ${status}.`,
      type: 'resource',
      referenceId: attendance.id,
    });

    res.json({ success: true, attendance });
  } catch (err) {
    next(err);
  }
};

exports.getAttendance = async (req, res, next) => {
  try {
    const classroom_id = parseInt(req.params.id || req.query.classroom_id, 10);
    if (!classroom_id) return res.status(400).json({ success: false, message: 'classroom_id required.' });

    const classroom = await db.queryOne('SELECT * FROM classrooms WHERE id=$1', [classroom_id]);
    if (!classroom) return res.status(404).json({ success: false, message: 'Classroom not found.' });

    const isStudent = req.user.role === 'student';
    const targetStudentId = isStudent ? req.user.id : (req.query.student_id ? parseInt(req.query.student_id, 10) : null);

    const rows = targetStudentId
      ? await db.query(
          `SELECT * FROM classroom_attendance WHERE classroom_id=$1 AND student_id=$2 ORDER BY date DESC`,
          [classroom_id, targetStudentId]
        )
      : await db.query(
          `SELECT * FROM classroom_attendance WHERE classroom_id=$1 ORDER BY date DESC, student_id ASC`,
          [classroom_id]
        );

    res.json({ success: true, attendance: rows, analytics: computeAttendanceStats(rows) });
  } catch (err) {
    next(err);
  }
};

exports.addMarks = async (req, res, next) => {
  try {
    const { classroom_id, student_id, title, marks_obtained, total_marks, date } = req.body;
    if (!classroom_id || !student_id || !title || marks_obtained == null || total_marks == null || !date) {
      return res.status(400).json({ success: false, message: 'classroom_id, student_id, title, marks_obtained, total_marks, date required.' });
    }

    const classroom = await db.queryOne('SELECT * FROM classrooms WHERE id=$1', [classroom_id]);
    if (!classroom) return res.status(404).json({ success: false, message: 'Classroom not found.' });

    if (classroom.teacher_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only classroom teacher or admin can add marks.' });
    }

    const rows = await db.query(
      `INSERT INTO classroom_marks (classroom_id, student_id, source, title, marks_obtained, total_marks, feedback, date)
       VALUES ($1,$2,'manual',$3,$4,$5,$6,$7) RETURNING *`,
      [classroom_id, student_id, title, marks_obtained, total_marks, '', date]
    );
    const mark = rows[0];

    await notificationService.notify('MARKS_PUBLISHED', {
      userIds: [student_id],
      title: `🏅 Marks Updated for ${classroom.course_code}`,
      message: `${title}: ${marks_obtained}/${total_marks} has been recorded.`,
      type: 'resource',
      referenceId: mark.id,
    });

    res.status(201).json({ success: true, mark });
  } catch (err) {
    next(err);
  }
};

exports.getMarks = async (req, res, next) => {
  try {
    const classroom_id = parseInt(req.params.id || req.query.classroom_id, 10);
    if (!classroom_id) return res.status(400).json({ success: false, message: 'classroom_id required.' });

    const isStudent = req.user.role === 'student';
    const targetStudentId = isStudent ? req.user.id : (req.query.student_id ? parseInt(req.query.student_id, 10) : null);

    const rows = targetStudentId
      ? await db.query(
          `SELECT cm.*, u.name AS student_name, u.student_number
           FROM classroom_marks cm
           JOIN users u ON u.id = cm.student_id
           WHERE cm.classroom_id=$1 AND cm.student_id=$2
           ORDER BY cm.date DESC`,
          [classroom_id, targetStudentId]
        )
      : await db.query(
          `SELECT cm.*, u.name AS student_name, u.student_number
           FROM classroom_marks cm
           JOIN users u ON u.id = cm.student_id
           WHERE cm.classroom_id=$1
           ORDER BY cm.date DESC, cm.student_id ASC`,
          [classroom_id]
        );

    const totalScored = rows.reduce((sum, r) => sum + parseFloat(r.marks_obtained), 0);
    const totalMax = rows.reduce((sum, r) => sum + parseFloat(r.total_marks), 0);
    const percentage = totalMax > 0 ? Math.round((totalScored / totalMax) * 100) : 0;

    res.json({ success: true, marks: rows, summary: { totalScored, totalMax, percentage } });
  } catch (err) {
    next(err);
  }
};

exports.getClassroom = async (req, res, next) => {
  try {
    const classroom = await db.queryOne('SELECT * FROM classrooms WHERE id=$1', [req.params.id]);
    if (!classroom) return res.status(404).json({ success: false, message: 'Classroom not found.' });
    res.json({ success: true, classroom });
  } catch (err) {
    next(err);
  }
};

exports.listClassrooms = async (req, res, next) => {
  try {
    const sql = req.user.role === 'student'
      ? `SELECT c.* FROM classrooms c JOIN classroom_students cs ON cs.classroom_id = c.id WHERE cs.student_id = $1`
      : `SELECT * FROM classrooms WHERE teacher_id = $1`;

    const rows = await db.query(sql, [req.user.id]);
    res.json({ success: true, classrooms: rows });
  } catch (err) {
    next(err);
  }
};

exports.getClassroomStudents = async (req, res, next) => {
  try {
    const classroom_id = parseInt(req.params.id, 10);
    const classroom = await db.queryOne('SELECT * FROM classrooms WHERE id=$1', [classroom_id]);
    if (!classroom) return res.status(404).json({ success: false, message: 'Classroom not found.' });

    const sql = req.user.role === 'student'
      ? `SELECT u.id, u.name, u.email, u.student_number FROM users u
         JOIN classroom_students cs ON cs.student_id=u.id WHERE cs.classroom_id=$1 AND u.id=$2`
      : `SELECT u.id, u.name, u.email, u.student_number FROM users u
         JOIN classroom_students cs ON cs.student_id=u.id WHERE cs.classroom_id=$1`;
    const params = req.user.role === 'student' ? [classroom_id, req.user.id] : [classroom_id];

    const rows = await db.query(sql, params);
    res.json({ success: true, students: rows });
  } catch (err) {
    next(err);
  }
};

exports.createAnnouncement = async (req, res, next) => {
  try {
    const { classroom_id, title, content } = req.body;
    if (!classroom_id || !title || !content) {
      return res.status(400).json({ success: false, message: 'classroom_id, title, content required.' });
    }

    const classroom = await db.queryOne('SELECT * FROM classrooms WHERE id=$1', [classroom_id]);
    if (!classroom) return res.status(404).json({ success: false, message: 'Classroom not found.' });

    if (classroom.teacher_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only classroom teacher or admin can post announcements.' });
    }

    const rows = await db.query(
      `INSERT INTO classroom_announcements (classroom_id, title, content, author_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [classroom_id, title, content, req.user.id]
    );

    const students = await db.query(`SELECT student_id FROM classroom_students WHERE classroom_id = $1`, [classroom_id]);
    if (students.length) {
      await notificationService.notify('CLASSROOM_ANNOUNCEMENT', {
        userIds: students.map((s) => s.student_id),
        title: `📢 New announcement in ${classroom.course_code}`,
        message: `${title}: ${content.substring(0, 100)}...`,
        type: 'announcement',
        referenceId: rows[0].id,
      });
    }

    res.status(201).json({ success: true, announcement: rows[0] });
  } catch (err) {
    next(err);
  }
};

exports.listAnnouncements = async (req, res, next) => {
  try {
    const classroom_id = parseInt(req.params.id || req.query.classroom_id, 10);
    if (!classroom_id) return res.status(400).json({ success: false, message: 'classroom_id required.' });

    const classroom = await db.queryOne('SELECT * FROM classrooms WHERE id=$1', [classroom_id]);
    if (!classroom) return res.status(404).json({ success: false, message: 'Classroom not found.' });

    const rows = await db.query(
      `SELECT ca.*, u.name as author_name
       FROM classroom_announcements ca
       JOIN users u ON u.id = ca.author_id
       WHERE ca.classroom_id = $1
       ORDER BY ca.created_at DESC`,
      [classroom_id]
    );
    res.json({ success: true, announcements: rows });
  } catch (err) {
    next(err);
  }
};

exports.addResource = async (req, res, next) => {
  try {
    const { classroom_id, title, file_url } = req.body;
    if (!classroom_id || !title || !file_url) {
      return res.status(400).json({ success: false, message: 'classroom_id, title, file_url required.' });
    }

    const classroom = await db.queryOne('SELECT * FROM classrooms WHERE id=$1', [classroom_id]);
    if (!classroom) return res.status(404).json({ success: false, message: 'Classroom not found.' });

    if (classroom.teacher_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only classroom teacher or admin can upload resources.' });
    }

    const rows = await db.query(
      `INSERT INTO classroom_resources (classroom_id, title, file_url, uploader_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [classroom_id, title, file_url, req.user.id]
    );

    const students = await db.query(`SELECT student_id FROM classroom_students WHERE classroom_id = $1`, [classroom_id]);
    if (students.length) {
      await notificationService.notify('CLASSROOM_RESOURCE', {
        userIds: students.map((s) => s.student_id),
        title: `📎 New resource in ${classroom.course_code}`,
        message: `${title} has been uploaded to the classroom.`,
        type: 'resource',
        referenceId: rows[0].id,
      });
    }

    res.status(201).json({ success: true, resource: rows[0] });
  } catch (err) {
    next(err);
  }
};

exports.listResources = async (req, res, next) => {
  try {
    const classroom_id = parseInt(req.params.id || req.query.classroom_id, 10);
    if (!classroom_id) return res.status(400).json({ success: false, message: 'classroom_id required.' });

    const classroom = await db.queryOne('SELECT * FROM classrooms WHERE id=$1', [classroom_id]);
    if (!classroom) return res.status(404).json({ success: false, message: 'Classroom not found.' });

    const rows = await db.query(
      `SELECT cr.*, u.name as uploader_name
       FROM classroom_resources cr
       JOIN users u ON u.id = cr.uploader_id
       WHERE cr.classroom_id = $1
       ORDER BY cr.created_at DESC`,
      [classroom_id]
    );
    res.json({ success: true, resources: rows });
  } catch (err) {
    next(err);
  }
};

exports.getClassroomPeople = async (req, res, next) => {
  try {
    const classroom_id = parseInt(req.params.id, 10);
    if (!classroom_id) return res.status(400).json({ success: false, message: 'classroom_id required.' });

    const classroom = await db.queryOne('SELECT * FROM classrooms WHERE id=$1', [classroom_id]);
    if (!classroom) return res.status(404).json({ success: false, message: 'Classroom not found.' });

    const [teacher, students] = await Promise.all([
      db.queryOne(`SELECT u.id, u.name, u.email, u.student_number, 'teacher' as role FROM users u WHERE u.id = $1`, [classroom.teacher_id]),
      db.query(
        `SELECT u.id, u.name, u.email, u.student_number, 'student' as role
         FROM users u JOIN classroom_students cs ON cs.student_id = u.id
         WHERE cs.classroom_id = $1 ORDER BY u.name ASC`,
        [classroom_id]
      ),
    ]);

    const people = teacher ? [teacher, ...students] : students;
    res.json({ success: true, people, count: people.length, classroom_id, classroom_name: classroom.course_name });
  } catch (err) {
    next(err);
  }
};

exports.downloadClassroomPeople = async (req, res, next) => {
  try {
    const classroom_id = parseInt(req.params.id, 10);
    if (!classroom_id) return res.status(400).json({ success: false, message: 'classroom_id required.' });

    const classroom = await db.queryOne('SELECT * FROM classrooms WHERE id=$1', [classroom_id]);
    if (!classroom) return res.status(404).json({ success: false, message: 'Classroom not found.' });

    const [teacher, students] = await Promise.all([
      db.queryOne(`SELECT u.id, u.name, u.email, u.student_number, 'teacher' as role FROM users u WHERE u.id = $1`, [classroom.teacher_id]),
      db.query(
        `SELECT u.id, u.name, u.email, u.student_number, 'student' as role
         FROM users u JOIN classroom_students cs ON cs.student_id = u.id
         WHERE cs.classroom_id = $1 ORDER BY u.name ASC`,
        [classroom_id]
      ),
    ]);

    const people = teacher ? [teacher, ...students] : students;
    const lines = ['Name,ID,Email,Role'];

    for (const p of people) {
      const id = p.student_number || p.id;
      const name = `"${(p.name || '').replace(/"/g, '""')}"`;
      lines.push(`${name},${id},${p.email || ''},${p.role || 'student'}`);
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${classroom.course_code}-people.csv"`);
    res.send(lines.join('\n') + '\n');
  } catch (err) {
    next(err);
  }
};
