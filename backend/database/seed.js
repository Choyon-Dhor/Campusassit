// ============================================================
// database/seed.js — Seed demo data into PostgreSQL
// Run:  node database/seed.js
// ============================================================
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const db = require('../config/database');

async function seed() {
  console.log('🌱 Seeding CampusAssist database (PostgreSQL)…\n');

  const ok = await db.testConnection();
  if (!ok) process.exit(1);

  // ── Users ────────────────────────────────────────────────
  const hash = await bcrypt.hash('password123', 10);

  const users = [
    { name: 'Admin User',    email: 'admin@campus.edu',  role: 'admin',   department: 'Administration' },
    { name: 'Dr. Sarah Ahmed',  email: 'sarah@campus.edu',  role: 'teacher', department: 'Computer Science' },
    { name: 'Dr. Rahman Khan',  email: 'rahman@campus.edu', role: 'teacher', department: 'Mathematics' },
    { name: 'Alice Johnson',    email: 'alice@student.edu', role: 'student', department: 'Computer Science' },
    { name: 'Bob Smith',        email: 'bob@student.edu',   role: 'student', department: 'Computer Science' },
    { name: 'Carol Davis',      email: 'carol@student.edu', role: 'student', department: 'Mathematics' },
  ];

  for (const u of users) {
    await db.query(
      `INSERT INTO users (name, email, password, role, department)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (email) DO NOTHING`,
      [u.name, u.email, hash, u.role, u.department]
    );
  }
  console.log('✅ Users seeded');

  // ── Rooms ────────────────────────────────────────────────
  const rooms = [
    ['101',       'Science Block', 40, 'classroom',    1],
    ['102',       'Science Block', 40, 'classroom',    1],
    ['103',       'Science Block', 40, 'classroom',    1],
    ['201',       'Science Block', 60, 'lecture_hall', 2],
    ['202',       'Science Block', 60, 'lecture_hall', 2],
    ['Lab-1',     'Tech Block',    30, 'lab',          1],
    ['Lab-2',     'Tech Block',    30, 'lab',          1],
    ['Seminar-A', 'Admin Block',   25, 'seminar',      1],
    ['301',       'Arts Block',    45, 'classroom',    3],
    ['302',       'Arts Block',    45, 'classroom',    3],
  ];
  for (const r of rooms) {
    await db.query(
      `INSERT INTO rooms (room_name, building, capacity, type, floor)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (room_name) DO NOTHING`,
      r
    );
  }
  console.log('✅ Rooms seeded');

  // ── Routine ──────────────────────────────────────────────
  const routine = [
    ['Monday',    '08:00-09:30', '08:00', '09:30', 'CSE101',  'Introduction to Programming', '101',       'Dr. Sarah Ahmed', 'CSE',  '1st', '2024'],
    ['Monday',    '08:00-09:30', '08:00', '09:30', 'MATH101', 'Calculus I',                 '201',       'Dr. Rahman Khan', 'Math', '1st', '2024'],
    ['Monday',    '10:00-11:30', '10:00', '11:30', 'CSE201',  'Data Structures',             '102',       'Dr. Sarah Ahmed', 'CSE',  '3rd', '2023'],
    ['Monday',    '12:00-13:30', '12:00', '13:30', 'CSE301',  'Algorithms',                  'Lab-1',     'Dr. Sarah Ahmed', 'CSE',  '5th', '2022'],
    ['Tuesday',   '08:00-09:30', '08:00', '09:30', 'CSE102',  'Digital Logic',               'Lab-2',     'Dr. Sarah Ahmed', 'CSE',  '1st', '2024'],
    ['Tuesday',   '10:00-11:30', '10:00', '11:30', 'MATH201', 'Linear Algebra',              '201',       'Dr. Rahman Khan', 'Math', '3rd', '2023'],
    ['Tuesday',   '12:00-13:30', '12:00', '13:30', 'CSE401',  'Database Systems',            '103',       'Dr. Sarah Ahmed', 'CSE',  '7th', '2021'],
    ['Wednesday', '08:00-09:30', '08:00', '09:30', 'CSE501',  'Software Engineering',        '202',       'Dr. Sarah Ahmed', 'CSE',  '5th', '2022'],
    ['Wednesday', '10:00-11:30', '10:00', '11:30', 'MATH301', 'Differential Equations',      '301',       'Dr. Rahman Khan', 'Math', '5th', '2022'],
    ['Thursday',  '08:00-09:30', '08:00', '09:30', 'CSE601',  'Machine Learning',            'Lab-1',     'Dr. Sarah Ahmed', 'CSE',  '7th', '2021'],
    ['Thursday',  '10:00-11:30', '10:00', '11:30', 'CSE201',  'Data Structures',             '101',       'Dr. Sarah Ahmed', 'CSE',  '3rd', '2023'],
    ['Friday',    '08:00-09:30', '08:00', '09:30', 'CSE101',  'Introduction to Programming', '102',       'Dr. Sarah Ahmed', 'CSE',  '1st', '2024'],
    ['Saturday',  '08:00-09:30', '08:00', '09:30', 'MATH101', 'Calculus I',                  '302',       'Dr. Rahman Khan', 'Math', '1st', '2024'],
    ['Saturday',  '10:00-11:30', '10:00', '11:30', 'CSE201',  'Data Structures',             'Seminar-A', 'Dr. Sarah Ahmed', 'CSE',  '3rd', '2023'],
  ];
  for (const r of routine) {
    await db.query(
      `INSERT INTO routine (day,time_slot,start_time,end_time,course_code,course_name,room_name,faculty_name,department,semester,batch)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      r
    );
  }
  console.log('✅ Routine seeded');

  // ── Get user IDs ─────────────────────────────────────────
  const adminUser   = await db.queryOne(`SELECT id FROM users WHERE email='admin@campus.edu'`);
  const teacherUser = await db.queryOne(`SELECT id FROM users WHERE email='sarah@campus.edu'`);
  const studentUser = await db.queryOne(`SELECT id FROM users WHERE email='alice@student.edu'`);
  const student2    = await db.queryOne(`SELECT id FROM users WHERE email='bob@student.edu'`);
  const student3    = await db.queryOne(`SELECT id FROM users WHERE email='carol@student.edu'`);
  const teacher2    = await db.queryOne(`SELECT id FROM users WHERE email='rahman@campus.edu'`);

  // ── Announcements ─────────────────────────────────────────
  const announcements = [
    [adminUser.id,   'Welcome to Spring Semester 2025!',       'Dear students, welcome back to the new semester. Please check your class schedules and make sure you are enrolled in all your courses. Wishing you all a productive semester ahead!', 'general',  'all',     true],
    [teacherUser.id, 'Mid-Term Examination Schedule Released', 'The mid-term examination schedule has been released. Please check the academic calendar for your specific exam dates. All exams will be held in designated examination halls.',         'academic', 'student', true],
    [adminUser.id,   'Library Hours Extended',                 'The university library will now be open until midnight on weekdays to accommodate students during examination season. Please carry your student ID at all times.',                        'general',  'all',     false],
    [teacherUser.id, 'New Research Resources Available',      'The library has added 50+ new academic journals and research databases. Students can access these through the university portal using their credentials.',                                'academic', 'student', false],
    [adminUser.id,   'Campus Maintenance Notice',             'The Science Block elevator will be under maintenance on Friday. Please use the staircase during this period.',                                                                             'general',  'all',     false],
  ];
  for (const a of announcements) {
    await db.query(
      `INSERT INTO announcements (author_id, title, content, category, target_role, is_pinned)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      a
    );
  }
  console.log('✅ Announcements seeded');

  // ── Deadlines ─────────────────────────────────────────────
  const deadlineSQL = `INSERT INTO deadlines
    (title, description, course_code, course_name, deadline_date, type, priority, user_id)
    VALUES ($1, $2, $3, $4, NOW() + ($5 * INTERVAL '1 day'), $6, $7, $8)`;

  await db.query(deadlineSQL, [
    'Programming Assignment #3',
    'Implement a linked list with all basic operations in C++',
    'CSE101', 'Introduction to Programming', 3, 'assignment', 'high', studentUser.id,
  ]);
  await db.query(deadlineSQL, [
    'Calculus Problem Set',
    'Complete exercises 5.1 to 5.4 from the textbook',
    'MATH101', 'Calculus I', 7, 'assignment', 'medium', studentUser.id,
  ]);
  await db.query(deadlineSQL, [
    'Mid-Term Exam - CSE201',
    'Data Structures mid-term covering arrays, linked lists, stacks, queues',
    'CSE201', 'Data Structures', 14, 'exam', 'high', studentUser.id,
  ]);
  await db.query(deadlineSQL, [
    'Database Design Project',
    'Design and implement a database for a library management system',
    'CSE401', 'Database Systems', 21, 'project', 'high', studentUser.id,
  ]);
  console.log('✅ Deadlines seeded');

  // ── Consultation Hours ────────────────────────────────────
  await db.query(
    `INSERT INTO consultation_hours (teacher_id,day,start_time,end_time,location,notes) VALUES
     ($1,'Sunday',   '10:00','12:00','Room 301, CS Dept',   'Prior appointment preferred. Bring your student ID.'),
     ($1,'Tuesday',  '14:00','16:00','Room 301, CS Dept',   'Office hours for programming and algorithms courses.'),
     ($2,'Monday',   '11:00','13:00','Room 205, Math Dept', 'Available for calculus and linear algebra help.')`,
    [teacherUser.id, teacher2.id]
  );
  console.log('✅ Consultation hours seeded');

  // ── Study Groups ──────────────────────────────────────────
  const sg1 = await db.queryOne(
    `INSERT INTO study_groups (name,description,course_code,course_name,creator_id,max_members,meeting_schedule)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    ['CSE101 Study Squad','A group for first year students to study programming together','CSE101','Introduction to Programming',studentUser.id,8,'Every Saturday 2PM']
  );
  const sg2 = await db.queryOne(
    `INSERT INTO study_groups (name,description,course_code,course_name,creator_id,max_members,meeting_schedule)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    ['Data Structures Prep','Preparing for Data Structures exams together','CSE201','Data Structures',student2.id,6,'Wednesdays and Sundays']
  );
  const sg3 = await db.queryOne(
    `INSERT INTO study_groups (name,description,course_code,course_name,creator_id,max_members,meeting_schedule)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    ['Math Warriors','Tackling calculus problems together','MATH101','Calculus I',student3.id,10,'Every Tuesday 4PM']
  );

  const sgMembers = [
    [sg1.id, studentUser.id, 'creator'], [sg1.id, student2.id, 'member'], [sg1.id, student3.id, 'member'],
    [sg2.id, student2.id,   'creator'], [sg2.id, studentUser.id,'member'],
    [sg3.id, student3.id,   'creator'], [sg3.id, studentUser.id,'member'], [sg3.id, student2.id,'member'],
  ];
  for (const [gid, uid, role] of sgMembers) {
    await db.query(
      `INSERT INTO study_group_members (group_id,user_id,role) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
      [gid, uid, role]
    );
  }
  console.log('✅ Study groups seeded');

  console.log('\n🎉 Database seeded successfully!');
  console.log('   Demo accounts (password: password123):');
  console.log('   admin@campus.edu | sarah@campus.edu | alice@student.edu');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
