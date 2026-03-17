// ============================================================
// controllers/busController.js
// ============================================================
const db = require('../config/database');

// GET /api/bus/routes  — all active routes with stops
exports.getAllRoutes = async (req, res) => {
  try {
    const { direction, search } = req.query;
    const params = [];
    let sql = `
      SELECT r.*,
             json_agg(s ORDER BY s.stop_order) AS stops
      FROM bus_routes r
      LEFT JOIN bus_stops s ON s.route_id = r.id
      WHERE r.is_active = TRUE`;

    if (direction) { params.push(direction); sql += ` AND r.direction = $${params.length}`; }
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (r.route_name ILIKE $${params.length} OR r.short_name ILIKE $${params.length})`;
    }
    sql += ` GROUP BY r.id ORDER BY r.departure_time ASC, r.direction`;

    const routes = await db.query(sql, params);
    res.json({ success: true, routes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/bus/schedule  — grouped by direction for timeline view
exports.getSchedule = async (req, res) => {
  try {
    const rows = await db.query(`
      SELECT r.*,
             json_agg(s ORDER BY s.stop_order) AS stops
      FROM bus_routes r
      LEFT JOIN bus_stops s ON s.route_id = r.id
      WHERE r.is_active = TRUE
      GROUP BY r.id
      ORDER BY r.direction, r.departure_time ASC
    `);

    const grouped = {
      to_campus:    rows.filter(r => r.direction === 'to_campus'),
      from_campus:  rows.filter(r => r.direction === 'from_campus'),
      shuttle:      rows.filter(r => r.direction === 'shuttle'),
    };
    res.json({ success: true, schedule: grouped, total: rows.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/bus/next  — next buses from campus within 2 hours
exports.getNextBuses = async (req, res) => {
  try {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const rows = await db.query(`
      SELECT r.*, json_agg(s ORDER BY s.stop_order) AS stops
      FROM bus_routes r
      LEFT JOIN bus_stops s ON s.route_id = r.id
      WHERE r.is_active = TRUE
        AND r.departure_time >= $1::time
        AND r.departure_time <= ($1::time + INTERVAL '2 hours')
      GROUP BY r.id
      ORDER BY r.departure_time ASC
      LIMIT 5`,
      [timeStr]
    );
    res.json({ success: true, nextBuses: rows, currentTime: timeStr });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// controllers/batchRoutineController.js
// ============================================================
const classroomFinder = require('../utils/classroomFinder');

// GET /api/routine/batch/:batchNumber/:section  — batch-specific routine
exports.getBatchRoutine = async (req, res) => {
  try {
    const { batchNumber, section } = req.params;
    const { day } = req.query;
    const params = [parseInt(batchNumber), section];
    let sql = `
      SELECT * FROM routine
      WHERE batch_number = $1 AND batch_section = $2`;

    if (day) { params.push(day); sql += ` AND day = $${params.length}`; }
    sql += ` ORDER BY
      CASE day WHEN 'Sunday' THEN 1 WHEN 'Monday' THEN 2 WHEN 'Tuesday' THEN 3
               WHEN 'Wednesday' THEN 4 WHEN 'Thursday' THEN 5 ELSE 6 END,
      start_time ASC`;

    const routine = await db.query(sql, params);
    res.json({ success: true, routine, batch: `CSE-${batchNumber}${section}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/routine/today/:batchNumber/:section  — today's classes
exports.getTodayClasses = async (req, res) => {
  try {
    const { batchNumber, section } = req.params;
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const today = days[new Date().getDay()];

    const rows = await db.query(`
      SELECT * FROM routine
      WHERE batch_number = $1 AND batch_section = $2 AND day = $3
      ORDER BY start_time ASC`,
      [parseInt(batchNumber), section, today]
    );
    res.json({ success: true, classes: rows, day: today });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/routine/batches  — list all batch-sections
exports.getBatchList = async (req, res) => {
  try {
    const rows = await db.query(`
      SELECT DISTINCT batch_number, batch_section
      FROM routine
      WHERE batch_number IS NOT NULL
      ORDER BY batch_number, batch_section`
    );
    res.json({ success: true, batches: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/routine/free-rooms  — re-export for new route prefix
exports.getFreeRooms = async (req, res) => {
  try {
    const { day, time } = req.query;
    const result = await classroomFinder.getFreeRooms(day, time);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
