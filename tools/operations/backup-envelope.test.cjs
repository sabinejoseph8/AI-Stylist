'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const { seal, open } = require('./backup-envelope.cjs');
const key = randomBytes(32); // Ephemeral fixture, never written or printed.
const payload = Buffer.from('synthetic database and image fixture');
const options = { keyId: 'fixture-v1', capturedAt: 100 };
const read = { keyId: 'fixture-v1', now: 101 };

test('encrypted round trip returns complete original bytes with unique nonces', () => {
  const one = seal(payload, key, options), two = seal(payload, key, options);
  assert.notDeepEqual(one, two);
  assert.equal(one.includes(payload), false);
  assert.deepEqual(open(one, key, read), payload);
  assert.deepEqual(open(two, key, read), payload);
});
test('wrong key, key version, corrupt tag, ciphertext and truncation refuse output', () => {
  const envelope = seal(payload, key, options);
  assert.throws(() => open(envelope, randomBytes(32), read), /rejected/);
  assert.throws(() => open(envelope, key, { ...read, keyId: 'other' }), /rejected/);
  for (const index of [0, 4, 20, envelope.length - payload.length - 1, envelope.length - 1]) {
    const copy = Buffer.from(envelope); copy[index] ^= 1;
    assert.throws(() => open(copy, key, read), /rejected/);
  }
  for (const end of [0, 8, envelope.length - 1]) {
    assert.throws(() => open(envelope.subarray(0, end), key, read), /rejected/);
  }
});
test('expiry uses authenticated creation time, rejects future and seven-day boundary', () => {
  const envelope = seal(payload, key, options);
  assert.deepEqual(open(envelope, key, { ...read, now: 100 + 7 * 86400 - 1 }), payload);
  for (const now of [99, 100 + 7 * 86400, NaN, Infinity, -1]) {
    assert.throws(() => open(envelope, key, { ...read, now }), /rejected/);
  }
});
test('unsafe metadata and malformed key never produce an archive', () => {
  for (const changes of [{ keyId: '../private' },{ keyId: 'x'.repeat(65) },{ capturedAt: -1 }]) {
    assert.throws(() => seal(payload, key, { ...options, ...changes }), /input/);
  }
  assert.throws(() => seal(payload, Buffer.alloc(16), options), /input/);
});
