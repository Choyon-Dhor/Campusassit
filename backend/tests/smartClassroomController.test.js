const test = require('node:test');
const assert = require('node:assert/strict');

const db = require('../config/database');
const smartClassroomController = require('../controllers/smartClassroomController');

const { createMockRes, expectSuccess, patchMethod } = require('./testUtils');

test('teacher attendance view returns class-wide attendance when no student_id is supplied', async () => {
  const restores = [];

  restores.push(
    patchMethod(db, 'queryOne', async () => ({ id: 1, teacher_id: 11 }))
  );

  restores.push(
    patchMethod(db, 'query', async () => ([
      { classroom_id: 1, student_id: 2, date: '2026-04-01', status: 'present' },
      { classroom_id: 1, student_id: 3, date: '2026-04-01', status: 'absent' },
    ]))
  );

  const req = {
    params: { id: '1' },
    query: {},
    user: { id: 11, role: 'teacher' },
  };
  const res = createMockRes();

  try {
    await smartClassroomController.getAttendance(req, res);
    await expectSuccess(res);
    assert.equal(res.body.attendance.length, 2);
    assert.equal(res.body.analytics.totalClasses, 2);
    assert.equal(res.body.analytics.present, 1);
  } finally {
    restores.reverse().forEach((restore) => restore());
  }
});

test('teacher marks view returns class-wide marks when no student_id is supplied', async () => {
  const restores = [];

  restores.push(
    patchMethod(db, 'query', async () => ([
      { classroom_id: 1, student_id: 2, marks_obtained: 18, total_marks: 20, date: '2026-04-01' },
      { classroom_id: 1, student_id: 3, marks_obtained: 15, total_marks: 20, date: '2026-04-01' },
    ]))
  );

  const req = {
    params: { id: '1' },
    query: {},
    user: { id: 11, role: 'teacher' },
  };
  const res = createMockRes();

  try {
    await smartClassroomController.getMarks(req, res);
    await expectSuccess(res);
    assert.equal(res.body.marks.length, 2);
    assert.equal(res.body.summary.totalScored, 33);
    assert.equal(res.body.summary.totalMax, 40);
  } finally {
    restores.reverse().forEach((restore) => restore());
  }
});
