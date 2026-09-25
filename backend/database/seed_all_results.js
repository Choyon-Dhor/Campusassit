// ============================================================
// database/seed_all_results.js
// Seeds exact results for 231-115-094 and realistic dummy results
// for all students across Batch 58 into Supabase PostgreSQL
// Run: node database/seed_all_results.js
// ============================================================
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../config/database');

const semestersDefinition = [
  {
    code: '1:1',
    name: 'Spring 2023',
    courses: [
      { code: 'CSE-125', title: 'Discrete Mathematics', ch: 3.0 },
      { code: 'ENG-114', title: 'English I', ch: 3.0 },
      { code: 'GED-201', title: 'Bangladesh Studies', ch: 3.0 },
      { code: 'GED-202', title: 'History of Emergence of Bangladesh', ch: 3.0 },
      { code: 'MAT-112', title: 'Differential & Integral Calculus', ch: 3.0 },
      { code: 'PHY-111', title: 'Physics I', ch: 3.0 },
    ]
  },
  {
    code: '1:2',
    name: 'Summer 2023',
    courses: [
      { code: 'CSE-121', title: 'Structured Programming', ch: 3.0 },
      { code: 'CSE-122', title: 'Structured Programming Lab', ch: 1.5 },
      { code: 'CSE-123', title: 'Basic Electrical Engineering', ch: 3.0 },
      { code: 'CSE-124', title: 'Basic Electrical Engineering Lab', ch: 1.5 },
      { code: 'ENG-115', title: 'English II', ch: 3.0 },
      { code: 'GED-119', title: 'Engineering Ethics and Cyber Law', ch: 2.0 },
      { code: 'MAT-123', title: 'Differential Equation & Laplace Transform', ch: 3.0 },
      { code: 'PHY-123', title: 'Physics II', ch: 3.0 },
    ]
  },
  {
    code: '2:1',
    name: 'Spring 2024',
    courses: [
      { code: 'CSE-131', title: 'Basic Electronics Engineering', ch: 3.0 },
      { code: 'CSE-132', title: 'Basic Electronics Engineering Lab', ch: 1.5 },
      { code: 'CSE-133', title: 'Data Structure', ch: 3.0 },
      { code: 'CSE-134', title: 'Data Structure Lab', ch: 1.5 },
      { code: 'GED-213', title: 'Principles of Economics and Entrepreneurship Development', ch: 3.0 },
      { code: 'MAT-135', title: 'Matrices, Complex Variable & Fourier Analysis', ch: 3.0 },
      { code: 'STA-215', title: 'Basic Statistics & Probability', ch: 3.0 },
    ]
  },
  {
    code: '2:2',
    name: 'Summer 2024',
    courses: [
      { code: 'CSE-200', title: 'Competitive Programming', ch: 1.5 },
      { code: 'CSE-211', title: 'Digital Logic Design', ch: 3.0 },
      { code: 'CSE-212', title: 'Digital Logic Design Lab', ch: 1.5 },
      { code: 'CSE-231', title: 'Algorithm Design and Analysis', ch: 3.0 },
      { code: 'CSE-232', title: 'Algorithm Design and Analysis Lab', ch: 1.5 },
      { code: 'GED-431', title: 'Business Communication', ch: 3.0 },
      { code: 'MAT-216', title: 'Geometry & Vector Analysis', ch: 3.0 },
    ]
  },
  {
    code: '3:1',
    name: 'Spring 2025',
    courses: [
      { code: 'CSE-213', title: 'Computer Organization and Architecture', ch: 3.0 },
      { code: 'CSE-221', title: 'Object Oriented Programming', ch: 3.0 },
      { code: 'CSE-222', title: 'Object Oriented Programming Lab', ch: 1.5 },
      { code: 'GED-215', title: 'Industrial Management and Financial Accounting', ch: 3.0 },
      { code: 'MAT-235', title: 'Numerical Methods', ch: 3.0 },
    ]
  },
  {
    code: '3:2',
    name: 'Summer 2025',
    courses: [
      { code: 'CSE-223', title: 'Database Management System', ch: 3.0 },
      { code: 'CSE-224', title: 'Database Management System Lab', ch: 1.5 },
      { code: 'CSE-237', title: 'Microprocessor and Interfacing', ch: 3.0 },
      { code: 'CSE-238', title: 'Microprocessor and Interfacing Lab', ch: 1.5 },
      { code: 'CSE-327', title: 'Theory of Computation', ch: 3.0 },
    ]
  },
  {
    code: '3:3',
    name: 'Autumn 2025',
    courses: [
      { code: 'CSE-215', title: 'Communication Engineering', ch: 3.0 },
      { code: 'CSE-321', title: 'Operating System', ch: 3.0 },
      { code: 'CSE-322', title: 'Operating System Lab', ch: 1.5 },
      { code: 'CSE-421', title: 'Artificial Intelligence', ch: 3.0 },
      { code: 'CSE-422', title: 'Artificial Intelligence Lab', ch: 1.5 },
    ]
  },
  {
    code: '4:1',
    name: 'Spring 2026',
    courses: [
      { code: 'CSE-499', title: 'Project', ch: 3.0 },
      { code: 'CSE-330', title: 'Web Programming Lab', ch: 1.5 },
      { code: 'CSE-313', title: 'Software Engineering and Design Pattern', ch: 3.0 },
      { code: 'CSE-314', title: 'Software Engineering and Design Pattern Lab', ch: 1.5 },
      { code: 'TWP-401', title: 'Technical Writing and Presentation', ch: 1.5 },
      { code: 'CSE-471', title: 'Machine Learning', ch: 3.0 },
      { code: 'CSE-472', title: 'Machine Learning Lab', ch: 1.5 },
    ]
  }
];

