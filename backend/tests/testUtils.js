const assert = require('node:assert/strict');

function createMockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

function patchMethod(target, methodName, implementation) {
  const original = target[methodName];
  target[methodName] = implementation;
  return () => {
    target[methodName] = original;
  };
}

async function expectSuccess(res, statusCode = 200) {
  assert.equal(res.statusCode, statusCode);
  assert.equal(res.body?.success, true);
}

module.exports = {
  createMockRes,
  patchMethod,
  expectSuccess,
};
