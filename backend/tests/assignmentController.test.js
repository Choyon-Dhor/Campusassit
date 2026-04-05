const test = require('node:test');
const assert = require('node:assert/strict');

const db = require('../config/database');
const notificationService = require('../services/NotificationService');
const assignmentController = require('../controllers/assignmentController');

const { createMockRes, expectSuccess, patchMethod } = require('./testUtils');

test('createAssignment stores uploaded file metadata and returns a usable file_path', async () => {
  const restores = [];
  const executedQueries = [];

  restores.push(
    patchMethod(db, 'queryOne', async (sql) => {
      if (sql.includes('FROM classrooms')) {
        return {
          id: 12,
          teacher_id: 99,
          course_code: 'CSE-421',
          course_name: 'Artificial Intelligence',
        };
      }

      if (sql.includes('FROM classroom_announcements')) {
        return null;
      }

      return null;
    })
  );

  let queryCall = 0;
  restores.push(
    patchMethod(db, 'query', async (sql, params) => {
      executedQueries.push({ sql, params });
      queryCall += 1;

      if (queryCall === 1) {
        return [{
          id: 5,
          classroom_id: 12,
          teacher_id: 99,
          title: 'Project Proposal',
          attachments: ['proposal.pdf'],
        }];
      }

      if (queryCall === 2) {
        return [{ student_id: 7 }, { student_id: 8 }];
      }

      return [];
    })
  );

  let notifiedPayload = null;
  restores.push(
    patchMethod(notificationService, 'notify', async (_event, payload) => {
      notifiedPayload = payload;
    })
  );

  const req = {
    body: {
      classroom_id: 12,
      title: 'Project Proposal',
      description: 'Submit a short proposal',
      due_date: '2026-04-20T10:00',
      points: 25,
    },
    user: { id: 99, role: 'teacher' },
    file: { filename: 'proposal.pdf' },
  };
  const res = createMockRes();

  try {
    await assignmentController.createAssignment(req, res);
    await expectSuccess(res, 201);
    assert.equal(res.body.assignment.file_path, 'proposal.pdf');
    assert.deepEqual(res.body.assignment.attachments, ['proposal.pdf']);
    assert.deepEqual(notifiedPayload.userIds, [7, 8]);
    const insertQuery = executedQueries.find(({ sql }) => sql.includes('INSERT INTO assignments'));
    assert.equal(insertQuery.params[6], '["proposal.pdf"]');
  } finally {
    restores.reverse().forEach((restore) => restore());
  }
});

test('createAssignment also publishes classroom activity and deadline records', async () => {
  const restores = [];
  const executedSql = [];

  restores.push(
    patchMethod(db, 'queryOne', async (sql) => {
      if (sql.includes('FROM classrooms')) {
        return {
          id: 12,
          teacher_id: 99,
          course_code: 'CSE-421',
          course_name: 'Artificial Intelligence',
        };
      }

      if (sql.includes('FROM classroom_announcements')) {
        return null;
      }

      return null;
    })
  );

  restores.push(
    patchMethod(db, 'query', async (sql, params) => {
      executedSql.push({ sql, params });

      if (sql.includes('INSERT INTO assignments')) {
        return [{
          id: 15,
          classroom_id: 12,
          teacher_id: 99,
          title: 'Final Project',
          points: 50,
          attachments: [],
        }];
      }

      if (sql.includes('SELECT student_id FROM classroom_students')) {
        return [{ student_id: 7 }, { student_id: 8 }];
      }

      return [];
    })
  );

  let notifiedPayload = null;
  restores.push(
    patchMethod(notificationService, 'notify', async (_event, payload) => {
      notifiedPayload = payload;
    })
  );

  const req = {
    body: {
      classroom_id: 12,
      title: 'Final Project',
      description: 'Build the final semester project.',
      due_date: '2026-04-20T10:00',
      points: 50,
    },
    user: { id: 99, role: 'teacher' },
  };
  const res = createMockRes();

  try {
    await assignmentController.createAssignment(req, res);
    await expectSuccess(res, 201);
    assert.ok(executedSql.some(({ sql }) => sql.includes('INSERT INTO classroom_announcements')));
    assert.ok(executedSql.some(({ sql }) => sql.includes('INSERT INTO deadlines')));
    assert.equal(notifiedPayload.type, 'deadline');
  } finally {
    restores.reverse().forEach((restore) => restore());
  }
});

