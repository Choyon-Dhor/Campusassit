const fs = require('fs');
const csv = require('csv-parser');
const db = require('../config/database');
const classroomFinder = require('../utils/classroomFinder');

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function parseBatch(raw) {
  const str = (raw || '').toString().trim().replace(/^\s*CSE[-\s]*/i, '').trim();
  if (!str) return { num: null, sec: '' };

  const match = str.match(/^(\d{1,3})(?:st|nd|rd|th)?/i);
  const num = match ? parseInt(match[1], 10) : null;
  const rest = match ? str.slice(match[0].length).trim() : str;
  const sec = rest.replace(/^[\[\(]+/, '').replace(/[\]\)]+$/, '').trim();

  return { num, sec };
}

exports.getAllRoutes = async (req, res, next) => {
  try {
    const { direction, search } = req.query;
    const params = [];
    let sql = `
      SELECT r.*, json_agg(s ORDER BY s.stop_order) AS stops
      FROM bus_routes r
      LEFT JOIN bus_stops s ON s.route_id = r.id
      WHERE r.is_active = TRUE`;

    if (direction) {
      params.push(direction);
      sql += ` AND r.direction = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (r.route_name ILIKE $${params.length} OR r.short_name ILIKE $${params.length})`;
    }
    sql += ` GROUP BY r.id ORDER BY r.departure_time ASC, r.direction`;

    const routes = await db.query(sql, params);
    res.json({ success: true, routes });
  } catch (err) {
    next(err);
  }
};

exports.getSchedule = async (_req, res, next) => {
  try {
    const rows = await db.query(`
      SELECT r.*, json_agg(s ORDER BY s.stop_order) AS stops
      FROM bus_routes r
      LEFT JOIN bus_stops s ON s.route_id = r.id
      WHERE r.is_active = TRUE
      GROUP BY r.id
      ORDER BY r.direction, r.departure_time ASC
    `);

    res.json({
      success: true,
      schedule: {
        to_campus: rows.filter((r) => r.direction === 'to_campus'),
        from_campus: rows.filter((r) => r.direction === 'from_campus'),
        shuttle: rows.filter((r) => r.direction === 'shuttle'),
      },
      total: rows.length,
    });
  } catch (err) {
    next(err);
  }
};

