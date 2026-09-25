// ============================================================
// database/seed_user_bus_schedule.js
// Seeds the user's Metropolitan University Bus Schedule
// Run: node database/seed_user_bus_schedule.js
// ============================================================
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../config/database');

const rawBusData = [
  { route: 'Medina Market to Campus', time: '08:10 AM', bus: '11-0018', stops: 'Medina Market, Subid Bazar, Rikabibazar, Chowhatta, Kumarpara, Shahi Eidgah, Tilagarh, Campus' },
  { route: 'Campus to Pathantula', time: '04:00 PM', bus: '11-0018', stops: 'Campus, Shahi Eidgah, Kumarpara, Chowhatta, Rikabibazar, Subid Bazar, Pathantula' },
  { route: 'Temukhi to Campus', time: '08:05 AM', bus: '11-0944', stops: 'Temukhi, Medina Market, Subid Bazar, Amberkhana, Shahi Eidgah, Tilagarh, Campus' },
  { route: 'Pathantula to Campus', time: '08:10 AM', bus: '11-1055', stops: 'Pathantula, Subid Bazar, Amberkhana, Shahi Eidgah, Tilagarh, Campus' },
  { route: 'Rikabibazar to Campus', time: '08:10 AM', bus: '11-0900', stops: 'Rikabibazar, Kumarpara, Shahi Eidgah, Tilagarh, Campus' },
  { route: 'Rikabibazar to Campus', time: '08:10 AM', bus: '11-0967', stops: 'Rikabibazar, Chowhatta, Kumarpara, Naiorpul, Tilagarh, Campus' },
  { route: 'Shrirampur Bypass to Campus', time: '08:00 AM', bus: '11-1054', stops: 'Shrirampur Bypass, Surma Gate Bypass, Campus' },
  { route: 'Campus to Surma Gate Bypass', time: '06:05 PM', bus: '11-0010', stops: 'Campus, Surma Gate Bypass, Shrirampur Bypass' },
  { route: 'Kajir Bazar to Campus', time: '08:10 AM', bus: 'BRTC', stops: 'Kajir Bazar, Rikabibazar, Chowhatta, Kumarpara, Naiorpul, Tilagarh, Campus' },
  { route: 'Rikabibazar to Campus', time: '08:10 AM', bus: 'BRTC', stops: 'Rikabibazar, Chowhatta, Kumarpara, Naiorpul, Tilagarh, Campus' },
  { route: 'Rikabibazar to Campus', time: '08:10 AM', bus: 'BRTC', stops: 'Rikabibazar, Subid Bazar, Amberkhana, Shahi Eidgah, Tilagarh, Campus' },
  { route: 'Medina Market to Campus', time: '08:10 AM', bus: 'BRTC', stops: 'Medina Market, Subid Bazar, Amberkhana, Shahi Eidgah, Tilagarh, Campus' },
  { route: 'Humayun Chattar to Campus', time: '08:15 AM', bus: 'BRTC', stops: 'Humayun Chattar, Naiorpul, Shibgonj, Tilagarh, Campus' },
  { route: 'Kajir Bazar to Campus', time: '11:00 AM', bus: 'BRTC', stops: 'Kajir Bazar, Rikabibazar, Chowhatta, Kumarpara, Naiorpul, Tilagarh, Campus' },
  { route: 'Medina Market to Campus', time: '11:00 AM', bus: 'BRTC', stops: 'Medina Market, Subid Bazar, Amberkhana, Shahi Eidgah, Tilagarh, Campus' },
  { route: 'Temukhi to Campus', time: '11:00 AM', bus: '11-1055', stops: 'Temukhi, Medina Market, Subid Bazar, Amberkhana, Shahi Eidgah, Tilagarh, Campus' },
  { route: 'Pathantula to Campus', time: '11:05 AM', bus: '11-0944', stops: 'Pathantula, Subid Bazar, Amberkhana, Shahi Eidgah, Tilagarh, Campus' },
  { route: 'Campus to Shrirampur Bypass', time: '06:05 PM', bus: '11-1054', stops: 'Campus, Shrirampur Bypass, Surma Gate Bypass' },
  { route: 'Rikabibazar to Campus', time: '11:00 AM', bus: '11-0967', stops: 'Rikabibazar, Chowhatta, Kumarpara, Shahi Eidgah, Tilagarh, Campus' },
  { route: 'Rikabibazar to Campus', time: '11:00 AM', bus: '11-0018', stops: 'Rikabibazar, Chowhatta, Kumarpara, Shahi Eidgah, Tilagarh, Campus' },
  { route: 'Humayun Chattar to Campus', time: '11:05 AM', bus: '11-0010', stops: 'Humayun Chattar, Naiorpul, Shibgonj, Tilagarh, Campus' },
  { route: 'Humayun Chattar to Campus', time: '11:05 AM', bus: '11-1054', stops: 'Humayun Chattar, Naiorpul, Shibgonj, Tilagarh, Campus' },
  { route: 'Campus to Tilagarh to Shahi Eidgah to Kumarpara to Rikabibazar to Campus', time: '12:25 PM', bus: '11-0967', stops: 'Campus, Tilagarh, Shahi Eidgah, Kumarpara, Rikabibazar, Campus' },
  { route: 'Campus to Tilagarh to Shahi Eidgah to Kumarpara to Rikabibazar to Campus', time: '12:50 PM', bus: '11-0967', stops: 'Campus, Tilagarh, Shahi Eidgah, Kumarpara, Rikabibazar, Campus' },
  { route: 'Campus to Tilagarh to Shahi Eidgah to Kumarpara to Rikabibazar to Campus', time: '12:15 PM', bus: '11-0900', stops: 'Campus, Tilagarh, Shahi Eidgah, Kumarpara, Rikabibazar, Campus' },
  { route: 'Campus to Tilagarh to Shahi Eidgah to Kumarpara to Rikabibazar to Campus', time: '12:50 PM', bus: '11-0900', stops: 'Campus, Tilagarh, Shahi Eidgah, Kumarpara, Rikabibazar, Campus' },
  { route: 'Campus to Tilagarh to Shahi Eidgah to Kumarpara to Rikabibazar to Campus', time: '01:10 PM', bus: '11-1054', stops: 'Campus, Tilagarh, Shahi Eidgah, Kumarpara, Rikabibazar, Campus' },
  { route: 'Campus to Tilagarh to Shahi Eidgah to Kumarpara to Rikabibazar to Campus', time: '01:40 PM', bus: '11-1054', stops: 'Campus, Tilagarh, Shahi Eidgah, Kumarpara, Rikabibazar, Campus' },
  { route: 'Campus to Shahi Eidgah to Campus', time: '01:20 PM', bus: '11-1055', stops: 'Campus, Shahi Eidgah, Campus' },
  { route: 'Campus to Shahi Eidgah to Campus', time: '01:50 PM', bus: '11-1055', stops: 'Campus, Shahi Eidgah, Campus' },
  { route: 'Campus to Shahi Eidgah to Campus', time: '01:20 PM', bus: '11-0944', stops: 'Campus, Shahi Eidgah, Campus' },
  { route: 'Campus to Shahi Eidgah to Campus', time: '01:50 PM', bus: '11-0944', stops: 'Campus, Shahi Eidgah, Campus' },
  { route: 'Campus to Tilagarh Shuttle', time: '09:18 AM', bus: '11-0010', stops: 'Campus, Tilagarh, Campus' },
  { route: 'Campus to Tilagarh Shuttle', time: '09:40 AM', bus: '11-0010', stops: 'Campus, Tilagarh, Campus' },
  { route: 'Campus to Tilagarh Shuttle', time: '12:10 PM', bus: '11-0018', stops: 'Campus, Tilagarh, Campus' },
  { route: 'Campus to Tilagarh Shuttle', time: '12:35 PM', bus: '11-0018', stops: 'Campus, Tilagarh, Campus' },
  { route: 'Campus to Tilagarh Shuttle', time: '01:10 PM', bus: '11-0018', stops: 'Campus, Tilagarh, Campus' },
  { route: 'Campus to Tilagarh Shuttle', time: '01:35 PM', bus: '11-0018', stops: 'Campus, Tilagarh, Campus' },
  { route: 'Campus to Tilagarh Shuttle', time: '01:35 PM', bus: '11-0010', stops: 'Campus, Tilagarh, Campus' },
  { route: 'Campus to Tilagarh Shuttle', time: '02:00 PM', bus: '11-0010', stops: 'Campus, Tilagarh, Campus' },
  { route: 'Campus to Tilagarh Shuttle', time: '05:05 PM', bus: '11-0010', stops: 'Campus, Tilagarh, Campus' },
  { route: 'Campus to Darbast to Campus', time: '08:00 AM', bus: '11-0010', stops: 'Campus, Darbast, Campus' },
  { route: 'Campus to Darbast to Campus', time: '06:05 PM', bus: '11-0018', stops: 'Campus, Darbast, Campus' },
];

