// backend/database/seed_mu_notices.js
require('dotenv').config();
const db = require('../config/database');

async function seedNotices() {
  try {
    console.log('🔗 Connecting to Supabase...');

    // 1. Check announcements table schema
    const cols = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'announcements'
      ORDER BY ordinal_position
    `);
    console.log('Columns in announcements:', cols.map(c => `${c.column_name} (${c.data_type})`).join(', '));

    // 2. Find an admin or registrar user to be the author
    let author = await db.queryOne(`SELECT id, name FROM users WHERE role = 'admin' LIMIT 1`);
    if (!author) {
      author = await db.queryOne(`SELECT id, name FROM users LIMIT 1`);
    }
    console.log(`Using Author: ${author?.name} (${author?.id})`);

    // 3. Official notices fetched from https://metrouni.edu.bd/sites/university/announcement and news
    const muNotices = [
      {
        title: 'Class Suspension at Metropolitan University on September 15, 2026',
        content: `This is for the information of all concerned that, on the occasion of the visit to Sylhet by the Honorable President of the People's Republic of Bangladesh to attend a civic reception, all academic classes and university operations will remain suspended on September 15, 2026. Normal academic and administrative schedules will resume on the following working day.`,
        category: 'general',
        target_role: 'all',
        is_pinned: true,
        created_at: '2026-09-14T09:00:00Z'
      },
      {
        title: 'পবিত্র ঈদ-ই-মিলাদুন্নবী (সাল্লাল্লাহু আলাইহি ওয়াসাল্লাম) – ২০২৬ খ্রিস্টাব্দ (১৪৪৮ হিজরি) উপলক্ষ্যে বন্ধের নোটিশ',
        content: `সংশ্লিষ্ট সকলের অবগতির জন্য জানানো যাচ্ছে যে, পবিত্র ঈদ-ই-মিলাদুন্নবী (সাল্লাল্লাহু আলাইহি ওয়াসাল্লাম) – ২০২৬ খ্রিস্টাব্দ (১৪৪৮ হিজরি) উপলক্ষ্যে বিশ্ববিদ্যালয়ের সকল ক্লাস এবং প্রশাসনিক কার্যক্রম বন্ধ থাকবে। উক্ত উপলক্ষ্যে বিশ্ববিদ্যালয় প্রাঙ্গণে বাদ জোহর বিশেষ দোয়া ও আলোচনা সভার আয়োজন করা হয়েছে।`,
        category: 'general',
        target_role: 'all',
        is_pinned: false,
        created_at: '2026-08-25T10:00:00Z'
      },
      {
        title: 'July Mass Uprising Day - University Holiday Notice',
        content: `This is to inform all concerned that the University will remain closed on Wednesday, 05 August 2026, on the occasion of "July Mass Uprising Day." All academic classes, examinations, and administrative offices will remain closed. This notice is issued with the approval of the competent authority.`,
        category: 'general',
        target_role: 'all',
        is_pinned: false,
        created_at: '2026-08-03T09:30:00Z'
      },
      {
        title: 'Notice for Spring Supplementary Examination 2026',
        content: `Spring Term Supplementary Examination 2026 for the students of different programmes who failed or did not appear in courses during the Spring Term Final Examination 2026 will commence from the designated schedule. Students are requested to contact their respective department coordination offices, clear dues, and submit the supplementary examination form by the deadline.`,
        category: 'academic',
        target_role: 'student',
        is_pinned: true,
        created_at: '2026-06-18T11:00:00Z'
      },
      {
        title: 'Appointment of Dean (Additional Charge), School of Science and Technology',
        content: `This is to notify all concerned that Professor Md. Ishrat Ibne Ismail, Pro-Vice Chancellor, Metropolitan University, has been assigned with the additional responsibility of Dean, School of Science and Technology. All departments under the school will coordinate through the Dean's office accordingly.`,
        category: 'general',
        target_role: 'all',
        is_pinned: false,
        created_at: '2026-06-10T08:30:00Z'
      },
      {
        title: 'Fresher’s Departmental Orientation Programme for Summer 2026',
        content: `This is to inform all concerned that the Fresher’s Departmental Orientation Programme for Summer 2026 will be held at 11:00 AM at the University Auditorium. All newly enrolled students of Batch 58, 59, and incoming batches are warmly welcomed to attend. Respective department heads, faculty members, and student advisors will be present to guide the freshers.`,
        category: 'academic',
        target_role: 'all',
        is_pinned: false,
        created_at: '2026-06-09T10:00:00Z'
      },
      {
        title: 'Holidays on the Occasion of Holy Eid-ul-Azha 2026',
        content: `This is to inform all students, faculty members, and staff that the University shall remain closed from 24 May 2026 (Sunday) to 04 June 2026 (Thursday) on the occasion of Holy Eid-ul-Azha. However, university security, emergency IT maintenance, and designated emergency staff shall perform their duties as per roster.`,
        category: 'general',
        target_role: 'all',
        is_pinned: false,
        created_at: '2026-05-20T09:00:00Z'
      },
      {
        title: 'Metropolitan University Showcases Innovation at Bangladesh’s Largest AI Build-a-thon',
        content: `Metropolitan University proudly demonstrated its strong research and software engineering prowess at the MillionX Bangladesh AI Build-a-thon and Artificial Intelligence Genesis Conference in Dhaka. Multiple student teams from the Department of Computer Science & Engineering presented cutting-edge AI systems, campus automation platforms, and machine learning models, receiving high accolades from international judges.`,
        category: 'academic',
        target_role: 'all',
        is_pinned: false,
        created_at: '2026-01-18T14:00:00Z'
      },
      {
        title: 'Metropolitan University Hosts English Skills Programme with Cambridge University Press',
        content: `Metropolitan University, in collaboration with Cambridge University Press & Assessment, hosted a high-impact symposium titled "From Curriculum to Career: Aligning English Communication with Industry Standards" at Professor M. Habibur Rahman Library Hall. Faculty members, researchers, and students actively participated in interactive workshops on technical writing and international workplace communication.`,
        category: 'academic',
        target_role: 'all',
        is_pinned: false,
        created_at: '2026-04-29T12:00:00Z'
      },
      {
        title: 'Library Extended Hours & Research Cell Online Access',
        content: `To facilitate final examinations and research publication work, the Professor M. Habibur Rahman Central Library will remain open until 09:00 PM on all weekdays. Students and researchers can access IEEE Xplore, ACM Digital Library, and Springer Nature via university network authentication.`,
        category: 'general',
        target_role: 'all',
        is_pinned: false,
        created_at: '2026-04-10T10:00:00Z'
      }
    ];

    console.log(`Inserting ${muNotices.length} official MU notices...`);

    for (const notice of muNotices) {
      // Check if already exists by title
      const exists = await db.queryOne(`SELECT id FROM announcements WHERE title = $1`, [notice.title]);
      if (exists) {
        await db.query(
          `UPDATE announcements 
           SET content = $1, category = $2, target_role = $3, is_pinned = $4, updated_at = NOW()
           WHERE id = $5`,
          [notice.content, notice.category, notice.target_role, notice.is_pinned, exists.id]
        );
        console.log(`Updated: "${notice.title.substring(0, 45)}..."`);
      } else {
        await db.query(
          `INSERT INTO announcements (author_id, title, content, category, target_role, is_pinned, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
          [author.id, notice.title, notice.content, notice.category, notice.target_role, notice.is_pinned, notice.created_at]
        );
        console.log(`Inserted: "${notice.title.substring(0, 45)}..."`);
      }
    }

    const total = await db.queryOne(`SELECT COUNT(*)::int AS count FROM announcements`);
    console.log(`\n🎉 Done! Total announcements in database: ${total.count}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding MU notices:', err);
    process.exit(1);
  }
}

seedNotices();
