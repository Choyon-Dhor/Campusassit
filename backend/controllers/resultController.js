// ============================================================
// controllers/resultController.js  (full rewrite)
// ============================================================
const db = require('../config/database');

// ── helpers ──────────────────────────────────────────────────
function computeSummary(rows) {
  if (!rows.length) return { cgpa: 0, totalCredits: 0, totalSemesters: 0, semesters: {} };
  let totalPoints = 0, totalCredits = 0;
  const semMap = {};

  for (const r of rows) {
    const ch = parseFloat(r.credit_hours);
    const gp = parseFloat(r.grade_point || 0);
    totalPoints  += ch * gp;
    totalCredits += ch;
    if (!semMap[r.semester_code]) {
      semMap[r.semester_code] = { code: r.semester_code, name: r.semester_name,
        courses: [], semesterCredits: 0, semesterPoints: 0 };
    }
    semMap[r.semester_code].courses.push(r);
    semMap[r.semester_code].semesterCredits += ch;
    semMap[r.semester_code].semesterPoints  += ch * gp;
  }
  for (const s of Object.values(semMap)) {
    s.gpa = s.semesterCredits > 0
      ? parseFloat((s.semesterPoints / s.semesterCredits).toFixed(2)) : 0;
  }
  return {
    cgpa: totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(2)) : 0,
    totalCredits: parseFloat(totalCredits.toFixed(1)),
    totalSemesters: Object.keys(semMap).length,
    semesters: semMap,
  };
}

