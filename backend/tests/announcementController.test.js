const test = require('node:test');
const assert = require('node:assert/strict');

const db = require('../config/database');
const announcementController = require('../controllers/announcementController');

const { createMockRes, expectSuccess, patchMethod } = require('./testUtils');

test('getAll merges classroom announcements into the student announcements feed', async () => {
  const restores = [];
  let queryCall = 0;

  restores.push(
    patchMethod(db, 'query', async () => {
      queryCall += 1;

      if (queryCall === 1) {
        return [{
          id: 3,
          title: 'Campus Closed Tomorrow',
          content: 'Administrative holiday.',
          author_id: 1,
          author_name: 'Admin',
          author_role: 'admin',
          author_dept: 'Administration',
          category: 'urgent',
          target_role: 'all',
          is_pinned: true,
          created_at: '2026-04-02T09:00:00.000Z',
          source: 'global',
          is_readonly: false,
          classroom_label: null,
        }];
      }

      return [{
        id: 9,
        classroom_id: 12,
        title: 'New Assignment: Final Project',
        content: 'A new assignment has been posted for CSE-421 - Artificial Intelligence.',
        author_id: 99,
        author_name: 'Prof. Rahman',
        author_role: 'teacher',
        author_dept: 'CSE',
        category: 'academic',
        target_role: 'all',
        is_pinned: false,
        attachment: null,
        created_at: '2026-04-03T09:00:00.000Z',
        source: 'classroom',
        is_readonly: true,
        classroom_label: 'CSE-421 - Artificial Intelligence',
      }];
    })
  );

  const req = {
    query: { page: '1', limit: '10' },
    user: { id: 44, role: 'student' },
  };
  const res = createMockRes();

  try {
    await announcementController.getAll(req, res);
    await expectSuccess(res);

    assert.equal(res.body.announcements.length, 2);

    const classroomAnnouncement = res.body.announcements.find((item) => item.source === 'classroom');
    assert.ok(classroomAnnouncement);
    assert.equal(classroomAnnouncement.id, 'classroom-9');
    assert.equal(classroomAnnouncement.is_readonly, true);
    assert.equal(classroomAnnouncement.classroom_label, 'CSE-421 - Artificial Intelligence');
  } finally {
    restores.reverse().forEach((restore) => restore());
  }
});
