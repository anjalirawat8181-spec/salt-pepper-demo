import test from 'node:test';
import assert from 'node:assert/strict';

import { createSalt, hashPasswordForStorage, verifyPassword } from '../utils/password.js';

process.env.PASSWORD_PEPPER = process.env.PASSWORD_PEPPER || 'test-pepper-secret-value-123';

test('generate unique salts for different password operations', () => {
  const firstSalt = createSalt();
  const secondSalt = createSalt();

  assert.notEqual(firstSalt, secondSalt);
  assert.equal(typeof firstSalt, 'string');
  assert.ok(firstSalt.length >= 32);
});

test('same password with different salts creates different hashes', async () => {
  const first = await hashPasswordForStorage('Password123!', createSalt());
  const second = await hashPasswordForStorage('Password123!', createSalt());

  assert.notEqual(first.passwordHash, second.passwordHash);
  assert.notEqual(first.passwordSalt, second.passwordSalt);
});

test('verifyPassword accepts correct credentials and rejects incorrect ones', async () => {
  const salt = createSalt();
  const stored = await hashPasswordForStorage('Password123!', salt);

  const valid = await verifyPassword('Password123!', stored.passwordHash, salt);
  const invalid = await verifyPassword('WrongPassword123!', stored.passwordHash, salt);

  assert.equal(valid, true);
  assert.equal(invalid, false);
});

test('password version is recorded for traceability', async () => {
  const stored = await hashPasswordForStorage('Password123!');
  assert.equal(stored.passwordVersion, 'bcrypt-hmac-sha256-v1');
});
