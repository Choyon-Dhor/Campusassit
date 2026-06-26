const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');

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
test('forgotPassword creates a reset token for an active user without exposing account lookup misses', async () => {
  const restores = [];
  let createdToken = null;

  restores.push(
    patchMethod(repositories.userRepo, 'findByEmail', async () => ({
      id: 11,
      email: 'alice@student.edu',
      is_active: true,
    }))
  );

  restores.push(
    patchMethod(repositories.passwordResetTokenRepo, 'createForUser', async (userId, tokenHash, expiresAt) => {
      createdToken = { userId, tokenHash, expiresAt };
      return { id: 1, user_id: userId, token_hash: tokenHash, expires_at: expiresAt };
    })
  );

  const req = { body: { email: 'alice@student.edu' } };
  const res = createMockRes();

  try {
    await authController.forgotPassword(req, res);
    await expectSuccess(res);
    assert.equal(createdToken.userId, 11);
    assert.notEqual(createdToken.tokenHash, res.body.resetToken);
    assert.ok(createdToken.expiresAt instanceof Date);
    assert.match(res.body.resetUrl, new RegExp(`/reset-password/${res.body.resetToken}$`));
  } finally {
    restores.reverse().forEach((restore) => restore());
  }
});

test('resetPassword updates password and consumes outstanding reset tokens', async () => {
  const restores = [];
  let updatedHash = null;
  let markedUserId = null;

  restores.push(
    patchMethod(repositories.passwordResetTokenRepo, 'findValidByHash', async () => ({
      id: 3,
      user_id: 22,
      is_active: true,
    }))
  );

  restores.push(
    patchMethod(repositories.userRepo, 'update', async (id, data) => {
      assert.equal(id, 22);
      updatedHash = data.password;
      return { id, ...data };
    })
  );

  restores.push(
    patchMethod(repositories.passwordResetTokenRepo, 'markUserTokensUsed', async (userId) => {
      markedUserId = userId;
      return [];
    })
  );

  const req = { body: { token: 'valid-reset-token', newPassword: 'newpass123' } };
  const res = createMockRes();

  try {
    await authController.resetPassword(req, res);
    await expectSuccess(res);
    assert.equal(markedUserId, 22);
    assert.equal(await bcrypt.compare('newpass123', updatedHash), true);
  } finally {
    restores.reverse().forEach((restore) => restore());
  }
});

test('adminResetUserPassword lets an admin replace any user password', async () => {
  const restores = [];
  let updatedHash = null;
  let markedUserId = null;

  restores.push(
    patchMethod(repositories.userRepo, 'findById', async () => ({
      id: 7,
      email: 'teacher@campus.edu',
      role: 'teacher',
    }))
  );

  restores.push(
    patchMethod(repositories.userRepo, 'update', async (id, data) => {
      assert.equal(id, '7');
      updatedHash = data.password;
      return { id, ...data };
    })
  );

  restores.push(
    patchMethod(repositories.passwordResetTokenRepo, 'markUserTokensUsed', async (userId) => {
      markedUserId = userId;
      return [];
    })
  );

  const req = { params: { id: '7' }, body: { newPassword: 'teacher789' } };
  const res = createMockRes();

  try {
    await authController.adminResetUserPassword(req, res);
    await expectSuccess(res);
    assert.equal(markedUserId, '7');
    assert.equal(await bcrypt.compare('teacher789', updatedHash), true);
  } finally {
    restores.reverse().forEach((restore) => restore());
  }
});

