// ============================================================
// database/seed_mu_data.js — Metropolitan University Sylhet
// Seeds: batches, Spring 2026 routine, MU bus schedule, sample results
// Run: node database/seed_mu_data.js
// ============================================================
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../config/database');

async function seedMU() {
  console.log('🌱 Seeding Metropolitan University data…\n');
  const ok = await db.testConnection();
  if (!ok) process.exit(1);

  // ── Batches ────────────────────────────────────────────────
  const batches = [];
  const sections = {
    57: ['A+B','C+D','E','F+G'],
    58: ['A','B+I','C+G','D+H','E+F'],
    59: ['A+F','B','C','D+G','E','H','I+J'],
    60: ['A','B','C','D','E+F+G'],
    61: ['A','B','C','D','E','F','G'],
    62: ['A','B','C','D','E'],
    63: ['A','B','C','D'],
    64: ['A','B','C'],
    65: ['A','B','C','D'],
  };
  for (const [batchNum, secs] of Object.entries(sections)) {
    for (const sec of secs) {
      batches.push([parseInt(batchNum), sec, 'CSE']);
    }
  }
  for (const [bn, sec, dept] of batches) {
    await db.query(
      `INSERT INTO batches (batch_number, section, department)
       VALUES ($1,$2,$3) ON CONFLICT ON CONSTRAINT unique_batch_section DO NOTHING`,
      [bn, sec, dept]
    );
  }
  console.log(`✅ Batches seeded (${batches.length} batch-sections)`);

  // ── Clear old routine, insert MU Spring 2026 ──────────────
  await db.query(`DELETE FROM routine`);

  // Faculty map (initials → full name)
  const faculty = {
    NIR:'Nasif Istiak Remon', SRC:'Shrabanti Chowdhury', ATB:'Anika Tabassum',
    AIR:'Ahmed Istiakur Rahman', MDP:'Mayami Das Purba', PBT:'Plabon Talukder',
    AHC:'Aisha Hayder Chowdhury', TWR:'Tawsifur Rahman', MSS:'Md. Shadman Shakib',
    NAT:'Nasrin Akter Tanya', NI:'Nazrul Islam', FHR:'Fahim Ashraf',
    RFZ:'Raisa Fairooz', SRR:'Samia Rahman Rima', AAR:'Ahmed Afif Rafsan',
    AAB:'Archi Arani Basak', AWS:'Abdul Wadud Shakib', GMN:'Golam Mostofa Naeem',
    NZR:'Nabila Zannat Rifa', INC:'Ishrar Nazah Chowdhury', FRS:'Md. Fahmidur Rahman Sakib',
    TJN:'Tajbin Jahan', RA:'Rishad Amin Pulok', AJMJ:'Abu Jafar Md. Jakaria',
    DRH:'Dr. Razaul Haque', MMR:'Dr. Md. Masud Rana', TA:'Prof. Dr. Tofayel Ahmed',
    MAH:'Md. Amjad Hossain', MMZ:'Muhammad Muzammil', FAR:'Farhana Akter',
    FAM:'Fardin Ahasan Maraz', AMR:'Abdullah Al Masud', BAH:'Bushra Azmat Hussain',
    NSN:'Nowshin Sharmin', SAS:'Dr. Md. Sadman Sakib', MSI:'Md. Shamihul Islam',
    IMA:'Md. Imam Mahdi', MSR:'Md. Mushtaq Shahriyar Rafee', NHC:'Prof. Dr. Nazrul Haque',
    RAR:'Ruhul Amin', SA:'Salma Akhter', AR:'Ashikur Rahman', RD:'Ruma Das',
    AYM:'Md. Abu Yousuf Musa', AAM:'Abdullah Al Mashud', MMH:'Md. Mahfujul Hasan',
    CMW:'Prof. Chowdhury Mukammel Wahid', SR:'Md. Saidur Rahman Polash',
    TWP:'Technical Writing Presentation', New1:'(New Faculty)',
    New2:'(New Faculty 2)', New3:'(New Faculty 3)', New4:'(New Faculty 4)',
  };

  // Spring 2026 routine entries extracted from official PDF
  // Format: [day, slot_label, start, end, course_code, course_name, room, faculty_initial, batch_number, batch_section]
  const routineEntries = [
    // ─ SUNDAY ─────────────────────────────────────────────────
    // CSE-58C+G — OOP Lab (2 consecutive slots)
    ['Sunday','9:00-10:15', '09:00','10:15','CSE-222','OOP Lab',            '310','PBT', 58,'C+G'],
    ['Sunday','10:15-11:30','10:15','11:30','CSE-222','OOP Lab',            '310','PBT', 58,'C+G'],
    // CSE-58A
    ['Sunday','9:00-10:15', '09:00','10:15','CSE-215','Communication Eng',  '505','ATB', 58,'A'],
    ['Sunday','11:30-12:45','11:30','12:45','CSE-421','Artificial Intelligence','503','RFZ',58,'A'],
    ['Sunday','2:15-3:30',  '14:15','15:30','CSE-321','Operating System',   '503','PBT', 58,'A'],
    ['Sunday','3:30-4:45',  '15:30','16:45','CSE-215','Communication Eng',  '506','FHR', 58,'A'],
    // CSE-58B+I
    ['Sunday','9:00-10:15', '09:00','10:15','CSE-421','Artificial Intelligence','506','RFZ',58,'B+I'],
    ['Sunday','2:15-3:30',  '14:15','15:30','CSE-321','Operating System Lab','311','AHC',58,'B+I'],
    ['Sunday','3:30-4:45',  '15:30','16:45','CSE-321','Operating System Lab','311','AHC',58,'B+I'],
    // CSE-58D+H — DBMS
    ['Sunday','2:15-3:30',  '14:15','15:30','CSE-223','DBMS',               '408','SRR',58,'D+H'],
    // CSE-58E+F
    ['Sunday','11:30-12:45','11:30','12:45','CSE-238','MP&I Lab',            '405','AIR',58,'E+F'],
    ['Sunday','1:00-2:15',  '13:00','14:15','CSE-238','MP&I Lab',            '405','AIR',58,'E+F'],
    ['Sunday','2:15-3:30',  '14:15','15:30','CSE-237','MP&I',               '408','TWR',58,'E+F'],
    ['Sunday','3:30-4:45',  '15:30','16:45','CSE-237','MP&I',               '508','TWR',58,'E+F'],

    // ─ MONDAY ─────────────────────────────────────────────────
    // CSE-58C+G
    ['Monday','1:00-2:15',  '13:00','14:15','CSE-221','OOP',                 '506','NIR',58,'C+G'],
    // CSE-58A
    ['Monday','9:00-10:15', '09:00','10:15','CSE-215','Communication Eng',   '408','ATB',58,'A'],
    ['Monday','11:30-12:45','11:30','12:45','CSE-421','Artificial Intelligence','408','AAB',58,'A'],
    // CSE-58B+I
    ['Monday','1:00-2:15',  '13:00','14:15','CSE-421','Artificial Intelligence','501','NZR',58,'B+I'],
    ['Monday','2:15-3:30',  '14:15','15:30','CSE-322','OS Lab',              '311','PBT',58,'B+I'],
    ['Monday','3:30-4:45',  '15:30','16:45','CSE-322','OS Lab',              '311','PBT',58,'B+I'],
    // CSE-58D+H — DBMS Lab
    ['Monday','2:15-3:30',  '14:15','15:30','CSE-224','DBMS Lab',            '405','SRR',58,'D+H'],
    ['Monday','3:30-4:45',  '15:30','16:45','CSE-224','DBMS Lab',            '405','SRR',58,'D+H'],
    // CSE-58E+F — MP&I
    ['Monday','1:00-2:15',  '13:00','14:15','CSE-237','MP&I',               '409','AIR',58,'E+F'],
    ['Monday','2:15-3:30',  '14:15','15:30','CSE-238','MP&I Lab',            '309','TWR',58,'E+F'],
    ['Monday','3:30-4:45',  '15:30','16:45','CSE-238','MP&I Lab',            '309','TWR',58,'E+F'],

    // ─ TUESDAY ────────────────────────────────────────────────
    // CSE-58C+G — OOP Lab
    ['Tuesday','9:00-10:15', '09:00','10:15','CSE-222','OOP Lab',            '310','NIR',58,'C+G'],
    ['Tuesday','10:15-11:30','10:15','11:30','CSE-222','OOP Lab',            '310','NIR',58,'C+G'],
    // CSE-58A
    ['Tuesday','11:30-12:45','11:30','12:45','CSE-421','AI',                 '501','INC',58,'A'],
    ['Tuesday','1:00-2:15',  '13:00','14:15','CSE-422','AI Lab',             '310','AAB',58,'A'],
    ['Tuesday','2:15-3:30',  '14:15','15:30','CSE-422','AI Lab',             '310','AAB',58,'A'],
    // CSE-58B+I — DBMS Lab
    ['Tuesday','2:15-3:30',  '14:15','15:30','CSE-224','DBMS Lab',           '405','FRS',58,'B+I'],
    ['Tuesday','3:30-4:45',  '15:30','16:45','CSE-224','DBMS Lab',           '405','FRS',58,'B+I'],
    // CSE-58D+H
    ['Tuesday','9:00-10:15', '09:00','10:15','CSE-237','MP&I',               '503','AAR',58,'D+H'],
    ['Tuesday','10:15-11:30','10:15','11:30','CSE-237','MP&I',               '503','AIR',58,'D+H'],
    // CSE-58E+F — DBMS
    ['Tuesday','9:00-10:15', '09:00','10:15','CSE-223','DBMS',               '408','SRR',58,'E+F'],

    // ─ WEDNESDAY ──────────────────────────────────────────────
    // CSE-58A — ML
    ['Wednesday','9:00-10:15', '09:00','10:15','CSE-471','Machine Learning', '501','AWS',58,'A'],
    // CSE-58B+I — ML
    ['Wednesday','9:00-10:15', '09:00','10:15','CSE-471','Machine Learning', '509','GMN',58,'B+I'],
    ['Wednesday','10:15-11:30','10:15','11:30','CSE-471','Machine Learning', '509','GMN',58,'B+I'],
    // CSE-58C+G — DBMS Lab
    ['Wednesday','9:00-10:15', '09:00','10:15','CSE-224','DBMS Lab',         '405','FRS',58,'C+G'],
    ['Wednesday','10:15-11:30','10:15','11:30','CSE-224','DBMS Lab',         '405','FRS',58,'C+G'],
    // CSE-58D+H — DBMS Lab
    ['Wednesday','9:00-10:15', '09:00','10:15','CSE-224','DBMS Lab',         '310','SRR',58,'D+H'],
    ['Wednesday','10:15-11:30','10:15','11:30','CSE-224','DBMS Lab',         '310','SRR',58,'D+H'],
    // CSE-58E+F — DBMS Lab
    ['Wednesday','9:00-10:15', '09:00','10:15','CSE-224','DBMS Lab',         '309','SRC',58,'E+F'],
    ['Wednesday','10:15-11:30','10:15','11:30','CSE-224','DBMS Lab',         '309','SRC',58,'E+F'],
    ['Wednesday','2:15-3:30',  '14:15','15:30','CSE-237','MP&I',             '508','MSS',58,'E+F'],
    ['Wednesday','1:00-2:15',  '13:00','14:15','CSE-221','OOP',              '508','NIR',58,'C+G'],

    // ─ THURSDAY ───────────────────────────────────────────────
    // CSE-58C+G — OOP Lab
    ['Thursday','1:00-2:15',  '13:00','14:15','CSE-222','OOP Lab',           '310','NIR',58,'C+G'],
    ['Thursday','2:15-3:30',  '14:15','15:30','CSE-222','OOP Lab',           '310','NIR',58,'C+G'],
    // CSE-58A — DBMS
    ['Thursday','9:00-10:15', '09:00','10:15','CSE-223','DBMS',              '408','FRS',58,'A'],
    ['Thursday','10:15-11:30','10:15','11:30','CSE-223','DBMS',              '408','FRS',58,'A'],
    ['Thursday','1:00-2:15',  '13:00','14:15','CSE-221','OOP Lab',           '310','NIR',58,'A'],
    ['Thursday','2:15-3:30',  '14:15','15:30','CSE-221','OOP Lab',           '310','NIR',58,'A'],
    // CSE-58B+I — ML Lab
    ['Thursday','9:00-10:15', '09:00','10:15','CSE-472','ML Lab',            '310','AWS',58,'B+I'],
    ['Thursday','10:15-11:30','10:15','11:30','CSE-472','ML Lab',            '310','AWS',58,'B+I'],
    // CSE-58D+H — MP&I Lab
    ['Thursday','9:00-10:15', '09:00','10:15','CSE-238','MP&I Lab',          '309','TWR',58,'D+H'],
    ['Thursday','10:15-11:30','10:15','11:30','CSE-238','MP&I Lab',          '309','TWR',58,'D+H'],
    // CSE-58E+F — OOP
    ['Thursday','9:00-10:15', '09:00','10:15','CSE-221','OOP',               '502','PBT',58,'E+F'],
    ['Thursday','1:00-2:15',  '13:00','14:15','CSE-223','DBMS',              '409','SRR',58,'E+F'],
    ['Thursday','2:15-3:30',  '14:15','15:30','CSE-223','DBMS',              '505','SRC',58,'E+F'],
  ];

  let routineInserted = 0;
  for (const [day, slot, start, end, code, name, room, fInit, bNum, bSec] of routineEntries) {
    await db.query(
      `INSERT INTO routine
         (day, time_slot, start_time, end_time, course_code, course_name,
          room_name, faculty_name, department, batch_number, batch_section)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'CSE',$9,$10)`,
      [day, slot, start+':00', end+':00', code, name, room,
       faculty[fInit] || fInit, bNum, bSec]
    );
    routineInserted++;
  }
  console.log(`✅ Spring 2026 routine seeded (${routineInserted} entries)`);

  // ── MU Rooms (from actual routine) ────────────────────────
  await db.query(`DELETE FROM rooms`);
  const rooms = [
    ['108', 'Main Building', 60, 'lab',          1],
    ['109', 'Main Building', 60, 'lab',          1],
    ['203', 'Main Building', 50, 'classroom',    2],
    ['307', 'Main Building', 50, 'classroom',    3],
    ['309', 'Main Building', 50, 'classroom',    3],
    ['310', 'Main Building', 55, 'lab',          3],
    ['311', 'Main Building', 55, 'lab',          3],
    ['404', 'Main Building', 50, 'classroom',    4],
    ['405', 'Main Building', 55, 'lab',          4],
    ['408', 'Main Building', 50, 'classroom',    4],
    ['409', 'Main Building', 50, 'classroom',    4],
    ['501', 'Main Building', 50, 'classroom',    5],
    ['502', 'Main Building', 50, 'classroom',    5],
    ['503', 'Main Building', 50, 'classroom',    5],
    ['505', 'Main Building', 50, 'classroom',    5],
    ['506', 'Main Building', 50, 'classroom',    5],
    ['507', 'Main Building', 50, 'classroom',    5],
    ['508', 'Main Building', 50, 'classroom',    5],
    ['509', 'Main Building', 50, 'classroom',    5],
    ['GL-1','Gallery Hall',  120,'lecture_hall', 1],
    ['GL-2','Gallery Hall',  120,'lecture_hall', 1],
  ];
  for (const r of rooms) {
    await db.query(
      `INSERT INTO rooms (room_name, building, capacity, type, floor)
       VALUES ($1,$2,$3,$4,$5) ON CONFLICT (room_name) DO NOTHING`, r
    );
  }
  console.log(`✅ MU rooms seeded (${rooms.length} rooms)`);

  // ── MU Bus Schedule ───────────────────────────────────────
  await db.query(`DELETE FROM bus_stops`);
  await db.query(`DELETE FROM bus_routes`);

  const busRoutes = [
    // ── Morning to-campus routes ──────────────────────────────
    {
      route_name: 'Medina Market → Azrakhana → Chowhaata → Kumarpora → Shahi Eidgah → Tilagog → Campus',
      short_name: 'Medina Market – Campus',
      direction: 'to_campus', departure_time: '08:10', arrival_time: '08:55',
      bus_number: '11-001b', driver_name: 'Sojib', passenger_type: 'teacher',
      stops: ['Medina Market','Azrakhana','Chowhaata','Kumarpora','Shahi Eidgah','Tilagog','Campus'],
    },
    {
      route_name: 'Rikabibazar → Chowhaata → Kumarpora → Shahi Eidgah → Tilagog → Campus',
      short_name: 'Rikabibazar – Campus (Morning)',
      direction: 'to_campus', departure_time: '08:10', arrival_time: '08:50',
      bus_number: '11-0988', driver_name: 'Manir', passenger_type: 'student',
      stops: ['Rikabibazar','Chowhaata','Kumarpora','Shahi Eidgah','Tilagog','Campus'],
    },
    {
      route_name: 'Rikabibazar → Subidabazar → Azrakhana → Shahi Eidgah → Tilagog → Campus',
      short_name: 'Rikabibazar–Subidabazar – Campus (Morning)',
      direction: 'to_campus', departure_time: '08:10', arrival_time: '08:50',
      bus_number: '11-09b9', driver_name: 'Zahir', passenger_type: 'student',
      stops: ['Rikabibazar','Subidabazar','Azrakhana','Shahi Eidgah','Tilagog','Campus'],
    },
    {
      route_name: 'Temuli → Medina Market → Subid Bazar → Azrakhana → Shahi Eidgah → Tilagog → Campus',
      short_name: 'Temuli – Campus',
      direction: 'to_campus', departure_time: '08:10', arrival_time: '09:00',
      bus_number: 'Private', driver_name: 'University Bus', passenger_type: 'student',
      stops: ['Temuli','Medina Market','Subid Bazar','Azrakhana','Shahi Eidgah','Tilagog','Campus'],
    },
    {
      route_name: 'Kazirbajar → Rikabibazar → Chowhaata → Kumarpora → Naikhwerpool → Tilagog → Campus',
      short_name: 'Kazirbajar – Campus',
      direction: 'to_campus', departure_time: '08:10', arrival_time: '09:00',
      bus_number: 'Private', driver_name: 'University Bus', passenger_type: 'student',
      stops: ['Kazirbajar','Rikabibazar','Chowhaata','Kumarpora','Naikhwerpool','Tilagog','Campus'],
    },
    {
      route_name: 'Hamaun Chattar → Naikhwerpool → Mirabajar → Shivganj → Tilagog → Campus',
      short_name: 'Hamaun Chattar – Campus',
      direction: 'to_campus', departure_time: '08:10', arrival_time: '09:05',
      bus_number: 'Private', driver_name: 'University Bus', passenger_type: 'student',
      stops: ['Hamaun Chattar','Naikhwerpool','Mirabajar','Shivganj','Tilagog','Campus'],
    },
    // ── Mid-morning routes ────────────────────────────────────
    {
      route_name: 'Temuli → Medina Market → Subid Bazar → Azrakhana → Shahi Eidgah → Tilagog → Campus',
      short_name: 'Temuli – Campus (2nd trip)',
      direction: 'to_campus', departure_time: '10:30', arrival_time: '11:15',
      bus_number: '11-944', driver_name: 'Manir', passenger_type: 'student',
      stops: ['Temuli','Medina Market','Subid Bazar','Azrakhana','Shahi Eidgah','Tilagog','Campus'],
    },
    {
      route_name: 'Rikabibazar → Chowhaata → Kumarpora → Shahi Eidgah → Tilagog → Campus',
      short_name: 'Rikabibazar – Campus (10:35)',
      direction: 'to_campus', departure_time: '10:35', arrival_time: '11:15',
      bus_number: '11-001b', driver_name: 'Sojib', passenger_type: 'student',
      stops: ['Rikabibazar','Chowhaata','Kumarpora','Shahi Eidgah','Tilagog','Campus'],
    },
    {
      route_name: 'Rikabibazar → Subidabazar → Azrakhana → Shahi Eidgah → Tilagog → Campus',
      short_name: 'Rikabibazar–Subidabazar – Campus (10:35)',
      direction: 'to_campus', departure_time: '10:35', arrival_time: '11:15',
      bus_number: '11-0900', driver_name: 'Zahir', passenger_type: 'student',
      stops: ['Rikabibazar','Subidabazar','Azrakhana','Shahi Eidgah','Tilagog','Campus'],
    },
    // ── From-campus (return) routes ───────────────────────────
    {
      route_name: 'Campus → Shahi Eidgah → Kumarpora → Chowhaata → Rikabibazar → Subidabazar → Pathantulia',
      short_name: 'Campus – Pathantulia',
      direction: 'from_campus', departure_time: '16:00', arrival_time: '16:50',
      bus_number: '11-010', driver_name: 'Shahjalal', passenger_type: 'both',
      stops: ['Campus','Tilagog','Shahi Eidgah','Kumarpora','Chowhaata','Rikabibazar','Subidabazar','Pathantulia'],
    },
    {
      route_name: 'Campus → Tilagog → Shahi Eidgah → Kumarpora → Rikabibazar → Campus (afternoon)',
      short_name: 'Campus – Rikabibazar (2:00)',
      direction: 'from_campus', departure_time: '14:00', arrival_time: '14:50',
      bus_number: '11-09b7', driver_name: 'Manir', passenger_type: 'student',
      stops: ['Campus','Tilagog','Shahi Eidgah','Kumarpora','Chowhaata','Rikabibazar'],
    },
    {
      route_name: 'Campus → Subidabazar → Azrakhana → Shahi Eidgah → Rikabibazar',
      short_name: 'Campus – Rikabibazar via Subidabazar (2:30)',
      direction: 'from_campus', departure_time: '14:30', arrival_time: '15:10',
      bus_number: '11-09b9', driver_name: 'Zahir', passenger_type: 'student',
      stops: ['Campus','Tilagog','Shahi Eidgah','Azrakhana','Subidabazar','Rikabibazar'],
    },
    {
      route_name: 'Campus → Tilagog → Campus (Shuttle)',
      short_name: 'Campus–Tilagog Shuttle',
      direction: 'shuttle', departure_time: '10:00', arrival_time: '10:30',
      bus_number: '11-001b', driver_name: 'Sojib', passenger_type: 'both',
      schedule_note: 'Runs: 10:00, 11:00, 13:00, 14:00, 15:00, 16:00, 17:00',
      stops: ['Campus','Tilagog'],
    },
    {
      route_name: 'Campus → Dorobosto → Campus',
      short_name: 'Campus–Dorobosto',
      direction: 'shuttle', departure_time: '08:10', arrival_time: '09:00',
      bus_number: '11-010', driver_name: 'Shahjalal', passenger_type: 'student',
      schedule_note: 'Morning & afternoon trips',
      stops: ['Campus','Dorobosto'],
    },
  ];

  for (const route of busRoutes) {
    const row = await db.queryOne(
      `INSERT INTO bus_routes
         (route_name, short_name, direction, departure_time, arrival_time,
          bus_number, driver_name, passenger_type, schedule_note)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [route.route_name, route.short_name, route.direction,
       route.departure_time, route.arrival_time,
       route.bus_number, route.driver_name, route.passenger_type,
       route.schedule_note || null]
    );
    for (let i = 0; i < route.stops.length; i++) {
      await db.query(
        `INSERT INTO bus_stops (route_id, stop_name, stop_order) VALUES ($1,$2,$3)`,
        [row.id, route.stops[i], i + 1]
      );
    }
  }
  console.log(`✅ MU bus routes seeded (${busRoutes.length} routes)`);

  // ── Sample Results (matching Choyon's real academic record) ─
  // Get the student user (alice) to attach results to — or create demo student
  const student = await db.queryOne(`SELECT id FROM users WHERE email = 'alice@student.edu'`);
  if (student) {
    const studentNumber = '231-115-094';
    const batchSection = '58th[C]';

    const semesterResults = [
      { code: '1:1', name: 'Spring 2023', courses: [
        ['CSE-125','Discrete Mathematics',       3.0,'A+',4.00],
        ['ENG-114','English I',                  3.0,'A+',4.00],
        ['GED-201','Bangladesh Studies',          3.0,'A+',4.00],
        ['GED-202','History of Emergence of Bangladesh',3.0,'A+',4.00],
        ['MAT-112','Differential & Integral Calculus',3.0,'A+',4.00],
        ['PHY-111','Physics I',                  3.0,'A+',4.00],
      ]},
      { code: '1:2', name: 'Summer 2023', courses: [
        ['CSE-121','Structured Programming',     3.0,'A+',4.00],
        ['CSE-122','Structured Programming Lab', 1.5,'A+',4.00],
        ['CSE-123','Basic Electrical Engineering',3.0,'A+',4.00],
        ['CSE-124','Basic Electrical Engineering Lab',1.5,'A+',4.00],
        ['ENG-115','English II',                 3.0,'A', 3.75],
        ['GED-119','Engineering Ethics and Cyber Law',2.0,'A+',4.00],
        ['MAT-123','Differential Equation & Laplace Transform',3.0,'A+',4.00],
        ['PHY-123','Physics II',                 3.0,'A+',4.00],
      ]},
      { code: '2:1', name: 'Spring 2024', courses: [
        ['CSE-131','Basic Electronics Engineering',3.0,'A+',4.00],
        ['CSE-132','Basic Electronics Engineering Lab',1.5,'A+',4.00],
        ['CSE-133','Data Structure',              3.0,'A+',4.00],
        ['CSE-134','Data Structure Lab',          1.5,'A+',4.00],
        ['GED-213','Principles of Economics and Entrepreneurship Development',3.0,'A+',4.00],
        ['MAT-135','Matrices, Complex Variable & Fourier Analysis',3.0,'A+',4.00],
        ['STA-215','Basic Statistics & Probability',3.0,'A+',4.00],
      ]},
      { code: '2:2', name: 'Summer 2024', courses: [
        ['CSE-200','Competitive Programming',    1.5,'A+',4.00],
        ['CSE-211','Digital Logic Design',        3.0,'A+',4.00],
        ['CSE-212','Digital Logic Design Lab',    1.5,'A+',4.00],
        ['CSE-231','Algorithm Design and Analysis',3.0,'A+',4.00],
        ['CSE-232','Algorithm Design and Analysis Lab',1.5,'A+',4.00],
        ['GED-431','Business Communication',     3.0,'A+',4.00],
        ['MAT-216','Geometry & Vector Analysis',  3.0,'A+',4.00],
      ]},
      { code: '3:1', name: 'Spring 2025', courses: [
        ['CSE-213','Computer Organization and Architecture',3.0,'A+',4.00],
        ['CSE-221','Object Oriented Programming', 3.0,'A+',4.00],
        ['CSE-222','Object Oriented Programming Lab',1.5,'A+',4.00],
        ['GED-215','Industrial Management and Financial Accounting',3.0,'A+',4.00],
        ['MAT-235','Numerical Methods',           3.0,'A+',4.00],
      ]},
      { code: '3:2', name: 'Summer 2025', courses: [
        ['CSE-223','Database Management System',  3.0,'A+',4.00],
        ['CSE-224','Database Management System Lab',1.5,'A+',4.00],
        ['CSE-237','Microprocessor and Interfacing',3.0,'A+',4.00],
        ['CSE-238','Microprocessor and Interfacing Lab',1.5,'A+',4.00],
        ['CSE-327','Theory of Computation',       3.0,'A+',4.00],
      ]},
      { code: '3:3', name: 'Autumn 2025', courses: [
        ['CSE-215','Communication Engineering',   3.0,'A+',4.00],
        ['CSE-321','Operating System',            3.0,'A+',4.00],
        ['CSE-322','Operating System Lab',        1.5,'A+',4.00],
        ['CSE-421','Artificial Intelligence',     3.0,'A+',4.00],
        ['CSE-422','Artificial Intelligence Lab', 1.5,'A', 3.75],
      ]},
    ];

    // Clear and re-insert results for this student
    await db.query(`DELETE FROM results WHERE student_number = $1`, [studentNumber]);

    for (const sem of semesterResults) {
      for (const [code, title, ch, lg, gp] of sem.courses) {
        await db.query(
          `INSERT INTO results
             (student_id, student_number, semester_code, semester_name,
              course_code, course_title, credit_hours, batch_section,
              letter_grade, grade_point, is_published, publish_date)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,TRUE,NOW())`,
          [student.id, studentNumber, sem.code, sem.name,
           code, title, ch, batchSection, lg, gp]
        );
      }
    }
    console.log('✅ Sample results seeded (Choyon Dhor — 231-115-094)');
  } else {
    console.log('⚠️  Student user not found — skipping results seed. Run main seed.js first.');
  }

  console.log('\n🎉 MU data seeded successfully!');
  console.log('   Next: psql -d campusassist -f database/schema_additions.sql');
  process.exit(0);
}

seedMU().catch(err => {
  console.error('❌ MU seed failed:', err.message);
  process.exit(1);
});