function parse12HourTime(t) {
  if (!t) return null;
  const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ampm = m[3].toUpperCase();
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return {
    timeStr: `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:00`,
    h,
    min
  };
}

function calcArrivalTime(parsedTime, isShuttle) {
  if (!parsedTime) return null;
  const addMinutes = isShuttle ? 25 : 45;
  let totalMin = parsedTime.h * 60 + parsedTime.min + addMinutes;
  let arrH = Math.floor(totalMin / 60) % 24;
  let arrM = totalMin % 60;
  return `${arrH.toString().padStart(2, '0')}:${arrM.toString().padStart(2, '0')}:00`;
}

function getDirectionAndShortName(routeName, timeFormatted) {
  const lower = routeName.toLowerCase();
  let direction = 'to_campus';
  let shortName = routeName;

  if (lower.includes('shuttle') || (lower.startsWith('campus to') && lower.endsWith('campus'))) {
    direction = 'shuttle';
    if (lower.includes('tilagarh')) {
      shortName = `Tilagarh Shuttle (${timeFormatted})`;
    } else if (lower.includes('darbast')) {
      shortName = `Darbast Shuttle (${timeFormatted})`;
    } else if (lower.includes('shahi eidgah')) {
      shortName = `Eidgah Shuttle (${timeFormatted})`;
    } else {
      shortName = `Campus Circular Shuttle (${timeFormatted})`;
    }
  } else if (lower.startsWith('campus to')) {
    direction = 'from_campus';
    shortName = routeName.replace(/^campus to\s*/i, 'Campus – ');
  } else {
    direction = 'to_campus';
    shortName = routeName.replace(/\s*to campus$/i, ' – Campus');
  }

  return { direction, shortName };
}

