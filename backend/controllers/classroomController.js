const path = require('path');
const fs = require('fs');
const classroomFinder = require('../utils/classroomFinder');
const routineParser = require('../utils/routineParser');
const db = require('../config/database');

function parseBatch(raw) {
  const str = (raw || '').toString().trim().replace(/^\s*CSE[-\s]*/i, '').trim();
  if (!str) return { num: null, sec: '' };

  const match = str.match(/^(\d{1,3})(?:st|nd|rd|th)?/i);
  const num = match ? parseInt(match[1], 10) : null;
  const rest = match ? str.slice(match[0].length).trim() : str;
  const sec = rest.replace(/^[\[\(]+/, '').replace(/[\]\)]+$/, '').trim();

  return { num, sec };
}

exports.getFreeRooms = async (req, res, next) => {
  try {
    const { day, time } = req.query;
    const result = await classroomFinder.getFreeRooms(day, time);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

exports.getAllRooms = async (_req, res, next) => {
  try {
    const rooms = await db.query(`SELECT * FROM rooms ORDER BY building, room_name`);
    res.json({ success: true, rooms });
  } catch (err) {
    next(err);
  }
};

exports.getRoutine = async (req, res, next) => {
  try {
    const { day, department } = req.query;
    const params = [];
    let sql = `SELECT * FROM routine WHERE 1=1`;
    if (day) { params.push(day); sql += ` AND day = $${params.length}`; }
    if (department) { params.push(department); sql += ` AND department = $${params.length}`; }
    sql += ` ORDER BY CASE day
      WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
      WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6
      WHEN 'Sunday' THEN 7 ELSE 8 END, start_time`;

    const routine = await db.query(sql, params);
    res.json({ success: true, routine });
  } catch (err) {
    next(err);
  }
};

exports.getRoomSchedule = async (req, res, next) => {
  try {
    const result = await classroomFinder.getRoomDaySchedule(req.params.name, req.query.day);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

exports.uploadRoutine = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();

    if (ext !== '.csv') {
      return res.status(400).json({ success: false, message: 'Only CSV files supported.' });
    }

    const parsed = await routineParser.parseCSV(filePath);
    if (!parsed.data.length) {
      return res.status(400).json({ success: false, message: 'No valid data found.', errors: parsed.errors });
    }

    if (req.body.replace === 'true' || req.body.replace === true) {
      await db.query(`DELETE FROM routine`);
    }

    const cols = await db.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'routine' AND column_name IN ('batch', 'batch_number', 'batch_section')
    `);
    const colNames = new Set(cols.map((c) => c.column_name));
    const useSplitBatch = !colNames.has('batch') && colNames.has('batch_number') && colNames.has('batch_section');

    let inserted = 0;
    for (const r of parsed.data) {
      try {
        if (useSplitBatch) {
          const { num, sec } = parseBatch(r.batch);
          await db.query(
            `INSERT INTO routine
               (day, time_slot, start_time, end_time, course_code, course_name,
                room_name, faculty_name, department, semester, batch_number, batch_section)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
            [r.day, r.time_slot, r.start_time, r.end_time, r.course_code, r.course_name,
             r.room_name, r.faculty_name || null, r.department || null, r.semester || null, num, sec]
          );
        } else {
          await db.query(
            `INSERT INTO routine
               (day, time_slot, start_time, end_time, course_code, course_name,
                room_name, faculty_name, department, semester, batch)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
            [r.day, r.time_slot, r.start_time, r.end_time, r.course_code, r.course_name,
             r.room_name, r.faculty_name || null, r.department || null, r.semester || null, r.batch || null]
          );
        }
        inserted++;
      } catch (e) {
        parsed.errors.push(`Insert error: ${e.message}`);
      }
    }

    fs.unlink(filePath, () => {});
    res.json({
      success: true,
      message: `Routine uploaded: ${inserted} records inserted.`,
      inserted,
      errors: parsed.errors,
    });
  } catch (err) {
    next(err);
  }
};

exports.downloadTemplate = (_req, res) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="routine_template.csv"');
  res.send(routineParser.generateTemplate());
};

exports.getTimeSlots = (_req, res) => {
  res.json({ success: true, timeSlots: classroomFinder.getTimeSlots() });
};
