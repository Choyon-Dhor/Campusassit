// ============================================================
// database/seed_smart_classrooms.js
// High-performance bulk seeder for Smart Classrooms, Enrolments,
// Assignments, Submissions, Marks, Attendance, and Resources.
// ============================================================
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../config/database');

const ASSIGNMENT_CATALOG = {
  'CSE-411': [
    {
      title: 'Assignment 1: Discrete Fourier Transform (DFT) and FFT Implementation',
      description: 'Implement the Radix-2 Cooley-Tukey FFT algorithm in Python/MATLAB without relying on built-in FFT routines. Compare execution time with standard naive DFT on audio signal samples of length N=64, 256, 512, 1024. Submit source code (.py/.m) and a PDF report showing signal spectra.',
      points: 100,
      daysDue: 7
    },
    {
      title: 'Assignment 2: FIR & IIR Digital Filter Design',
      description: 'Design a low-pass FIR filter using Hamming and Kaiser windows to attenuate high-frequency noise from a sensor reading dataset. Determine cut-off frequencies, passband ripple, and stopband attenuation.',
      points: 100,
      daysDue: 14
    }
  ],
  'CSE-412': [
    {
      title: 'Lab Report 1: Audio Signal Sampling & Aliasing Demonstration',
      description: 'Record an audio sample, downsample below the Nyquist rate to observe aliasing artifacts in the frequency domain, and reconstruct using low-pass sinc interpolation.',
      points: 50,
      daysDue: 5
    },
    {
      title: 'Lab Project: Real-time Audio Equalizer with Bandpass Filters',
      description: 'Design an interactive 3-band equalizer (Bass, Mid, Treble) in MATLAB/Python. Demonstrate gain adjustment and plot frequency response curves.',
      points: 100,
      daysDue: 18
    }
  ],
  'CSE-413': [
    {
      title: 'Assignment 1: Rasterization Algorithms & Bresenham Line Generation',
      description: 'Implement Bresenham’s Line Drawing algorithm and Midpoint Circle Algorithm. Analyze octant symmetries and handle all slopes (-1 <= m <= 1 and |m| > 1).',
      points: 100,
      daysDue: 8
    },
    {
      title: 'Assignment 2: 3D Geometric Transformations and Viewing Pipeline',
      description: 'Derive composite transformation matrices for translation, scaling, and arbitrary axis rotation in 3D homogeneous coordinates. Implement perspective and orthographic camera projections.',
      points: 100,
      daysDue: 16
    }
  ],
  'CSE-414': [
    {
      title: 'Lab Task 1: WebGL / OpenGL 3D Shader Illumination',
      description: 'Construct a 3D animated robotic arm using WebGL shaders. Implement Phong reflection lighting (Ambient, Diffuse, Specular) and texture mapping.',
      points: 50,
      daysDue: 6
    },
    {
      title: 'Lab Project: Interactive 3D Virtual Campus Environment',
      description: 'Render an interactive 3D model of Metropolitan University campus with first-person collision detection, camera walkthroughs, and shadow mapping.',
      points: 100,
      daysDue: 20
    }
  ],
  'CSE-480': [
    {
      title: 'Assignment 1: RESTful API Architecture with JWT Authentication',
      description: 'Design and build a scalable REST API using Node.js/Express and PostgreSQL. Implement secure password hashing with bcrypt, role-based access control (RBAC), and token refresh rotation.',
      points: 100,
      daysDue: 7
    },
    {
      title: 'Assignment 2: Full-Stack React Single Page Application (SPA)',
      description: 'Build a responsive dashboard using React, modern UI components, custom hooks, and state management. Integrate with backend endpoints with optimistic UI updates and error boundaries.',
      points: 100,
      daysDue: 15
    }
  ],
  'CSE-415': [
    {
      title: 'Assignment 1: Informed State-Space Search (A* and Greedy Best-First)',
      description: 'Implement the A* algorithm for the 8-puzzle problem and pathfinding on a Sylhet road network graph. Test with Manhattan Distance and Euclidean Distance heuristics.',
      points: 100,
      daysDue: 9
    },
    {
      title: 'Assignment 2: Minimax Game Playing with Alpha-Beta Pruning',
      description: 'Implement an adversarial game engine for Connect-4 or Chess endgames using Minimax search and Alpha-Beta pruning with static evaluation heuristics.',
      points: 100,
      daysDue: 17
    }
  ],
  'CSE-313': [
    {
      title: 'Assignment 1: CPU Scheduling Simulator (FCFS, SJF, Round Robin, Priority)',
      description: 'Develop a C/C++ simulator to calculate Turnaround Time, Waiting Time, and Response Time under varying arrival times and quantum slices.',
      points: 100,
      daysDue: 10
    },
    {
      title: 'Assignment 2: Concurrency & Producer-Consumer Problem using Semaphores',
      description: 'Solve the bounded-buffer producer-consumer problem using POSIX pthreads, mutex locks, and condition variables without race conditions or deadlocks.',
      points: 100,
      daysDue: 18
    }
  ],
  'CSE-221': [
    {
      title: 'Assignment 1: Relational Schema Normalization (1NF to BCNF)',
      description: 'Given an enterprise university management scenario, analyze functional dependencies, identify candidate keys, and decompose tables up to Boyce-Codd Normal Form (BCNF).',
      points: 100,
      daysDue: 8
    },
    {
      title: 'Assignment 2: Advanced SQL Queries & Query Optimization with Indexes',
      description: 'Write complex analytical queries utilizing Window Functions, Common Table Expressions (CTEs), and Subqueries. Use EXPLAIN ANALYZE to optimize performance with B-tree and Hash indexes.',
      points: 100,
      daysDue: 15
    }
  ],
  'DEFAULT': [
    {
      title: 'Assignment 1: Core Fundamentals & Practical Problem Set',
      description: 'Complete the theoretical analysis and implementation problems outlined in the syllabus. Submit detailed proofs, algorithm analysis, and working code demonstrations.',
      points: 100,
      daysDue: 7
    },
    {
      title: 'Assignment 2: Term Project Design & Implementation Report',
      description: 'Design an end-to-end technical system solving a real-world campus or industrial challenge. Include architecture diagrams, benchmarks, and reproducibility instructions.',
      points: 100,
      daysDue: 14
    }
  ]
};

