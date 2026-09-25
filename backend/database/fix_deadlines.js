// ============================================================
// database/fix_deadlines.js
// Fix: Remove wrong deadline records.
// After enrollment fix, delete deadlines for:
//   1. Fake deadlines (assignment_id = null, fake course codes)
//   2. Assignment deadlines where the student is NOT enrolled
//      in the assignment's classroom
// ============================================================
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../config/database');

async function main() {
  console.log('🔧 Starting deadline fix...\n');

  const before = await db.query(`SELECT COUNT(*) as cnt FROM deadlines`);
  console.log(`📊 Current deadline records: ${before[0].cnt}`);

  // Step 1: Delete fake deadlines (assignment_id IS NULL with fake course codes)
  // These are from the initial seed.js - not real classroom assignments
  const fakeDelete = await db.query(`
    DELETE FROM deadlines
    WHERE assignment_id IS NULL
    AND course_code IN ('CSE101','MATH101','CSE201','PHY101','CSE301','CSE401','MATH201','ENG101','CSE302','CSE201')
  `);
  console.log(`🗑️  Deleted fake/demo deadlines (NULL assignment_id with fake codes)`);

  // Step 2: Delete deadlines where assignment_id is set but student is NOT
  // enrolled in that assignment's classroom
  const wrongAssignmentDelete = await db.query(`
    DELETE FROM deadlines d
    WHERE d.assignment_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM assignments a
      JOIN classroom_students cs ON cs.classroom_id = a.classroom_id
      WHERE a.id = d.assignment_id
        AND cs.student_id = d.user_id
    )
  `);
  console.log(`🗑️  Deleted deadlines for non-enrolled assignment classrooms`);

  // Step 3: Verify remaining
  const after = await db.query(`SELECT COUNT(*) as cnt FROM deadlines`);
  console.log(`\n📊 Remaining deadline records: ${after[0].cnt}`);

  // Step 4: Now re-seed deadlines ONLY for enrolled students' assignments
  console.log('\n🔄 Re-seeding correct deadlines for enrolled students...');

  // Get all assignments with their classrooms
  const assignments = await db.query(`
    SELECT a.id as assignment_id, a.title, a.due_date, a.points,
           c.course_code, c.course_name, c.id as classroom_id
    FROM assignments a
    JOIN classrooms c ON c.id = a.classroom_id
    WHERE a.due_date IS NOT NULL
  `);
  console.log(`📋 Found ${assignments.length} assignments`);

  // Get enrolled students per classroom
  const enrolments = await db.query(`
    SELECT cs.classroom_id, cs.student_id
    FROM classroom_students cs
  `);

  // Build map: classroom_id -> [student_ids]
  const classroomStudentsMap = new Map();
  for (const e of enrolments) {
    if (!classroomStudentsMap.has(e.classroom_id)) {
      classroomStudentsMap.set(e.classroom_id, []);
    }
    classroomStudentsMap.get(e.classroom_id).push(e.student_id);
  }

  // Get existing deadline keys to avoid duplicates
  const existingDeadlines = await db.query(`
    SELECT user_id, assignment_id FROM deadlines WHERE assignment_id IS NOT NULL
  `);
  const existingSet = new Set(existingDeadlines.map(d => `${d.user_id}|${d.assignment_id}`));

  // Build new deadline rows
  const newDeadlineRows = [];
  for (const asgn of assignments) {
    const studentIds = classroomStudentsMap.get(asgn.classroom_id) || [];
    for (const studentId of studentIds) {
      const key = `${studentId}|${asgn.assignment_id}`;
      if (!existingSet.has(key)) {
        newDeadlineRows.push({
          title: asgn.title,
          description: `Assignment for ${asgn.course_name}`,
          course_code: asgn.course_code,
          course_name: asgn.course_name,
          deadline_date: asgn.due_date,
          assignment_id: asgn.assignment_id,
          type: 'assignment',
          priority: 'medium',
          user_id: studentId,
          is_completed: false
        });
        existingSet.add(key);
      }
    }
  }

  console.log(`📝 New deadline records to insert: ${newDeadlineRows.length}`);

  // Bulk insert in chunks
  const CHUNK = 300;
  let inserted = 0;
  for (let i = 0; i < newDeadlineRows.length; i += CHUNK) {
    const chunk = newDeadlineRows.slice(i, i + CHUNK);
    const values = chunk.map((r, idx) => {
      const base = idx * 9;
      return `($${base+1},$${base+2},$${base+3},$${base+4},$${base+5},$${base+6},$${base+7},$${base+8},$${base+9})`;
    }).join(',');
    const params = chunk.flatMap(r => [
      r.title, r.description, r.course_code, r.course_name,
      r.deadline_date, r.assignment_id, r.type, r.priority, r.user_id
    ]);
    await db.query(`
      INSERT INTO deadlines (title, description, course_code, course_name, deadline_date, assignment_id, type, priority, user_id)
      VALUES ${values}
      ON CONFLICT DO NOTHING
    `, params);
    inserted += chunk.length;
    process.stdout.write(`\r  Inserted: ${inserted}/${newDeadlineRows.length}`);
  }

  console.log(`\n✅ Inserted ${inserted} correct deadline records.`);

  // Final count
  const final = await db.query(`SELECT COUNT(*) as cnt FROM deadlines`);
  console.log(`\n📊 Final deadline records: ${final[0].cnt}`);

  // Sanity check: how many deadlines does one student have?
  console.log('\n🔍 Sample student deadline counts:');
  const sampleCounts = await db.query(`
    SELECT u.name, u.batch_number, u.batch_section, COUNT(d.id) as deadline_count
    FROM deadlines d
    JOIN users u ON u.id = d.user_id
    WHERE u.role = 'student'
    GROUP BY u.id, u.name, u.batch_number, u.batch_section
    ORDER BY deadline_count DESC
    LIMIT 10
  `);
  sampleCounts.forEach(r =>
    console.log(`  ${r.name} (${r.batch_number}/${r.batch_section}): ${r.deadline_count} deadlines`)
  );

  console.log('\n✅ Deadline fix complete!');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
