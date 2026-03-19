// ============================================================
// controllers/busController.js
// ============================================================
const db = require('../config/database');
const csv = require('csv-parser');
const fs = require('fs');

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

// POST /api/bus/schedule/upload  — upload CSV schedule (admin only)
exports.uploadBusSchedule = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
    const filePath = req.file.path;
    const replace = req.body.replace === 'true' || req.body.replace === true;

    // Parse CSV rows
    const routes = new Map();
    let rowIndex = 0;

    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv({ mapHeaders: ({ header }) => header.trim().toLowerCase().replace(/\s+/g, '_') }))
        .on('data', (row) => {
          rowIndex += 1;
          const clean = {};
          for (const [k, v] of Object.entries(row)) {
            clean[k.trim().toLowerCase().replace(/\s+/g, '_')] = typeof v === 'string' ? v.trim() : v;
          }

          const routeName = clean.route_name || clean.route || '';
          const shortName = clean.short_name || clean.route_short || '';
          const direction = (clean.direction || 'to_campus').toLowerCase().replace(/\s+/g, '_');
          const departure_time = clean.departure_time || clean.departure || '';
          const arrival_time = clean.arrival_time || clean.arrival || '';
          const bus_number = clean.bus_number || clean.bus_no || '';
          const driver_name = clean.driver_name || clean.driver || '';
          const passenger_type = (clean.passenger_type || clean.passenger || 'student').toLowerCase();
          const route_type = clean.route_type || clean.type || '';
          const schedule_note = clean.schedule_note || clean.notes || '';

          const stopName = clean.stop_name || clean.stop || '';
          const pickup_time = clean.pickup_time || clean.stop_time || '';
          const stop_order = clean.stop_order ? parseInt(clean.stop_order, 10) : null;

          const routeKey = `${routeName}||${shortName}||${bus_number}`;
          if (!routes.has(routeKey)) {
            routes.set(routeKey, {
              routeName,
              shortName,
              direction,
              departure_time,
              arrival_time,
              bus_number,
              driver_name,
              passenger_type,
              route_type,
              schedule_note,
              stops: [],
            });
          }

          const entry = routes.get(routeKey);
          if (stopName) {
            entry.stops.push({ stop_name: stopName, pickup_time, stop_order });
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    if (replace) {
      await db.query('DELETE FROM bus_stops');
      await db.query('DELETE FROM bus_routes');
    }

    const insertedRoutes = [];
    for (const route of routes.values()) {
      const created = await db.query(
        `INSERT INTO bus_routes
          (route_name, short_name, direction, departure_time, arrival_time, bus_number, driver_name, passenger_type, route_type, schedule_note)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         RETURNING id`,
        [
          route.routeName || null,
          route.shortName || null,
          ['to_campus','from_campus','shuttle'].includes(route.direction) ? route.direction : 'to_campus',
          route.departure_time || null,
          route.arrival_time || null,
          route.bus_number || null,
          route.driver_name || null,
          ['student','teacher','both'].includes(route.passenger_type) ? route.passenger_type : 'student',
          route.route_type || null,
          route.schedule_note || null,
        ]
      );
      const routeId = created[0]?.id;
      if (!routeId) continue;

      // Sort stops by stop_order if provided, else by entry order
      const stops = route.stops
        .map((s, idx) => ({
          stop_name: s.stop_name,
          pickup_time: s.pickup_time || null,
          stop_order: Number.isFinite(s.stop_order) ? s.stop_order : idx + 1,
        }))
        .sort((a, b) => (a.stop_order || 0) - (b.stop_order || 0));

      for (const stop of stops) {
        await db.query(
          `INSERT INTO bus_stops (route_id, stop_name, stop_order, pickup_time)
           VALUES ($1,$2,$3,$4)`,
          [routeId, stop.stop_name, stop.stop_order, stop.pickup_time || null]
        );
      }

      insertedRoutes.push({ ...route, stops });
    }

    // Remove uploaded file
    fs.unlink(filePath, () => {});

    res.json({ success: true, message: `Imported ${insertedRoutes.length} routes.`, routes: insertedRoutes });
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

// Helper: parse batch string saved in routine.batch into number + section
function parseBatchString(raw) {
  const cleaned = (raw || '').toString().trim();
  if (!cleaned) return { batch_number: null, batch_section: '' };

  // Remove common prefix variations like "CSE-" or "CSE "
  let str = cleaned.replace(/^\s*CSE[-\s]*/i, '').trim();

  // Extract leading digits (e.g. "58" from "58[C+G]" or "58th")
  const numMatch = str.match(/^(\d{1,3})(?:st|nd|rd|th)?/i);
  const batch_number = numMatch ? parseInt(numMatch[1], 10) : null;

  // Remove the batch number and any separators
  if (batch_number !== null) {
    str = str.slice(numMatch[0].length).trim();
  }

  // Strip surrounding brackets/parentheses
  str = str.replace(/^[\[\(]+/, '').replace(/[\]\)]+$/, '').trim();

  return {
    batch_number,
    batch_section: str || '',
  };
}

// Build a SQL LIKE pattern for matching batch strings.
function buildBatchMatchPattern(batchNumber, section) {
  const parts = [];
  if (batchNumber) parts.push(batchNumber.toString());
  if (section) parts.push(section.toString());
  if (parts.length === 0) return '%';
  return `%${parts.join('%')}%`;
}

// GET /api/routine/batch/:batchNumber/:section  — batch-specific routine
exports.getBatchRoutine = async (req, res) => {
  const { batchNumber, section } = req.params;
  const { day } = req.query;
  const batchPattern = buildBatchMatchPattern(batchNumber, section);

  // Try using the newer schema (batch text column).
  try {
    const params = [batchPattern];
    let sql = `
      SELECT * FROM routine
      WHERE batch ILIKE $1`;

    if (day) { params.push(day); sql += ` AND day = $${params.length}`; }
    sql += ` ORDER BY
      CASE day WHEN 'Sunday' THEN 1 WHEN 'Monday' THEN 2 WHEN 'Tuesday' THEN 3
               WHEN 'Wednesday' THEN 4 WHEN 'Thursday' THEN 5 ELSE 6 END,
      start_time ASC`;

    const routine = await db.query(sql, params);
    return res.json({ success: true, routine, batch: `CSE-${batchNumber}${section}` });
  } catch (err) {
    // If the schema uses batch_number/batch_section instead, fall back.
    if (err.message && err.message.toLowerCase().includes('column "batch"')) {
      try {
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
        return res.json({ success: true, routine, batch: `CSE-${batchNumber}${section}` });
      } catch (err2) {
        return res.status(500).json({ success: false, message: err2.message });
      }
    }

    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/routine/today/:batchNumber/:section  — today's classes
exports.getTodayClasses = async (req, res) => {
  const { batchNumber, section } = req.params;
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const today = days[new Date().getDay()];
  const batchPattern = buildBatchMatchPattern(batchNumber, section);

  try {
    const rows = await db.query(`
      SELECT * FROM routine
      WHERE batch ILIKE $1 AND day = $2
      ORDER BY start_time ASC`,
      [batchPattern, today]
    );
    return res.json({ success: true, classes: rows, day: today });
  } catch (err) {
    if (err.message && err.message.toLowerCase().includes('column "batch"')) {
      try {
        const rows = await db.query(`
          SELECT * FROM routine
          WHERE batch_number = $1 AND batch_section = $2 AND day = $3
          ORDER BY start_time ASC`,
          [parseInt(batchNumber), section, today]
        );
        return res.json({ success: true, classes: rows, day: today });
      } catch (err2) {
        return res.status(500).json({ success: false, message: err2.message });
      }
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/routine/batches  — list all batch-sections
exports.getBatchList = async (req, res) => {
  try {
    const rows = await db.query(`
      SELECT DISTINCT batch
      FROM routine
      WHERE batch IS NOT NULL
      ORDER BY batch`
    );

    const seen = new Map();
    for (const { batch } of rows) {
      const parsed = parseBatchString(batch);
      const key = `${parsed.batch_number || ''}||${parsed.batch_section || ''}`;
      if (!seen.has(key)) {
        seen.set(key, {
          batch,
          batch_number: parsed.batch_number,
          batch_section: parsed.batch_section,
        });
      }
    }

    return res.json({ success: true, batches: Array.from(seen.values()) });
  } catch (err) {
    // If the schema uses batch_number/batch_section columns instead of batch text
    if (err.message && err.message.toLowerCase().includes('column "batch"')) {
      try {
        const rows = await db.query(`
          SELECT DISTINCT batch_number, batch_section
          FROM routine
          WHERE batch_number IS NOT NULL
          ORDER BY batch_number, batch_section`
        );

        const batches = rows.map(r => ({
          batch: `CSE-${r.batch_number}${r.batch_section ? `[${r.batch_section}]` : ''}`,
          batch_number: r.batch_number,
          batch_section: r.batch_section,
        }));

        return res.json({ success: true, batches });
      } catch (err2) {
        return res.status(500).json({ success: false, message: err2.message });
      }
    }

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