test('updateAssignment syncs linked classroom activity and deadlines', async () => {
  const restores = [];
  const executedSql = [];

  restores.push(
    patchMethod(db, 'queryOne', async (sql) => {
      if (sql.includes('FROM assignments')) {
        return {
          id: 15,
          classroom_id: 12,
          teacher_id: 99,
          title: 'Final Project',
          description: 'Initial brief',
          due_date: '2026-04-20T10:00:00.000Z',
          points: 50,
          attachments: [],
        };
      }

      if (sql.includes('FROM classrooms')) {
        return {
          id: 12,
          teacher_id: 99,
          course_code: 'CSE-421',
          course_name: 'Artificial Intelligence',
        };
      }

      if (sql.includes('FROM classroom_announcements')) {
        return { id: 71 };
      }

      return null;
    })
  );

  restores.push(
    patchMethod(db, 'query', async (sql, params) => {
      executedSql.push({ sql, params });

      if (sql.includes('UPDATE assignments SET')) {
        return [{
          id: 15,
          classroom_id: 12,
          teacher_id: 99,
          title: 'Final Project Revised',
          description: 'Updated brief',
          due_date: '2026-04-25T10:00:00.000Z',
          points: 60,
          attachments: ['brief.pdf'],
        }];
      }

      if (sql.includes('SELECT student_id FROM classroom_students')) {
        return [{ student_id: 7 }, { student_id: 8 }];
      }

      if (sql.includes('SELECT id, user_id FROM deadlines')) {
        return [{ id: 1, user_id: 7 }, { id: 2, user_id: 8 }];
      }

      return [];
    })
  );

  let notifiedPayload = null;
  restores.push(
    patchMethod(notificationService, 'notify', async (_event, payload) => {
      notifiedPayload = payload;
    })
  );

  const req = {
    params: { id: '15' },
    body: {
      title: 'Final Project Revised',
      description: 'Updated brief',
      due_date: '2026-04-25T10:00',
      points: 60,
    },
    user: { id: 99, role: 'teacher' },
  };
  const res = createMockRes();

  try {
    await assignmentController.updateAssignment(req, res);
    await expectSuccess(res);
    assert.ok(executedSql.some(({ sql }) => sql.includes('UPDATE classroom_announcements SET')));
    assert.ok(executedSql.some(({ sql }) => sql.includes('UPDATE deadlines SET')));
    assert.ok(executedSql.some(({ sql }) => sql.includes('UPDATE classroom_marks SET')));
    assert.equal(notifiedPayload.title, 'Assignment Updated: Final Project Revised');
  } finally {
    restores.reverse().forEach((restore) => restore());
  }
});

test('deleteAssignment removes linked classroom activity and deadlines', async () => {
  const restores = [];
  const executedSql = [];

  restores.push(
    patchMethod(db, 'queryOne', async (sql) => {
      if (sql.includes('FROM assignments')) {
        return {
          id: 15,
          classroom_id: 12,
          teacher_id: 99,
          title: 'Final Project',
        };
      }

      if (sql.includes('FROM classrooms')) {
        return {
          id: 12,
          course_code: 'CSE-421',
          course_name: 'Artificial Intelligence',
        };
      }

      return null;
    })
  );

  restores.push(
    patchMethod(db, 'query', async (sql, params) => {
      executedSql.push({ sql, params });

      if (sql.includes('SELECT student_id FROM classroom_students')) {
        return [{ student_id: 7 }, { student_id: 8 }];
      }

      return [];
    })
  );

  let notifiedPayload = null;
  restores.push(
    patchMethod(notificationService, 'notify', async (_event, payload) => {
      notifiedPayload = payload;
    })
  );

  const req = {
    params: { id: '15' },
    user: { id: 99, role: 'teacher' },
  };
  const res = createMockRes();

  try {
    await assignmentController.deleteAssignment(req, res);
    await expectSuccess(res);
    assert.ok(executedSql.some(({ sql }) => sql.includes('DELETE FROM classroom_announcements')));
    assert.ok(executedSql.some(({ sql }) => sql.includes('DELETE FROM deadlines')));
    assert.ok(executedSql.some(({ sql }) => sql.includes('DELETE FROM assignments')));
    assert.equal(notifiedPayload.title, 'Assignment Removed: Final Project');
  } finally {
    restores.reverse().forEach((restore) => restore());
  }
});

