const db = require('../config/database');
const notificationService = require('../services/NotificationService');

// Helper for attendance analytics
function computeAttendanceStats(attendanceRows) {
  const total = attendanceRows.length;
  const present = attendanceRows.filter(r => r.status === 'present').length;
  const absent = attendanceRows.filter(r => r.status === 'absent').length;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
  return { totalClasses: total, present, absent, percentage, lowAttendance: percentage < 75 };
}

exports.createClassroom = async (req, res) => {
  try {
    const { course_code, course_name, description, batch, section, semester } = req.body;
    if (!course_code || !course_name || !batch || !section || !semester) {
      return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }

    const existing = await db.queryOne(
      `SELECT * FROM classrooms WHERE course_code=$1 AND batch=$2 AND section=$3 AND semester=$4`,
      [course_code, batch, section, semester]
    );
    if (existing) {
      return res.status(409).json({ success: false, message: 'Classroom with same course/batch/section/semester already exists.' });
    }

    const rows = await db.query(
      `INSERT INTO classrooms (course_code, course_name, description, teacher_id, batch, section, semester)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [course_code, course_name, description || '', req.user.id, batch, section, semester]
    );

    res.status(201).json({ success: true, classroom: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.uploadStudents = async (req, res) => {
  try {
    const { classroom_id, student_numbers, csv } = req.body;
    const classroom = await db.queryOne('SELECT * FROM classrooms WHERE id=$1', [classroom_id]);
    if (!classroom) return res.status(404).json({ success: false, message: 'Classroom not found.' });
    if (classroom.teacher_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only classroom teacher or admin can add students.' });
    }

    let numbers = [];
    if (Array.isArray(student_numbers) && student_numbers.length) {
      numbers = student_numbers.map(n => n.toString().trim()).filter(Boolean);
    } else if (typeof csv === 'string' && csv.trim()) {
      numbers = csv
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean)
        .map(line => line.split(/,|\t/)[1] ? line.split(/,|\t/)[1].trim() : line.trim());
    }

    if (!numbers.length) return res.status(400).json({ success: false, message: 'No students provided.' });

    const uniqueNumbers = Array.from(new Set(numbers));
    const studentRows = await db.query(
      `SELECT id, student_number FROM users WHERE student_number = ANY($1::text[]) AND role='student'`,
      [uniqueNumbers]
    );

    const foundStudentIds = studentRows.map(s => s.id);
    const missing = uniqueNumbers.filter(n => !studentRows.find(s => s.student_number === n));

    // Batch insert student links
    const toInsert = foundStudentIds.map(id => `(${classroom_id}, ${id})`).join(',');
    if (toInsert.length) {
      await db.query(
        `INSERT INTO classroom_students (classroom_id, student_id)
         VALUES ${toInsert}
         ON CONFLICT DO NOTHING`
      );
    }

    if (foundStudentIds.length) {
      await notificationService.notify('CLASSROOM_ADDED', {
        userIds: foundStudentIds,
        title: `📚 Added to ${classroom.course_code} - ${classroom.course_name}`,
        message: `You have been added to classroom ${classroom.course_name} (${classroom.course_code}) by ${req.user.name}.`,
        type: 'studygroup',
        referenceId: classroom.id,
      });
    }

    res.json({
      success: true,
      classroom_id,
      added_student_count: foundStudentIds.length,
      missing_student_numbers: missing,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.markAttendance = async (req, res) => {
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
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAttendance = async (req, res) => {
  try {
    const classroom_id = parseInt(req.query.classroom_id, 10);
    if (!classroom_id) return res.status(400).json({ success: false, message: 'classroom_id required.' });

    let student_id = req.user.id;
    if (req.user.role !== 'student' && req.query.student_id) {
      student_id = parseInt(req.query.student_id, 10);
    }

    const classroom = await db.queryOne('SELECT * FROM classrooms WHERE id=$1', [classroom_id]);
    if (!classroom) return res.status(404).json({ success: false, message: 'Classroom not found.' });

    // Teacher/admin can get any student; students only themselves
    if (req.user.role === 'student' && req.user.id !== student_id) {
      return res.status(403).json({ success: false, message: 'Permission denied.' });
    }

    const attendanceRows = await db.query(
      `SELECT * FROM classroom_attendance
       WHERE classroom_id=$1 AND student_id=$2
       ORDER BY date DESC`,
      [classroom_id, student_id]
    );

    res.json({ success: true, attendance: attendanceRows, analytics: computeAttendanceStats(attendanceRows) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addMarks = async (req, res) => {
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
      `INSERT INTO classroom_marks (classroom_id, student_id, title, marks_obtained, total_marks, date)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [classroom_id, student_id, title, marks_obtained, total_marks, date]
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
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMarks = async (req, res) => {
  try {
    const classroom_id = parseInt(req.query.classroom_id, 10);
    if (!classroom_id) return res.status(400).json({ success: false, message: 'classroom_id required.' });

    let student_id = req.user.id;
    if (req.user.role !== 'student' && req.query.student_id) {
      student_id = parseInt(req.query.student_id, 10);
    }

    const rows = await db.query(
      `SELECT * FROM classroom_marks
       WHERE classroom_id=$1 AND student_id=$2
       ORDER BY date DESC`,
      [classroom_id, student_id]
    );

    const totalScored = rows.reduce((sum, r) => sum + parseFloat(r.marks_obtained), 0);
    const totalMax = rows.reduce((sum, r) => sum + parseFloat(r.total_marks), 0);
    const percentage = totalMax > 0 ? Math.round((totalScored / totalMax) * 100) : 0;

    res.json({ success: true, marks: rows, summary: { totalScored, totalMax, percentage } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getClassroom = async (req, res) => {
  try {
    const classroom = await db.queryOne('SELECT * FROM classrooms WHERE id=$1', [req.params.id]);
    if (!classroom) return res.status(404).json({ success: false, message: 'Classroom not found.' });
    res.json({ success: true, classroom });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.listClassrooms = async (req, res) => {
  try {
    if (req.user.role === 'student') {
      const rows = await db.query(
        `SELECT c.* FROM classrooms c
         JOIN classroom_students cs ON cs.classroom_id = c.id
         WHERE cs.student_id = $1`,
        [req.user.id]
      );
      return res.json({ success: true, classrooms: rows });
    }
    const rows = await db.query(
      `SELECT * FROM classrooms WHERE teacher_id = $1`, [req.user.id]
    );
    res.json({ success: true, classrooms: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getClassroomStudents = async (req, res) => {
  try {
    const classroom_id = parseInt(req.params.id, 10);
    const classroom = await db.queryOne('SELECT * FROM classrooms WHERE id=$1', [classroom_id]);
    if (!classroom) return res.status(404).json({ success: false, message: 'Classroom not found.' });
    if (req.user.role === 'student') {
      const mapped = await db.query(
        `SELECT u.id,u.name,u.email,u.student_number FROM users u
         JOIN classroom_students cs ON cs.student_id=u.id
         WHERE cs.classroom_id=$1 AND u.id=$2`,
        [classroom_id, req.user.id]
      );
      return res.json({ success: true, students: mapped });
    }
    const rows = await db.query(
      `SELECT u.id,u.name,u.email,u.student_number FROM users u
       JOIN classroom_students cs ON cs.student_id=u.id
       WHERE cs.classroom_id=$1`,
      [classroom_id]
    );
    res.json({ success: true, students: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createAnnouncement = async (req, res) => {
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
    const announcement = rows[0];

    // Notify classroom students (Observer)
    const students = await db.query(
      `SELECT student_id FROM classroom_students WHERE classroom_id = $1`,
      [classroom_id]
    );
    const studentIds = students.map(s => s.student_id);
    if (studentIds.length) {
      await notificationService.notify('CLASSROOM_ANNOUNCEMENT', {
        userIds: studentIds,
        title: `📢 New announcement in ${classroom.course_code}`,
        message: `${title}: ${content.substring(0, 100)}...`,
        type: 'announcement',
        referenceId: announcement.id,
      });
    }

    res.status(201).json({ success: true, announcement });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.listAnnouncements = async (req, res) => {
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
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addResource = async (req, res) => {
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
    const resource = rows[0];

    // Notify students
    const students = await db.query(
      `SELECT student_id FROM classroom_students WHERE classroom_id = $1`,
      [classroom_id]
    );
    const studentIds = students.map(s => s.student_id);
    if (studentIds.length) {
      await notificationService.notify('CLASSROOM_RESOURCE', {
        userIds: studentIds,
        title: `📎 New resource in ${classroom.course_code}`,
        message: `${title} has been uploaded to the classroom.`,
        type: 'resource',
        referenceId: resource.id,
      });
    }

    res.status(201).json({ success: true, resource });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.listResources = async (req, res) => {
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
    res.status(500).json({ success: false, message: err.message });
  }
};

// Helper function to check classroom permissions
function checkClassroomPermission(classroom, user) {
  if (user.role === 'admin') return true;
  if (user.role === 'teacher' && classroom.teacher_id === user.id) return true;
  return false;
}

// Edit classroom details (only by teacher or admin)
exports.editClassroom = async (req, res) => {
  try {
    const classroom_id = parseInt(req.params.id, 10);
    const { course_code, course_name, description, batch, section, semester } = req.body;

    const classroom = await db.queryOne('SELECT * FROM classrooms WHERE id=$1', [classroom_id]);
    if (!classroom) return res.status(404).json({ success: false, message: 'Classroom not found.' });

    if (!checkClassroomPermission(classroom, req.user)) {
      return res.status(403).json({ success: false, message: 'Only classroom teacher or admin can edit classroom details.' });
    }

    const rows = await db.query(
      `UPDATE classrooms SET
        course_code = COALESCE($1, course_code),
        course_name = COALESCE($2, course_name),
        description = COALESCE($3, description),
        batch = COALESCE($4, batch),
        section = COALESCE($5, section),
        semester = COALESCE($6, semester),
        updated_at = NOW()
       WHERE id = $7 RETURNING *`,
      [course_code, course_name, description, batch, section, semester, classroom_id]
    );

    res.json({ success: true, classroom: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete classroom (only by teacher or admin)
exports.deleteClassroom = async (req, res) => {
  try {
    const classroom_id = parseInt(req.params.id, 10);

    const classroom = await db.queryOne('SELECT * FROM classrooms WHERE id=$1', [classroom_id]);
    if (!classroom) return res.status(404).json({ success: false, message: 'Classroom not found.' });

    if (!checkClassroomPermission(classroom, req.user)) {
      return res.status(403).json({ success: false, message: 'Only classroom teacher or admin can delete classroom.' });
    }

    await db.query('DELETE FROM classrooms WHERE id = $1', [classroom_id]);
    res.json({ success: true, message: 'Classroom deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get classroom stats (viewable by all enrolled users)
exports.getClassroomStats = async (req, res) => {
  try {
    const classroom_id = parseInt(req.params.id, 10);

    const classroom = await db.queryOne('SELECT * FROM classrooms WHERE id=$1', [classroom_id]);
    if (!classroom) return res.status(404).json({ success: false, message: 'Classroom not found.' });

    // Check if user has access (enrolled student, teacher, or admin)
    if (req.user.role === 'student') {
      const enrolled = await db.queryOne(
        'SELECT 1 FROM classroom_students WHERE classroom_id=$1 AND student_id=$2',
        [classroom_id, req.user.id]
      );
      if (!enrolled) return res.status(403).json({ success: false, message: 'Access denied.' });
    } else if (req.user.role === 'teacher' && classroom.teacher_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Get stats
    const [studentCount, announcementCount, resourceCount, attendanceStats] = await Promise.all([
      db.query(`SELECT COUNT(*)::int as count FROM classroom_students WHERE classroom_id=$1`, [classroom_id]).then(r => r[0].count),
      db.query(`SELECT COUNT(*)::int as count FROM classroom_announcements WHERE classroom_id=$1`, [classroom_id]).then(r => r[0].count),
      db.query(`SELECT COUNT(*)::int as count FROM classroom_resources WHERE classroom_id=$1`, [classroom_id]).then(r => r[0].count),
      db.query(`
        SELECT
          COUNT(*)::int as total_classes,
          COUNT(CASE WHEN status='present' THEN 1 END)::int as total_present,
          COUNT(CASE WHEN status='absent' THEN 1 END)::int as total_absent
        FROM classroom_attendance WHERE classroom_id=$1
      `, [classroom_id]).then(r => r[0])
    ]);

    const attendancePercentage = attendanceStats.total_classes > 0
      ? Math.round((attendanceStats.total_present / attendanceStats.total_classes) * 100)
      : 0;

    res.json({
      success: true,
      stats: {
        totalStudents: studentCount,
        totalAnnouncements: announcementCount,
        totalResources: resourceCount,
        totalClasses: attendanceStats.total_classes,
        totalPresent: attendanceStats.total_present,
        totalAbsent: attendanceStats.total_absent,
        attendancePercentage
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