// Exact grades mapping for student 231-115-094
const targetStudentGrades = {
  // Summer 2023 English II is A (3.75)
  '1:2_ENG-115': { lg: 'A', gp: 3.75 },
  // Autumn 2025 Artificial Intelligence Lab is A (3.75)
  '3:3_CSE-422': { lg: 'A', gp: 3.75 },
  // All other courses for 231-115-094 default to A+ (4.00)
};

// Distribution of grades for dummy results
const gradePool = [
  { lg: 'A+', gp: 4.00, weight: 35 },
  { lg: 'A',  gp: 3.75, weight: 30 },
  { lg: 'A-', gp: 3.50, weight: 18 },
  { lg: 'B+', gp: 3.25, weight: 10 },
  { lg: 'B',  gp: 3.00, weight: 5 },
  { lg: 'B-', gp: 2.75, weight: 2 },
];

function pickGradeForDummy(studentSeed, semIdx, courseIdx) {
  // Deterministic pseudo-random based on hash
  const hash = Math.abs((studentSeed * 48271 + semIdx * 31337 + courseIdx * 7919) % 100);
  let cumulative = 0;
  for (const g of gradePool) {
    cumulative += g.weight;
    if (hash < cumulative) {
      return { lg: g.lg, gp: g.gp };
    }
  }
  return { lg: 'A', gp: 3.75 };
}

