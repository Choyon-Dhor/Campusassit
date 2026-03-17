// ============================================================
// controllers/classroomController.js (pg)
// ============================================================
const classroomFinder = require('../utils/classroomFinder');
const routineParser   = require('../utils/routineParser');
const db   = require('../config/database');
const path = require('path');
const fs   = require('fs');

exports.getFreeRooms = async (req, res) => {
  try {
    const { day, time } = req.query;
    const result = await classroomFinder.getFreeRooms(day, time);
    res.json({ success: true, ...result });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getAllRooms = async (req, res) => {
  try {
    const rooms = await db.query(`SELECT * FROM rooms ORDER BY building, room_name`);
    res.json({ success: true, rooms });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getRoutine = async (req, res) => {
  try {
    const { day, department } = req.query;
    const params = [];
    let sql = `SELECT * FROM routine WHERE 1=1`;
    if (day)        { params.push(day);        sql += ` AND day        = $${params.length}`; }
    if (department) { params.push(department); sql += ` AND department = $${params.length}`; }
    sql += ` ORDER BY CASE day
      WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
      WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6
      WHEN 'Sunday' THEN 7 ELSE 8 END, start_time`;
    const routine = await db.query(sql, params);
    res.json({ success: true, routine });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getRoomSchedule = async (req, res) => {
  try {
    const result = await classroomFinder.getRoomDaySchedule(req.params.name, req.query.day);
    res.json({ success: true, ...result });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.uploadRoutine = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    let parsed;

    if (ext === '.csv') {
      parsed = await routineParser.parseCSV(filePath);
    } else {
      return res.status(400).json({ success: false, message: 'Only CSV files supported.' });
    }

    if (parsed.data.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid data found.', errors: parsed.errors });
    }

    if (req.body.replace === 'true' || req.body.replace === true) {
      await db.query(`DELETE FROM routine`);
    }

    let inserted = 0;
    for (const row of parsed.data) {
      try {
        await db.query(
          `INSERT INTO routine
             (day,time_slot,start_time,end_time,course_code,course_name,
              room_name,faculty_name,department,semester,batch)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          [row.day, row.time_slot, row.start_time, row.end_time,
           row.course_code, row.course_name, row.room_name,
           row.faculty_name || null, row.department || null,
           row.semester || null, row.batch || null]
        );
        inserted++;
      } catch (e) { parsed.errors.push(`Insert error: ${e.message}`); }
    }

    fs.unlink(filePath, () => {});
    res.json({ success: true, message: `Routine uploaded: ${inserted} records inserted.`, inserted, errors: parsed.errors });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.downloadTemplate = (req, res) => {
  const template = routineParser.generateTemplate();
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="routine_template.csv"');
  res.send(template);
};

exports.getTimeSlots = (req, res) => {
  res.json({ success: true, timeSlots: classroomFinder.getTimeSlots() });
};