exports.uploadBusSchedule = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
    const { path: filePath } = req.file;
    const replace = req.body.replace === 'true' || req.body.replace === true;

    const routes = new Map();
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv({ mapHeaders: ({ header }) => header.trim().toLowerCase().replace(/\s+/g, '_') }))
        .on('data', (row) => {
          const clean = {};
          for (const [k, v] of Object.entries(row)) {
            clean[k.trim().toLowerCase().replace(/\s+/g, '_')] = typeof v === 'string' ? v.trim() : v;
          }

          const routeName = clean.route_name || clean.route || '';
          const shortName = clean.short_name || clean.route_short || '';
          const busNumber = clean.bus_number || clean.bus_no || '';
          const routeKey = `${routeName}||${shortName}||${busNumber}`;

          if (!routes.has(routeKey)) {
            routes.set(routeKey, {
              routeName,
              shortName,
              direction: (clean.direction || 'to_campus').toLowerCase().replace(/\s+/g, '_'),
              departure_time: clean.departure_time || clean.departure || null,
              arrival_time: clean.arrival_time || clean.arrival || null,
              bus_number: busNumber || null,
              driver_name: clean.driver_name || clean.driver || null,
              passenger_type: (clean.passenger_type || clean.passenger || 'student').toLowerCase(),
              route_type: clean.route_type || clean.type || null,
              schedule_note: clean.schedule_note || clean.notes || null,
              stops: [],
            });
          }

          const stopName = clean.stop_name || clean.stop || '';
          if (stopName) {
            routes.get(routeKey).stops.push({
              stop_name: stopName,
              pickup_time: clean.pickup_time || clean.stop_time || null,
              stop_order: clean.stop_order ? parseInt(clean.stop_order, 10) : null,
            });
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
    const validDirs = new Set(['to_campus', 'from_campus', 'shuttle']);
    const validPassengers = new Set(['student', 'teacher', 'both']);

    for (const r of routes.values()) {
      const created = await db.query(
        `INSERT INTO bus_routes
          (route_name, short_name, direction, departure_time, arrival_time, bus_number, driver_name, passenger_type, route_type, schedule_note)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         RETURNING id`,
        [
          r.routeName || null,
          r.shortName || null,
          validDirs.has(r.direction) ? r.direction : 'to_campus',
          r.departure_time,
          r.arrival_time,
          r.bus_number,
          r.driver_name,
          validPassengers.has(r.passenger_type) ? r.passenger_type : 'student',
          r.route_type,
          r.schedule_note,
        ]
      );

      const routeId = created[0]?.id;
      if (!routeId) continue;

      const stops = r.stops
        .map((s, idx) => ({ ...s, stop_order: Number.isFinite(s.stop_order) ? s.stop_order : idx + 1 }))
        .sort((a, b) => a.stop_order - b.stop_order);

      for (const s of stops) {
        await db.query(
          `INSERT INTO bus_stops (route_id, stop_name, stop_order, pickup_time) VALUES ($1,$2,$3,$4)`,
          [routeId, s.stop_name, s.stop_order, s.pickup_time]
        );
      }
      insertedRoutes.push({ ...r, stops });
    }

    fs.unlink(filePath, () => {});
    res.json({ success: true, message: `Imported ${insertedRoutes.length} routes.`, routes: insertedRoutes });
  } catch (err) {
    next(err);
  }
};

exports.getNextBuses = async (_req, res, next) => {
  try {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const rows = await db.query(
      `SELECT r.*, json_agg(s ORDER BY s.stop_order) AS stops
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
    next(err);
  }
};

exports.getBatchRoutine = async (req, res, next) => {
  const { batchNumber, section } = req.params;
  const { day } = req.query;
  const pattern = `%${[batchNumber, section].filter(Boolean).join('%')}%`;

  try {
    const params = [pattern];
    let sql = `SELECT * FROM routine WHERE batch ILIKE $1`;
    if (day) { params.push(day); sql += ` AND day = $${params.length}`; }
    sql += ` ORDER BY
      CASE day WHEN 'Sunday' THEN 1 WHEN 'Monday' THEN 2 WHEN 'Tuesday' THEN 3
               WHEN 'Wednesday' THEN 4 WHEN 'Thursday' THEN 5 ELSE 6 END,
      start_time ASC`;

    const routine = await db.query(sql, params);
    res.json({ success: true, routine, batch: `CSE-${batchNumber}${section || ''}` });
  } catch (err) {
    next(err);
  }
};

exports.getTodayClasses = async (req, res, next) => {
  const { batchNumber, section } = req.params;
  const today = DAYS[new Date().getDay()];
  const pattern = `%${[batchNumber, section].filter(Boolean).join('%')}%`;

  try {
    const rows = await db.query(
      `SELECT * FROM routine WHERE batch ILIKE $1 AND day = $2 ORDER BY start_time ASC`,
      [pattern, today]
    );
    res.json({ success: true, classes: rows, day: today });
  } catch (err) {
    next(err);
  }
};

exports.getBatchList = async (_req, res, next) => {
  try {
    const rows = await db.query(
      `SELECT DISTINCT batch FROM routine WHERE batch IS NOT NULL ORDER BY batch`
    );

    const seen = new Map();
    for (const { batch } of rows) {
      const { num, sec } = parseBatch(batch);
      const key = `${num || ''}||${sec}`;
      if (!seen.has(key)) {
        seen.set(key, { batch, batch_number: num, batch_section: sec });
      }
    }

    res.json({ success: true, batches: Array.from(seen.values()) });
  } catch (err) {
    next(err);
  }
};

exports.getFreeRooms = async (req, res, next) => {
  try {
    const { day, time } = req.query;
    const result = await classroomFinder.getFreeRooms(day, time);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};