async function run() {
  console.log('📊 Starting Results Seeder for 231-115-094 & all students...\n');
  const ok = await db.testConnection();
  if (!ok) {
    console.error('Database connection failed.');
    process.exit(1);
  }

  // 1. Clear old results
  await db.query(`DELETE FROM results`);
  console.log('🧹 Cleared existing results table.');

  // 2. Fetch all student users
  const students = await db.query(`
    SELECT id, name, email, student_number, batch_number, batch_section
    FROM users
    WHERE role = 'student'
    ORDER BY id ASC
  `);

  console.log(`👨‍🎓 Found ${students.length} students in the database.`);

  const allResultRows = [];

  for (let sIdx = 0; sIdx < students.length; sIdx++) {
    const s = students[sIdx];
    const studentNum = s.student_number || `231-115-${String(s.id).padStart(3, '0')}`;
    const batchSec = s.batch_section ? `58th[${s.batch_section}]` : '58th[A]';

    // Is this the primary target student?
    const isTarget = studentNum.includes('231-115-094');

    for (let semIdx = 0; semIdx < semestersDefinition.length; semIdx++) {
      const sem = semestersDefinition[semIdx];

      for (let cIdx = 0; cIdx < sem.courses.length; cIdx++) {
        const c = sem.courses[cIdx];

        let lg = 'A+';
        let gp = 4.00;

        if (isTarget) {
          const key = `${sem.code}_${c.code}`;
          if (targetStudentGrades[key]) {
            lg = targetStudentGrades[key].lg;
            gp = targetStudentGrades[key].gp;
          } else {
            lg = 'A+';
            gp = 4.00;
          }
        } else {
          // Dummy student grade
          const grade = pickGradeForDummy(s.id || sIdx + 1, semIdx, cIdx);
          lg = grade.lg;
          gp = grade.gp;
        }

        allResultRows.push([
          s.id,
          studentNum,
          sem.code,
          sem.name,
          c.code,
          c.title,
          'Regular',
          c.ch,
          batchSec,
          lg,
          gp,
          true,
          '2026-06-15'
        ]);
      }
    }
  }

  console.log(`📦 Generated ${allResultRows.length} total result records.`);
  console.log('🚀 Bulk inserting into Supabase in chunks of 400...');

  const chunkSize = 400;
  let totalInserted = 0;

  for (let i = 0; i < allResultRows.length; i += chunkSize) {
    const chunk = allResultRows.slice(i, i + chunkSize);
    
    // Build multi-row parameterized query
    const valuePlaceholders = [];
    const flatParams = [];
    let pIdx = 1;

    for (const row of chunk) {
      const placeholders = [];
      for (const val of row) {
        placeholders.push(`$${pIdx++}`);
        flatParams.push(val);
      }
      valuePlaceholders.push(`(${placeholders.join(', ')})`);
    }

    const sql = `
      INSERT INTO results
        (student_id, student_number, semester_code, semester_name,
         course_code, course_title, status, credit_hours, batch_section,
         letter_grade, grade_point, is_published, publish_date)
      VALUES ${valuePlaceholders.join(',\n')}
    `;

    await db.query(sql, flatParams);
    totalInserted += chunk.length;
    process.stdout.write(`   Progress: ${totalInserted} / ${allResultRows.length} (${Math.round((totalInserted / allResultRows.length) * 100)}%)\r`);
  }

  console.log(`\n\n🎉 Successfully inserted ${totalInserted} results records!`);

  // 3. Verify target student 231-115-094
  const targetVerification = await db.query(`
    SELECT semester_code, semester_name, COUNT(*) as courses, ROUND(AVG(grade_point), 2) as sem_gpa
    FROM results
    WHERE student_number LIKE '%231-115-094%'
    GROUP BY semester_code, semester_name
    ORDER BY semester_code ASC
  `);

  console.log('\n🌟 Target Student (231-115-094) Summary:');
  for (const t of targetVerification) {
    console.log(`   - ${t.semester_code} (${t.semester_name}): ${t.courses} courses, GPA: ${t.sem_gpa}`);
  }

  const overall = await db.queryOne(`
    SELECT 
      COUNT(*) as total_courses,
      ROUND(SUM(credit_hours * grade_point) / SUM(credit_hours), 2) as cgpa,
      SUM(credit_hours) as total_credits
    FROM results
    WHERE student_number LIKE '%231-115-094%'
  `);
  console.log(`\n🏆 Overall CGPA for 231-115-094: ${overall.cgpa} / 4.00 (${overall.total_credits} credits across ${overall.total_courses} courses)`);

  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Seeder error:', err);
  process.exit(1);
});