async function run() {
  console.log('🚌 Seeding Metropolitan University Bus Schedule into Supabase PostgreSQL...\n');
  const ok = await db.testConnection();
  if (!ok) {
    console.error('Database connection failed.');
    process.exit(1);
  }

  // 1. Clear existing bus tables
  await db.query(`DELETE FROM bus_stops`);
  await db.query(`DELETE FROM bus_routes`);
  console.log('🧹 Cleared existing bus routes and stops.');

  let routesInserted = 0;
  let stopsInserted = 0;

  for (const item of rawBusData) {
    const parsedTime = parse12HourTime(item.time);
    const depTime = parsedTime ? parsedTime.timeStr : '08:00:00';
    const isShuttle = item.route.toLowerCase().includes('shuttle') || (item.route.toLowerCase().startsWith('campus to') && item.route.toLowerCase().endsWith('campus'));
    const arrTime = calcArrivalTime(parsedTime, isShuttle);

    const { direction, shortName } = getDirectionAndShortName(item.route, item.time);

    const routeRow = await db.queryOne(
      `INSERT INTO bus_routes
         (route_name, short_name, direction, departure_time, arrival_time,
          bus_number, passenger_type, route_type, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, 'both', $7, TRUE)
       RETURNING id`,
      [
        item.route,
        shortName,
        direction,
        depTime,
        arrTime,
        item.bus,
        isShuttle ? 'shuttle' : 'regular'
      ]
    );

    routesInserted++;

    // Insert stops
    const stopList = item.stops.split(',').map(s => s.trim()).filter(Boolean);
    for (let i = 0; i < stopList.length; i++) {
      await db.query(
        `INSERT INTO bus_stops (route_id, stop_name, stop_order)
         VALUES ($1, $2, $3)`,
        [routeRow.id, stopList[i], i + 1]
      );
      stopsInserted++;
    }
  }

  console.log(`\n🎉 Success! Seeded:`);
  console.log(`   - ${routesInserted} Bus Trips / Routes`);
  console.log(`   - ${stopsInserted} Ordered Bus Stops`);

  // Print counts by direction
  const counts = await db.query(
    `SELECT direction, COUNT(*) as count FROM bus_routes GROUP BY direction`
  );
  console.log('\n📊 Routes breakdown:');
  for (const c of counts) {
    console.log(`   - ${c.direction}: ${c.count} routes`);
  }

  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Bus Seeder error:', err);
  process.exit(1);
});