test('submitAssignment accepts the route param id and persists uploaded submissions', async () => {
  const restores = [];
  const executedQueries = [];

  const queryOneResponses = [
    { id: 9, classroom_id: 12 },
    { exists: true },
    null,
  ];
  restores.push(
    patchMethod(db, 'queryOne', async () => queryOneResponses.shift())
  );

  restores.push(
    patchMethod(db, 'query', async (sql, params) => {
      executedQueries.push({ sql, params });
      return ([{
        id: 55,
        assignment_id: 9,
        student_id: 44,
        submission_text: 'Done',
        attachments: ['answer.pdf'],
        submitted_at: '2026-04-03T00:00:00.000Z',
      }]);
    })
  );

  const req = {
    params: { id: '9' },
    body: { submission_text: 'Done' },
    user: { id: 44, role: 'student' },
    file: { filename: 'answer.pdf' },
  };
  const res = createMockRes();

  try {
    await assignmentController.submitAssignment(req, res);
    await expectSuccess(res);
    assert.equal(res.body.submission.assignment_id, 9);
    assert.equal(res.body.submission.file_path, 'answer.pdf');
    assert.deepEqual(res.body.submission.attachments, ['answer.pdf']);
    const insertQuery = executedQueries.find(({ sql }) => sql.includes('INSERT INTO assignment_submissions'));
    assert.equal(insertQuery.params[3], '["answer.pdf"]');
  } finally {
    restores.reverse().forEach((restore) => restore());
  }
});

test('gradeSubmission syncs the classroom marks gradebook automatically', async () => {
  const restores = [];
  const executedQueries = [];

  restores.push(
    patchMethod(db, 'queryOne', async (sql) => {
      if (sql.includes('FROM assignment_submissions s')) {
        return {
          id: 23,
          assignment_id: 15,
          classroom_id: 12,
          student_id: 7,
          teacher_id: 99,
          title: 'Final Project',
          points: 50,
        };
      }

      if (sql.includes('FROM classroom_marks WHERE submission_id')) {
        return null;
      }

      if (sql.includes('FROM classroom_marks WHERE assignment_id')) {
        return null;
      }

      if (sql.includes("FROM classroom_marks") && sql.includes("source = 'manual'")) {
        return null;
      }

      return null;
    })
  );

  restores.push(
    patchMethod(db, 'query', async (sql, params) => {
      executedQueries.push({ sql, params });

      if (sql.includes('UPDATE assignment_submissions SET')) {
        return [{
          id: 23,
          assignment_id: 15,
          student_id: 7,
          grade: 47,
          feedback: 'Strong work',
          graded_at: '2026-04-03T11:00:00.000Z',
          attachments: [],
        }];
      }

      if (sql.includes('INSERT INTO classroom_marks')) {
        return [{
          id: 91,
          assignment_id: 15,
          submission_id: 23,
          source: 'assignment',
          title: 'Final Project',
          marks_obtained: 47,
          total_marks: 50,
          feedback: 'Strong work',
          date: '2026-04-03',
        }];
      }

      return [];
    })
  );

  let notifiedPayload = null;
  restores.push(
    patchMethod(notificationService, 'notify', async (_event, payload) => {
      notifiedPayload = payload;
    })
  );

  const req = {
    params: { id: '23' },
    body: { grade: 47, feedback: 'Strong work' },
    user: { id: 99, role: 'teacher' },
  };
  const res = createMockRes();

  try {
    await assignmentController.gradeSubmission(req, res);
    await expectSuccess(res);
    assert.ok(executedQueries.some(({ sql }) => sql.includes('INSERT INTO classroom_marks')));
    assert.equal(res.body.mark.source, 'assignment');
    assert.equal(res.body.mark.submission_id, 23);
    assert.equal(notifiedPayload.title, 'Assignment Graded: Final Project');
  } finally {
    restores.reverse().forEach((restore) => restore());
  }
});