function cleanName(n) {
  return (n || '')
    .toLowerCase()
    .replace(/^(dr\.|mr\.|ms\.|mrs\.|prof\.|engr\.)\s*/gi, '')
    .replace(/[^a-z0-9]/g, '');
}

async function bulkInsertChunks(tableName, columns, rows, chunkSize = 300, onConflict = '') {
  if (!rows.length) return;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const valuePlaceholders = [];
    const params = [];

    chunk.forEach((row, rIdx) => {
      const rowPlaceholders = [];
      row.forEach((val, cIdx) => {
        params.push(val);
        rowPlaceholders.push(`$${params.length}`);
      });
      valuePlaceholders.push(`(${rowPlaceholders.join(', ')})`);
    });

    const sql = `
      INSERT INTO ${tableName} (${columns.join(', ')})
      VALUES ${valuePlaceholders.join(',\n')}
      ${onConflict}
    `;

    await db.query(sql, params);
  }
}

async function run() {
  try {
    console.log('🔗 Connecting to Supabase database...');

    // 1. Teachers
    const teachers = await db.query(`SELECT id, name, email FROM users WHERE role = 'teacher' ORDER BY id`);
    console.log(`👨‍🏫 Loaded ${teachers.length} teachers.`);

    const teacherMap = new Map();
    for (const t of teachers) {
      teacherMap.set(cleanName(t.name), t);
    }

    function matchTeacher(facultyName) {
      if (!facultyName) return null;
      const c = cleanName(facultyName);
      if (teacherMap.has(c)) return teacherMap.get(c);
      for (const [tc, t] of teacherMap.entries()) {
        if (c.includes(tc) || tc.includes(c)) return t;
      }
      return null;
    }

    // 2. Students
    const students = await db.query(`
      SELECT id, name, student_number, batch_number, batch_section, email 
      FROM users 
      WHERE role = 'student' 
      ORDER BY id
    `);
    console.log(`👨‍🎓 Loaded ${students.length} students.`);

    const studentGroupMap = new Map();
    for (const s of students) {
      const b = (s.batch_number || '58').toString().replace(/[^0-9]/g, '');
      const sec = (s.batch_section || 'B').toUpperCase().trim();

      if (!studentGroupMap.has(b)) studentGroupMap.set(b, new Map());
      const batchSecMap = studentGroupMap.get(b);

      if (!batchSecMap.has(sec)) batchSecMap.set(sec, []);
      batchSecMap.get(sec).push(s);
    }

    function getEnrolledStudents(batchNum, sectionStr) {
      const b = (batchNum || '58').toString().replace(/[^0-9]/g, '');
      const batchSecMap = studentGroupMap.get(b);
      if (!batchSecMap) return students.slice(0, 30);

      const res = [];
      const seen = new Set();
      const parts = sectionStr
        .replace(/1/g, 'I')
        .split(/[+,/&]/)
        .map(p => p.trim().toUpperCase())
        .filter(Boolean);

      for (const part of parts) {
        const matching = batchSecMap.get(part) || [];
        for (const s of matching) {
          if (!seen.has(s.id)) {
            seen.add(s.id);
            res.push(s);
          }
        }
      }

      if (batchSecMap.has(sectionStr.toUpperCase())) {
        for (const s of batchSecMap.get(sectionStr.toUpperCase())) {
          if (!seen.has(s.id)) {
            seen.add(s.id);
            res.push(s);
          }
        }
      }

      if (res.length === 0) {
        const allInBatch = [];
        for (const [, stList] of batchSecMap.entries()) {
          allInBatch.push(...stList);
        }
        return allInBatch.length ? allInBatch.slice(0, 35) : students.slice(0, 35);
      }
      return res;
    }

    // 3. Routine Offerings
    const routineOfferings = await db.query(`
      SELECT 
        batch_number,
        batch_section,
        course_code,
        course_name,
        faculty_name,
        department,
        STRING_AGG(DISTINCT day, ', ') as days,
        STRING_AGG(DISTINCT room_name, ', ') as rooms
      FROM routine
      WHERE course_code IS NOT NULL AND course_code != ''
      GROUP BY batch_number, batch_section, course_code, course_name, faculty_name, department
      ORDER BY batch_number, batch_section, course_code
    `);
    console.log(`📋 Found ${routineOfferings.length} distinct course sections in routine.`);

    // 4. Fetch existing classrooms into memory
    const existingClassroomsList = await db.query(`SELECT * FROM classrooms`);
    const existingClassroomsMap = new Map();
    for (const c of existingClassroomsList) {
      const key = `${c.course_code}|${c.batch}|${c.section}|${c.semester}`;
      existingClassroomsMap.set(key, c);
    }
    console.log(`🏢 Pre-existing classrooms in DB: ${existingClassroomsList.length}`);

    const semesterName = 'Summer 2026';
    const assignedTeacherIds = new Set();
    const newClassroomRows = [];

    // Map each offering
    const mappedOfferings = [];
    let teacherIndex = 0;

    for (const r of routineOfferings) {
      let teacher = matchTeacher(r.faculty_name);
      if (!teacher) {
        teacher = teachers[teacherIndex % teachers.length];
        teacherIndex++;
      }
      assignedTeacherIds.add(teacher.id);

      const batchStr = (r.batch_number || 58).toString();
      const sectionStr = (r.batch_section || 'A').toString();
      const courseCode = r.course_code.trim();
      const courseName = r.course_name.trim();
      const key = `${courseCode}|${batchStr}|${sectionStr}|${semesterName}`;

      if (!existingClassroomsMap.has(key)) {
        const desc = `Smart Classroom for ${courseCode}: ${courseName} (Batch ${batchStr} [${sectionStr}]). Routine Schedule: ${r.days} | Room(s): ${r.rooms}`;
        newClassroomRows.push([
          courseCode, courseName, desc, teacher.id, batchStr, sectionStr, semesterName
        ]);
      }

      mappedOfferings.push({
        key,
        batch_number: r.batch_number,
        batch_section: r.batch_section,
        course_code: courseCode,
        course_name: courseName,
        teacher
      });
    }

    // Also ensure all 149 teachers have at least one classroom!
    const extraCourses = [
      { code: 'CSE-425', name: 'Neural Networks & Deep Learning', batch: '58', sec: 'A' },
      { code: 'CSE-435', name: 'Cloud Computing & DevOps', batch: '58', sec: 'B' },
      { code: 'CSE-445', name: 'Cyber Security & Ethical Hacking', batch: '58', sec: 'C' },
      { code: 'CSE-455', name: 'Mobile Application Development', batch: '58', sec: 'E' },
      { code: 'CSE-465', name: 'Natural Language Processing', batch: '58', sec: 'F' },
      { code: 'CSE-475', name: 'Internet of Things (IoT) & Embedded Systems', batch: '58', sec: 'G' },
      { code: 'CSE-485', name: 'Big Data Analytics', batch: '58', sec: 'H' },
      { code: 'CSE-495', name: 'Compiler Construction Lab', batch: '58', sec: 'I' },
    ];

    let extraIndex = 0;
    for (const t of teachers) {
      if (!assignedTeacherIds.has(t.id)) {
        const cTemplate = extraCourses[extraIndex % extraCourses.length];
        extraIndex++;
        const courseCode = cTemplate.code;
        const courseName = cTemplate.name;
        const batchStr = cTemplate.batch;
        const sectionStr = `${cTemplate.sec}-${t.id % 10}`;
        const key = `${courseCode}|${batchStr}|${sectionStr}|${semesterName}`;

        if (!existingClassroomsMap.has(key)) {
          const desc = `Smart Classroom for ${courseCode}: ${courseName} conducted by ${t.name}.`;
          newClassroomRows.push([
            courseCode, courseName, desc, t.id, batchStr, sectionStr, semesterName
          ]);
        }

        assignedTeacherIds.add(t.id);
        mappedOfferings.push({
          key,
          batch_number: 58,
          batch_section: cTemplate.sec,
          course_code: courseCode,
          course_name: courseName,
          teacher: t
        });
      }
    }

    if (newClassroomRows.length) {
      console.log(`Inserting ${newClassroomRows.length} new classrooms...`);
      await bulkInsertChunks(
        'classrooms',
        ['course_code', 'course_name', 'description', 'teacher_id', 'batch', 'section', 'semester'],
        newClassroomRows
      );
    }

    // Refresh all classrooms from DB
    const allClassrooms = await db.query(`SELECT * FROM classrooms`);
    console.log(`✅ Total active classrooms in DB: ${allClassrooms.length}`);
    for (const c of allClassrooms) {
      const key = `${c.course_code}|${c.batch}|${c.section}|${c.semester}`;
      existingClassroomsMap.set(key, c);
    }

    // 5. Bulk Enroll Students
    console.log('\n🚀 Step 2: Bulk Enrolling Students into Smart Classrooms...');
    const enrollmentRows = [];
    const targetStudent = students.find(s => s.student_number === '231-115-094');

    for (const item of mappedOfferings) {
      const cls = existingClassroomsMap.get(item.key);
      if (!cls) continue;

      const enrolled = getEnrolledStudents(item.batch_number, item.batch_section);
      if (item.batch_number == 58 && targetStudent && !enrolled.some(s => s.id === targetStudent.id)) {
        enrolled.push(targetStudent);
      }

      for (const s of enrolled) {
        enrollmentRows.push([cls.id, s.id]);
      }
    }

    // Guarantee demo students (without batch/section) are enrolled in core Batch 58 courses
    const coreClassrooms = allClassrooms.filter(c => c.batch === '58' && ['A', 'B+I', 'B'].includes(c.section));
    for (const s of students) {
      if (!s.batch_section || s.batch_section === 'none') {
        for (const cc of coreClassrooms.slice(0, 5)) {
          enrollmentRows.push([cc.id, s.id]);
        }
      }
    }

    console.log(`Inserting ${enrollmentRows.length} student enrolment records in batches...`);
    await bulkInsertChunks(
      'classroom_students',
      ['classroom_id', 'student_id'],
      enrollmentRows,
      400,
      'ON CONFLICT (classroom_id, student_id) DO NOTHING'
    );
    console.log('✅ Student enrolments completed!');

    // 6. Bulk Insert Assignments, Announcements, Deadlines, Marks, Attendance, Resources
    console.log('\n🚀 Step 3: Generating Assignments, Announcements & Deadlines...');

    // Fetch existing assignments to avoid duplicate insertions
    const existingAssignmentsList = await db.query(`SELECT id, classroom_id, title FROM assignments`);
    const existingAssMap = new Map();
    for (const a of existingAssignmentsList) {
      existingAssMap.set(`${a.classroom_id}|${a.title}`, a.id);
    }

    // Prepare arrays for bulk insertions
    const newAssignmentRows = [];
    const assignmentMetaList = []; // store for subsequent steps

    for (const cls of allClassrooms) {
      const code = cls.course_code;
      const templates = ASSIGNMENT_CATALOG[code] || ASSIGNMENT_CATALOG['DEFAULT'];

      for (let i = 0; i < templates.length; i++) {
        const tmpl = templates[i];
        const key = `${cls.id}|${tmpl.title}`;
        if (!existingAssMap.has(key)) {
          const dueDate = new Date(Date.now() + (tmpl.daysDue * 24 * 60 * 60 * 1000)).toISOString();
          newAssignmentRows.push([
            cls.id,
            cls.teacher_id,
            tmpl.title,
            tmpl.description,
            tmpl.points,
            dueDate,
            JSON.stringify([`${code}_Assignment_${i + 1}_Specification.pdf`])
          ]);
          assignmentMetaList.push({
            classroom_id: cls.id,
            teacher_id: cls.teacher_id,
            title: tmpl.title,
            description: tmpl.description,
            points: tmpl.points,
            dueDate,
            course_code: code,
            course_name: cls.course_name
          });
        }
      }
    }

    if (newAssignmentRows.length) {
      console.log(`Inserting ${newAssignmentRows.length} assignments in batches...`);
      await bulkInsertChunks(
        'assignments',
        ['classroom_id', 'teacher_id', 'title', 'description', 'points', 'due_date', 'attachments'],
        newAssignmentRows,
        200
      );
    }

    // Refresh assignments from DB
    const allAssignments = await db.query(`SELECT a.*, c.course_code, c.course_name FROM assignments a JOIN classrooms c ON c.id = a.classroom_id`);
    console.log(`✅ Total active assignments in DB: ${allAssignments.length}`);

    // Map: classroom_id -> array of enrolled student objects
    const allEnrolments = await db.query(`
      SELECT cs.classroom_id, u.id as student_id, u.name, u.student_number
      FROM classroom_students cs
      JOIN users u ON u.id = cs.student_id
    `);
    const classroomStudentsMap = new Map();
    for (const e of allEnrolments) {
      if (!classroomStudentsMap.has(e.classroom_id)) classroomStudentsMap.set(e.classroom_id, []);
      classroomStudentsMap.get(e.classroom_id).push(e);
    }

    // 7. Bulk Insert Announcements & Deadlines
    console.log('\n🚀 Step 4: Syncing Announcements and Student Deadlines...');
    const existingAnnouncements = await db.query(`SELECT classroom_id, assignment_id FROM classroom_announcements WHERE assignment_id IS NOT NULL`);
    const existingAnnSet = new Set(existingAnnouncements.map(a => `${a.classroom_id}|${a.assignment_id}`));

    const announcementRows = [];
    const deadlineRows = [];

    for (const a of allAssignments) {
      if (!existingAnnSet.has(`${a.classroom_id}|${a.id}`)) {
        const annTitle = `📢 New Assignment: ${a.title}`;
        const annContent = `Dear students, a new assignment "${a.title}" has been assigned for ${a.course_code}: ${a.course_name}.\n\nPoints: ${a.points} | Due Date: ${new Date(a.due_date).toLocaleDateString()}.\n\nDescription:\n${a.description}`;
        announcementRows.push([
          a.classroom_id, annTitle, annContent, a.id, a.teacher_id
        ]);
      }

      // Enrolled students deadlines
      const stList = classroomStudentsMap.get(a.classroom_id) || [];
      for (const st of stList) {
        deadlineRows.push([
          a.title,
          a.description,
          a.course_code,
          a.course_name,
          a.due_date,
          a.id,
          'high',
          st.student_id,
          'assignment'
        ]);
      }
    }

    if (announcementRows.length) {
      console.log(`Inserting ${announcementRows.length} classroom announcements...`);
      await bulkInsertChunks(
        'classroom_announcements',
        ['classroom_id', 'title', 'content', 'assignment_id', 'author_id'],
        announcementRows,
        300
      );
    }

    // Check existing deadlines
    const existingDeadlines = await db.query(`SELECT assignment_id, user_id FROM deadlines WHERE assignment_id IS NOT NULL`);
    const existingDeadlinesSet = new Set(existingDeadlines.map(d => `${d.assignment_id}|${d.user_id}`));
    const newDeadlineRows = deadlineRows.filter(d => !existingDeadlinesSet.has(`${d[5]}|${d[7]}`));

    if (newDeadlineRows.length) {
      console.log(`Inserting ${newDeadlineRows.length} deadline records across enrolled students...`);
      await bulkInsertChunks(
        'deadlines',
        ['title', 'description', 'course_code', 'course_name', 'deadline_date', 'assignment_id', 'priority', 'user_id', 'type'],
        newDeadlineRows,
        400
      );
    }
    console.log('✅ Announcements and Deadlines synced!');

    // 8. Bulk Insert Submissions & Marks
    console.log('\n🚀 Step 5: Generating Submissions, Grading & Classroom Marks...');
    const existingSubs = await db.query(`SELECT assignment_id, student_id FROM assignment_submissions`);
    const existingSubSet = new Set(existingSubs.map(s => `${s.assignment_id}|${s.student_id}`));

    const subRows = [];
    const markRows = [];

    for (const a of allAssignments) {
      const stList = classroomStudentsMap.get(a.classroom_id) || [];
      if (!stList.length) continue;

      // Sample 3 students + target 231-115-094
      const sampled = stList.slice(0, 3);
      const target = stList.find(s => s.student_number === '231-115-094');
      if (target && !sampled.some(s => s.student_id === target.student_id)) {
        sampled.push(target);
      }

      for (const st of sampled) {
        if (!existingSubSet.has(`${a.id}|${st.student_id}`)) {
          const isTarget = st.student_number === '231-115-094';
          const score = isTarget ? (a.points === 100 ? 98 : 49) : (a.points === 100 ? (85 + (st.student_id % 12)) : (40 + (st.student_id % 8)));
          const feedback = isTarget
            ? 'Outstanding work! Flawless implementation, clean architecture, and comprehensive test suite.'
            : 'Well-structured solution with good test coverage. Check edge cases in boundary conditions.';

          subRows.push([
            a.id,
            st.student_id,
            `Submission for ${a.title}.\nAll test cases verified and benchmarked against reference implementation.`,
            JSON.stringify([`${st.student_number}_${a.course_code}_Assignment.zip`]),
            score,
            feedback
          ]);

          markRows.push([
            a.classroom_id,
            st.student_id,
            a.id,
            'assignment',
            a.title,
            score,
            a.points,
            feedback,
            '2026-09-24'
          ]);
        }
      }
    }

    if (subRows.length) {
      console.log(`Inserting ${subRows.length} assignment submissions...`);
      await bulkInsertChunks(
        'assignment_submissions',
        ['assignment_id', 'student_id', 'submission_text', 'attachments', 'grade', 'feedback'],
        subRows,
        300,
        'ON CONFLICT (assignment_id, student_id) DO NOTHING'
      );

      console.log(`Inserting ${markRows.length} classroom marks...`);
      await bulkInsertChunks(
        'classroom_marks',
        ['classroom_id', 'student_id', 'assignment_id', 'source', 'title', 'marks_obtained', 'total_marks', 'feedback', 'date'],
        markRows,
        300
      );
    }

    // 9. Bulk Insert Classroom Resources & Attendance
    console.log('\n🚀 Step 6: Seeding Classroom Resources & Attendance...');
    const existingRes = await db.query(`SELECT DISTINCT classroom_id FROM classroom_resources`);
    const existingResSet = new Set(existingRes.map(r => r.classroom_id));

    const resourceRows = [];
    const attendanceRows = [];
    const attDates = ['2026-09-20', '2026-09-22', '2026-09-23', '2026-09-24'];

    const existingAtt = await db.query(`SELECT DISTINCT classroom_id FROM classroom_attendance`);
    const existingAttSet = new Set(existingAtt.map(a => a.classroom_id));

    for (const cls of allClassrooms) {
      if (!existingResSet.has(cls.id)) {
        resourceRows.push([
          cls.id,
          `Lecture 01 & 02: ${cls.course_name} Overview & Foundations.pdf`,
          `https://campus.edu/resources/${cls.course_code}_Lecture_01.pdf`,
          cls.teacher_id
        ]);
        resourceRows.push([
          cls.id,
          `${cls.course_code} - Complete Course Syllabus & Assessment Scheme.pdf`,
          `https://campus.edu/resources/${cls.course_code}_Syllabus.pdf`,
          cls.teacher_id
        ]);
      }

      if (!existingAttSet.has(cls.id)) {
        const stList = classroomStudentsMap.get(cls.id) || [];
        for (const d of attDates) {
          for (const st of stList.slice(0, 15)) {
            const status = (st.student_id % 7 === 0) ? 'absent' : 'present';
            attendanceRows.push([
              cls.id, st.student_id, d, status
            ]);
          }
        }
      }
    }

    if (resourceRows.length) {
      console.log(`Inserting ${resourceRows.length} classroom resources...`);
      await bulkInsertChunks(
        'classroom_resources',
        ['classroom_id', 'title', 'file_url', 'uploader_id'],
        resourceRows,
        400
      );
    }

    if (attendanceRows.length) {
      console.log(`Inserting ${attendanceRows.length} classroom attendance records...`);
      await bulkInsertChunks(
        'classroom_attendance',
        ['classroom_id', 'student_id', 'date', 'status'],
        attendanceRows,
        400,
        'ON CONFLICT (classroom_id, student_id, date) DO NOTHING'
      );
    }

    // 10. Final Verification
    console.log('\n======================================================');
    console.log('🎉 SMART CLASSROOM & ASSIGNMENT SEEDING COMPLETED!');
    console.log('======================================================');
    const totalClassrooms = await db.queryOne(`SELECT COUNT(*)::int as count FROM classrooms`);
    const totalTeachersWithClasses = await db.queryOne(`SELECT COUNT(DISTINCT teacher_id)::int as count FROM classrooms`);
    const totalStudentsEnrolled = await db.queryOne(`SELECT COUNT(*)::int as count FROM classroom_students`);
    const totalAssCount = await db.queryOne(`SELECT COUNT(*)::int as count FROM assignments`);
    const totalDeadlinesCount = await db.queryOne(`SELECT COUNT(*)::int as count FROM deadlines WHERE assignment_id IS NOT NULL`);
    const totalSubCount = await db.queryOne(`SELECT COUNT(*)::int as count FROM assignment_submissions`);
    const totalMarksCount = await db.queryOne(`SELECT COUNT(*)::int as count FROM classroom_marks`);
    const totalAnnCount = await db.queryOne(`SELECT COUNT(*)::int as count FROM classroom_announcements`);
    const totalResCount = await db.queryOne(`SELECT COUNT(*)::int as count FROM classroom_resources`);
    const totalAttCount = await db.queryOne(`SELECT COUNT(*)::int as count FROM classroom_attendance`);

    console.log(`📊 Final System Metrics:`);
    console.log(`   - Total Smart Classrooms:      ${totalClassrooms.count}`);
    console.log(`   - Teachers with Classrooms:    ${totalTeachersWithClasses.count} (100% of teachers)`);
    console.log(`   - Total Student Enrolments:    ${totalStudentsEnrolled.count}`);
    console.log(`   - Total Assignments:           ${totalAssCount.count}`);
    console.log(`   - Synced Student Deadlines:    ${totalDeadlinesCount.count}`);
    console.log(`   - Assignment Submissions:      ${totalSubCount.count}`);
    console.log(`   - Classroom Marks Recorded:    ${totalMarksCount.count}`);
    console.log(`   - Classroom Announcements:     ${totalAnnCount.count}`);
    console.log(`   - Classroom Resources/PDFs:    ${totalResCount.count}`);
    console.log(`   - Attendance Records:          ${totalAttCount.count}`);
    console.log('======================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error in bulk seeder:', err);
    process.exit(1);
  }
}

run();
