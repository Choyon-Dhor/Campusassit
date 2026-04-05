const test = require('node:test');
const assert = require('node:assert/strict');

const repositories = require('../repositories');
const authController = require('../controllers/authController');

const { createMockRes, expectSuccess, patchMethod } = require('./testUtils');

test('getAllUsers returns the full admin user list, including inactive accounts', async () => {
  const restores = [];

  restores.push(
    patchMethod(repositories.userRepo, 'findAllForAdmin', async () => ([
      { id: 1, email: 'active@campus.edu', is_active: true },
      { id: 2, email: 'inactive@campus.edu', is_active: false },
    ]))
  );

  const res = createMockRes();

  try {
    await authController.getAllUsers({}, res);
    await expectSuccess(res);
    assert.equal(res.body.users.length, 2);
    assert.equal(res.body.users[1].is_active, false);
  } finally {
    restores.reverse().forEach((restore) => restore());
  }
});

test('adminToggleUser flips is_active for non-admin accounts', async () => {
  const restores = [];

  restores.push(
    patchMethod(repositories.userRepo, 'findById', async () => ({
      id: 7,
      role: 'student',
      is_active: false,
    }))
  );

  restores.push(
    patchMethod(repositories.userRepo, 'update', async (_id, data) => ({
      id: 7,
      role: 'student',
      is_active: data.is_active,
    }))
  );

  const req = { params: { id: '7' } };
  const res = createMockRes();

  try {
    await authController.adminToggleUser(req, res);
    await expectSuccess(res);
    assert.equal(res.body.user.is_active, true);
    assert.match(res.body.message, /activated/i);
  } finally {
    restores.reverse().forEach((restore) => restore());
  }
});
