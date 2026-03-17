// ============================================================
// controllers/resultController.js
// ============================================================
const db = require('../config/database');

// ── GET /api/results/me  — logged-in student's own results ──
exports.getMyResults = async (req, res) => {
  try {
    // Try matching by student_number stored in their profile,
    // fallback to student_id
    const user = req.user;
    const rows = await db.query(
      `SELECT * FROM results
       WHERE (student_id = $1 OR student_number = $2)
         AND is_published = TRUE
       ORDER BY semester_code ASC, course_code ASC`,
      [user.id, user.student_number || '']
    );

    const summary = computeSummary(rows);
    res.json({ success: true, results: rows, summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/results/:studentNumber  — admin/faculty lookup ──
exports.getByStudentNumber = async (req, res) => {
  try {
    const { studentNumber } = req.params;
    const rows = await db.query(
      `SELECT * FROM results
       WHERE student_number = $1 AND is_published = TRUE
       ORDER BY semester_code ASC, course_code ASC`,
      [studentNumber]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No published results found.' });
    }
    const summary = computeSummary(rows);
    res.json({ success: true, results: rows, summary, studentNumber });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/results/upload  — faculty uploads results ──────
exports.uploadResult = async (req, res) => {
  try {
    const {
      student_number, semester_code, semester_name,
      course_code, course_title, credit_hours,
      batch_section, letter_grade, grade_point,
      status = 'Regular'
    } = req.body;

    if (!student_number || !semester_code || !course_code || !letter_grade) {
      return res.status(400).json({ success: false, message: 'student_number, semester_code, course_code and letter_grade are required.' });
    }

    // Find student user if exists
    const studentUser = await db.queryOne(
      `SELECT id FROM users WHERE role = 'student' LIMIT 1`
    );

    // Upsert
    const existing = await db.queryOne(
      `SELECT id FROM results WHERE student_number=$1 AND semester_code=$2 AND course_code=$3`,
      [student_number, semester_code, course_code]
    );

    let result;
    if (existing) {
      const rows = await db.query(
        `UPDATE results SET letter_grade=$1, grade_point=$2, updated_at=NOW()
         WHERE id=$3 RETURNING *`,
        [letter_grade, grade_point, existing.id]
      );
      result = rows[0];
    } else {
      const rows = await db.query(
        `INSERT INTO results
           (student_number, semester_code, semester_name, course_code, course_title,
            credit_hours, batch_section, letter_grade, grade_point, status, uploaded_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
        [student_number, semester_code, semester_name, course_code, course_title,
         credit_hours, batch_section, letter_grade, grade_point, status, req.user.id]
      );
      result = rows[0];
    }
    res.status(201).json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/results/:id/publish  — admin publishes ────────
exports.publishResult = async (req, res) => {
  try {
    const rows = await db.query(
      `UPDATE results SET is_published=TRUE, publish_date=NOW()
       WHERE id=$1 RETURNING *`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Not found.' });
    res.json({ success: true, result: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/results/semesters  — semester list for dropdown ─
exports.getSemesters = async (req, res) => {
  try {
    const rows = await db.query(
      `SELECT DISTINCT semester_code, semester_name
       FROM results WHERE is_published=TRUE
       ORDER BY semester_code ASC`
    );
    res.json({ success: true, semesters: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── CGPA & summary helper ──────────────────────────────────
function computeSummary(rows) {
  if (rows.length === 0) return { cgpa: 0, totalCredits: 0, totalSemesters: 0, semesters: {} };

  let totalPoints = 0, totalCredits = 0;
  const semesterMap = {};

  for (const r of rows) {
    const ch  = parseFloat(r.credit_hours);
    const gp  = parseFloat(r.grade_point || 0);
    totalPoints  += ch * gp;
    totalCredits += ch;

    if (!semesterMap[r.semester_code]) {
      semesterMap[r.semester_code] = {
        code: r.semester_code,
        name: r.semester_name,
        courses: [],
        semesterCredits: 0,
        semesterPoints: 0,
      };
    }
    semesterMap[r.semester_code].courses.push(r);
    semesterMap[r.semester_code].semesterCredits += ch;
    semesterMap[r.semester_code].semesterPoints  += ch * gp;
  }

  // Per-semester GPA
  for (const sem of Object.values(semesterMap)) {
    sem.gpa = sem.semesterCredits > 0
      ? parseFloat((sem.semesterPoints / sem.semesterCredits).toFixed(2))
      : 0;
  }

  const cgpa = totalCredits > 0
    ? parseFloat((totalPoints / totalCredits).toFixed(2))
    : 0;

  return {
    cgpa,
    totalCredits: parseFloat(totalCredits.toFixed(1)),
    totalSemesters: Object.keys(semesterMap).length,
    semesters: semesterMap,
  };
}
