import test from 'node:test';
import assert from 'node:assert/strict';

import { ensureAdminUser } from './ensureAdmin.js';

test('ensureAdminUser creates a default admin when no admin exists', async () => {
  const calls = [];
  const created = { email: 'admin@rentalls.com', role: 'user' };
  const userModel = {
    findOne: async ({ email }) => {
      calls.push(['findOne', email]);
      return null;
    },
    create: async (payload) => {
      calls.push(['create', payload]);
      return { ...payload };
    },
  };

  const result = await ensureAdminUser({
    userModel,
    email: 'admin@rentalls.com',
    password: 'ChangeMe123!',
    hashPassword: async () => 'hashed-password',
  });

  assert.equal(result.role, 'admin');
  assert.deepEqual(calls[0], ['findOne', 'admin@rentalls.com']);
  assert.deepEqual(calls[1], ['create', {
    email: 'admin@rentalls.com',
    password_hash: 'hashed-password',
    full_name: 'RentAlls Admin',
    role: 'admin',
    is_verified: true,
  }]);
});

test('ensureAdminUser promotes an existing non-admin user to admin', async () => {
  const saved = [];
  const user = {
    email: 'admin@rentalls.com',
    role: 'user',
    is_verified: false,
    save: async () => {
      saved.push(true);
    },
  };

  const userModel = {
    findOne: async () => user,
    create: async () => {
      throw new Error('should not create');
    },
  };

  const result = await ensureAdminUser({
    userModel,
    email: 'admin@rentalls.com',
    password: 'ChangeMe123!',
    hashPassword: async () => 'hashed-password',
  });

  assert.equal(result, user);
  assert.equal(user.role, 'admin');
  assert.equal(user.is_verified, true);
  assert.equal(saved.length, 1);
});