// ── GET /api/results/me ───────────────────────────────────────
exports.getMyResults = async (req, res) => {
  try {
    const rows = await db.query(
      `SELECT * FROM results
       WHERE (student_id = $1 OR student_number = $2) AND is_published = TRUE
       ORDER BY semester_code ASC, course_code ASC`,
      [req.user.id, req.user.student_number || '']
    );
    res.json({ success: true, results: rows, summary: computeSummary(rows) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── GET /api/results/student/:studentNumber  (teacher/admin) ──
exports.getByStudentNumber = async (req, res) => {
  try {
    const { studentNumber } = req.params;
    const { includeUnpublished } = req.query;
    let sql = `SELECT * FROM results WHERE student_number = $1`;
    if (!includeUnpublished || req.user.role === 'student') sql += ` AND is_published = TRUE`;
    sql += ` ORDER BY semester_code ASC, course_code ASC`;

    const rows = await db.query(sql, [studentNumber]);

    // Also get student profile if exists
    const student = await db.queryOne(
      `SELECT id, name, email, department, batch_number, batch_section, student_number
       FROM users WHERE student_number = $1`, [studentNumber]
    );

    if (!rows.length && !student) {
      return res.status(404).json({ success: false, message: 'No data found for this student ID.' });
    }
    res.json({ success: true, results: rows, summary: computeSummary(rows), student, studentNumber });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── GET /api/results/semesters ────────────────────────────────
exports.getSemesters = async (req, res) => {
  try {
    const rows = await db.query(
      `SELECT DISTINCT semester_code, semester_name FROM results
       WHERE is_published = TRUE ORDER BY semester_code ASC`
    );
    res.json({ success: true, semesters: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── POST /api/results/upload  single row ─────────────────────
exports.uploadResult = async (req, res) => {
  try {
    const {
      student_number, semester_code, semester_name,
      course_code, course_title, credit_hours,
      batch_section, letter_grade, grade_point,
      status = 'Regular', is_published = false,
    } = req.body;

    if (!student_number || !semester_code || !course_code || !letter_grade) {
      return res.status(400).json({ success: false, message: 'student_number, semester_code, course_code, letter_grade required.' });
    }

    // Link to user account if exists
    const student = await db.queryOne(
      `SELECT id FROM users WHERE student_number = $1`, [student_number]
    );

    const existing = await db.queryOne(
      `SELECT id FROM results WHERE student_number=$1 AND semester_code=$2 AND course_code=$3`,
      [student_number, semester_code, course_code]
    );

    let result;
    if (existing) {
      const rows = await db.query(
        `UPDATE results
         SET letter_grade=$1, grade_point=$2, course_title=$3,
             credit_hours=$4, batch_section=$5, status=$6, updated_at=NOW()
         WHERE id=$7 RETURNING *`,
        [letter_grade, grade_point, course_title, credit_hours, batch_section, status, existing.id]
      );
      result = rows[0];
    } else {
      const rows = await db.query(
        `INSERT INTO results
           (student_id, student_number, semester_code, semester_name, course_code,
            course_title, credit_hours, batch_section, letter_grade, grade_point,
            status, is_published, uploaded_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
        [student?.id || null, student_number, semester_code, semester_name,
         course_code, course_title, credit_hours, batch_section,
         letter_grade, grade_point, status, is_published, req.user.id]
      );
      result = rows[0];
    }
    res.status(201).json({ success: true, result });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── POST /api/results/bulk-save  (spreadsheet save) ──────────
exports.bulkSave = async (req, res) => {
  try {
    const { student_number, semester_code, semester_name, rows: resultRows } = req.body;

    if (!student_number || !semester_code || !resultRows?.length) {
      return res.status(400).json({ success: false, message: 'student_number, semester_code, and rows are required.' });
    }

    // Validate all rows have required fields
    for (let i = 0; i < resultRows.length; i++) {
      const r = resultRows[i];
      if (!r.course_code || !r.course_title || !r.credit_hours || !r.letter_grade) {
        return res.status(400).json({
          success: false,
          message: `Row ${i + 1}: course_code, course_title, credit_hours, and letter_grade are required.`
        });
      }
    }

    const student = await db.queryOne(
      `SELECT id FROM users WHERE student_number = $1`, [student_number]
    );

    const saved = [];
    for (const row of resultRows) {
      const gp = gradeToPoint(row.letter_grade);
      const existing = await db.queryOne(
        `SELECT id FROM results WHERE student_number=$1 AND semester_code=$2 AND course_code=$3`,
        [student_number, semester_code, row.course_code]
      );

      if (existing) {
        const updated = await db.query(
          `UPDATE results
           SET letter_grade=$1, grade_point=$2, course_title=$3,
               credit_hours=$4, batch_section=$5, status=$6,
               semester_name=$7, updated_at=NOW()
           WHERE id=$8 RETURNING *`,
          [row.letter_grade, gp, row.course_title, row.credit_hours,
           row.batch_section || null, row.status || 'Regular',
           semester_name, existing.id]
        );
        saved.push(updated[0]);
      } else {
        const inserted = await db.query(
          `INSERT INTO results
             (student_id, student_number, semester_code, semester_name, course_code,
              course_title, credit_hours, batch_section, letter_grade, grade_point,
              status, is_published, uploaded_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,FALSE,$12) RETURNING *`,
          [student?.id || null, student_number, semester_code, semester_name,
           row.course_code, row.course_title, row.credit_hours,
           row.batch_section || null, row.letter_grade, gp,
           row.status || 'Regular', req.user.id]
        );
        saved.push(inserted[0]);
      }
    }

    const summary = computeSummary(saved);
    res.json({ success: true, saved: saved.length, rows: saved, cgpa: summary.cgpa });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── PUT /api/results/:id  edit single row ─────────────────────
exports.updateResult = async (req, res) => {
  try {
    const { letter_grade, grade_point, course_title, credit_hours, status } = req.body;
    const gp = grade_point ?? gradeToPoint(letter_grade);
    const rows = await db.query(
      `UPDATE results
       SET letter_grade=$1, grade_point=$2, course_title=$3,
           credit_hours=$4, status=$5, updated_at=NOW()
       WHERE id=$6 RETURNING *`,
      [letter_grade, gp, course_title, credit_hours, status || 'Regular', req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Result not found.' });
    res.json({ success: true, result: rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── DELETE /api/results/:id ───────────────────────────────────
exports.deleteResult = async (req, res) => {
  try {
    await db.query(`DELETE FROM results WHERE id = $1`, [req.params.id]);
    res.json({ success: true, message: 'Deleted.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── PATCH /api/results/:id/publish ───────────────────────────
exports.publishResult = async (req, res) => {
  try {
    const rows = await db.query(
      `UPDATE results SET is_published=TRUE, publish_date=NOW()
       WHERE id=$1 RETURNING *`, [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found.' });
    res.json({ success: true, result: rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── PATCH /api/results/publish-semester  publish entire semester ─
exports.publishSemester = async (req, res) => {
  try {
    const { student_number, semester_code } = req.body;
    if (!student_number || !semester_code)
      return res.status(400).json({ success: false, message: 'student_number and semester_code required.' });
    const result = await db.query(
      `UPDATE results SET is_published=TRUE, publish_date=NOW()
       WHERE student_number=$1 AND semester_code=$2 AND is_published=FALSE
       RETURNING id`,
      [student_number, semester_code]
    );
    res.json({ success: true, published: result.length, message: `Published ${result.length} results.` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── GET /api/results/students  list all students with results ─
exports.getStudentList = async (req, res) => {
  try {
    const { search } = req.query;
    const params = [];
    let sql = `
      SELECT
        u.id, u.name, u.email, u.student_number,
        u.batch_number, u.batch_section, u.department,
        COUNT(r.id)::int AS result_count,
        ROUND(
          SUM(r.credit_hours * r.grade_point) / NULLIF(SUM(r.credit_hours), 0), 2
        ) AS cgpa
      FROM users u
      LEFT JOIN results r
        ON r.student_number = u.student_number AND r.is_published = TRUE
      WHERE u.role = 'student' AND u.student_number IS NOT NULL`;

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (u.name ILIKE $1 OR u.student_number ILIKE $1 OR u.email ILIKE $1)`;
    }
    sql += `
      GROUP BY u.id, u.name, u.email, u.student_number,
               u.batch_number, u.batch_section, u.department
      ORDER BY u.student_number ASC`;

    const students = await db.query(sql, params);
    res.json({ success: true, students });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── grade → grade point helper ────────────────────────────────
function gradeToPoint(grade) {
  const map = {
    'A+': 4.00, 'A': 3.75, 'A-': 3.50,
    'B+': 3.25, 'B': 3.00, 'B-': 2.75,
    'C+': 2.50, 'C': 2.25, 'C-': 2.00,
    'D+': 1.75, 'D': 1.50, 'F': 0.00,
  };
  return map[grade?.trim()] ?? 0.00;
}

// ── POST /api/results/import-csv  upload a CSV of results for one class ──
exports.importCSV = async (req, res) => {
  try {
    const { semester_code, semester_name } = req.body;
    if (!req.file) return res.status(400).json({ success: false, message: 'CSV file required.' });
    if (!semester_code || !semester_name)
      return res.status(400).json({ success: false, message: 'semester_code and semester_name required.' });

    const csv = require('csv-parser');
    const fs  = require('fs');
    const rows = [];
    const errors = [];

    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv({ mapHeaders: ({ header }) => header.trim().toLowerCase().replace(/\s+/g,'_') }))
        .on('data', (row) => rows.push(row))
        .on('end', resolve)
        .on('error', reject);
    });
    fs.unlinkSync(req.file.path);

    let saved = 0;
    for (const row of rows) {
      const studentNumber = (row.student_number || row.student_id || '').trim();
      const courseCode    = (row.course_code || '').trim();
      const letterGrade   = (row.letter_grade || row.grade || '').trim();
      const courseTitle   = (row.course_title || row.title || '').trim();
      const creditHours   = parseFloat(row.credit_hours || row.ch || 3);
      const batchSection  = (row.batch_section || row.batch || '').trim();

      if (!studentNumber || !courseCode || !letterGrade) {
        errors.push(`Skipped row: missing student_number, course_code or letter_grade`);
        continue;
      }

      const gp = gradeToPoint(letterGrade);
      const student = await db.queryOne(`SELECT id FROM users WHERE student_number = $1`, [studentNumber]);
      const existing = await db.queryOne(
        `SELECT id FROM results WHERE student_number=$1 AND semester_code=$2 AND course_code=$3`,
        [studentNumber, semester_code, courseCode]
      );

      if (existing) {
        await db.query(
          `UPDATE results SET letter_grade=$1, grade_point=$2, batch_section=$3, updated_at=NOW() WHERE id=$4`,
          [letterGrade, gp, batchSection||null, existing.id]
        );
      } else {
        await db.query(
          `INSERT INTO results (student_id,student_number,semester_code,semester_name,course_code,
            course_title,credit_hours,batch_section,letter_grade,grade_point,is_published,uploaded_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,FALSE,$11)`,
          [student?.id||null, studentNumber, semester_code, semester_name,
           courseCode, courseTitle, creditHours, batchSection||null,
           letterGrade, gp, req.user.id]
        );
      }
      saved++;
    }

    res.json({ success: true, message: `Imported ${saved} result rows.`, saved, errors });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
