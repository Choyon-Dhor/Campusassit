// ============================================================
// database/fix_enrollments.js
// Fix: Delete wrong classroom_students records and re-enroll
// students ONLY in classrooms matching their batch + section.
// ============================================================
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../config/database');

async function main() {
  console.log('🔧 Starting enrollment fix...\n');

  // 1. Count current (wrong) enrollments
  const beforeCount = await db.query(`SELECT COUNT(*) as cnt FROM classroom_students`);
  console.log(`📊 Current enrollment records: ${beforeCount[0].cnt}`);

  // 2. Fetch all students with their batch info
  const students = await db.query(`
    SELECT id, name, student_number, batch_number, batch_section
    FROM users
    WHERE role = 'student'
    ORDER BY id
  `);
  console.log(`👨‍🎓 Students loaded: ${students.length}`);

  // 3. Fetch all classrooms
  const classrooms = await db.query(`
    SELECT id, course_code, course_name, batch, section
    FROM classrooms
    ORDER BY id
  `);
  console.log(`🏢 Classrooms loaded: ${classrooms.length}`);

  // 4. Build section-to-sections expansion map
  // e.g., a student in section "B" should match classrooms with section "B", "B+I", "B+1"
  // a student in section "I" should match "I", "B+I", "B+1"
  function studentMatchesClassroomSection(studentSection, classroomSection) {
    const s = (studentSection || '').trim().toUpperCase();
    const c = (classroomSection || '').trim().toUpperCase()
      .replace(/1/g, 'I'); // normalize '1' -> 'I'

    if (!s || !c) return false;

    // Split composite classroom sections like "B+I", "C+G", "D+H", "E+F", "A+D"
    const classroomParts = c.split(/[+,/&]/).map(p => p.trim()).filter(Boolean);
    const studentParts = s.split(/[+,/&]/).map(p => p.trim()).filter(Boolean);

    // Match if ANY student section part is in ANY classroom section part
    return studentParts.some(sp => classroomParts.includes(sp));
  }

  // 5. Build correct enrollment rows
  console.log('\n📋 Computing correct enrollments...');
  const enrollmentSet = new Set(); // "classroom_id|student_id"
  const enrollmentRows = [];

  for (const student of students) {
    const batchNum = (student.batch_number || '58').toString().trim();
    const section = (student.batch_section || '').trim().toUpperCase()
      .replace(/1/g, 'I'); // normalize

    // Skip students with no section info
    if (!section || section === 'NONE' || section === '') {
      continue;
    }

    for (const cls of classrooms) {
      const clsBatch = (cls.batch || '').toString().trim();

      // Must match batch number
      if (clsBatch !== batchNum) continue;

      // Must match section
      if (!studentMatchesClassroomSection(section, cls.section)) continue;

      const key = `${cls.id}|${student.id}`;
      if (!enrollmentSet.has(key)) {
        enrollmentSet.add(key);
        enrollmentRows.push({ classroom_id: cls.id, student_id: student.id });
      }
    }
  }

  console.log(`✅ Correct enrollments computed: ${enrollmentRows.length}`);

  if (enrollmentRows.length === 0) {
    console.log('⚠️  No valid enrollments found! Check batch_number/batch_section in users table.');
    console.log('\nSample students:');
    students.slice(0, 10).forEach(s =>
      console.log(`  ${s.name} | batch: ${s.batch_number} | section: ${s.batch_section}`)
    );
    console.log('\nSample classrooms:');
    classrooms.slice(0, 10).forEach(c =>
      console.log(`  ${c.course_code} | batch: ${c.batch} | section: ${c.section}`)
    );
    process.exit(1);
  }

  // 6. Delete all existing enrollments
  console.log('\n🗑️  Deleting all existing enrollment records...');
  await db.query(`DELETE FROM classroom_students`);
  console.log('✅ Deleted all old enrollments.');

  // 7. Bulk insert correct enrollments in chunks
  const CHUNK = 400;
  let inserted = 0;
  for (let i = 0; i < enrollmentRows.length; i += CHUNK) {
    const chunk = enrollmentRows.slice(i, i + CHUNK);
    const values = chunk.map((r, idx) => `($${idx * 2 + 1}, $${idx * 2 + 2})`).join(',');
    const params = chunk.flatMap(r => [r.classroom_id, r.student_id]);
    await db.query(
      `INSERT INTO classroom_students (classroom_id, student_id) VALUES ${values} ON CONFLICT (classroom_id, student_id) DO NOTHING`,
      params
    );
    inserted += chunk.length;
    process.stdout.write(`\r  Inserted: ${inserted}/${enrollmentRows.length}`);
  }
  console.log(`\n✅ Re-enrolled ${inserted} student-classroom pairs.`);

  // 8. Verification
  const afterCount = await db.query(`SELECT COUNT(*) as cnt FROM classroom_students`);
  console.log(`\n📊 Final enrollment records: ${afterCount[0].cnt}`);

  // 9. Show sample
  console.log('\n📋 Sample enrollments (first 10):');
  const sample = await db.query(`
    SELECT u.name, u.batch_number, u.batch_section, c.course_code, c.batch as cls_batch, c.section as cls_section
    FROM classroom_students cs
    JOIN users u ON u.id = cs.student_id
    JOIN classrooms c ON c.id = cs.classroom_id
    LIMIT 10
  `);
  sample.forEach(r =>
    console.log(`  ${r.name} (${r.batch_number}/${r.batch_section}) -> ${r.course_code} [${r.cls_batch}/${r.cls_section}]`)
  );

  // 10. Sanity check: how many classrooms does each student have?
  console.log('\n🔍 Students with most classrooms (sanity check):');
  const topEnrolled = await db.query(`
    SELECT u.name, u.batch_number, u.batch_section, COUNT(cs.classroom_id) as cls_count
    FROM classroom_students cs
    JOIN users u ON u.id = cs.student_id
    GROUP BY u.id, u.name, u.batch_number, u.batch_section
    ORDER BY cls_count DESC
    LIMIT 10
  `);
  topEnrolled.forEach(r =>
    console.log(`  ${r.name} (${r.batch_number}/${r.batch_section}): ${r.cls_count} classrooms`)
  );

  console.log('\n✅ Enrollment fix complete!');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
