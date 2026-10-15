'use strict';
// Prepared encryption boundary, no files, keys, cloud transport or schedule.
const { createCipheriv, createDecipheriv, randomBytes } = require('node:crypto');
const MAGIC = Buffer.from('ASB1');
const MAX_BYTES = 500_000_000;
const RETENTION_SECONDS = 7 * 86400;

function validTime(value) { return Number.isSafeInteger(value) && value >= 0; }
function validKey(key) { return Buffer.isBuffer(key) && key.length === 32; }
function seal(plaintext, key, { keyId, capturedAt }) {
  if (!Buffer.isBuffer(plaintext) || !validKey(key) ||
      typeof keyId !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(keyId) || !validTime(capturedAt)) {
    throw new Error('backup-envelope-input');
  }
  const metadata = Buffer.from(JSON.stringify({ version: 1, keyId, capturedAt }));
  const length = Buffer.alloc(4);
  length.writeUInt32BE(metadata.length);
  const prefix = Buffer.concat([MAGIC, length, metadata]);
  if (plaintext.length + prefix.length + 28 > MAX_BYTES) throw new Error('backup-envelope-capacity');
  const nonce = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, nonce);
  cipher.setAAD(prefix);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return Buffer.concat([prefix, nonce, cipher.getAuthTag(), ciphertext]);
}

function open(envelope, key, { keyId, now }) {
  try {
    if (!Buffer.isBuffer(envelope) || !validKey(key) || !validTime(now) ||
        envelope.length < 36 || envelope.length > MAX_BYTES ||
        !envelope.subarray(0, 4).equals(MAGIC)) throw new Error();
    const headerLength = envelope.readUInt32BE(4);
    const end = 8 + headerLength;
    if (headerLength > 2048 || end + 28 > envelope.length) throw new Error();
    const decipher = createDecipheriv('aes-256-gcm', key, envelope.subarray(end, end + 12));
    decipher.setAAD(envelope.subarray(0, end));
    decipher.setAuthTag(envelope.subarray(end + 12, end + 28));
    const plaintext = Buffer.concat([decipher.update(envelope.subarray(end + 28)), decipher.final()]);
    const metadata = JSON.parse(envelope.subarray(8, end).toString('utf8'));
    if (metadata.version !== 1 || metadata.keyId !== keyId ||
        !validTime(metadata.capturedAt) || now < metadata.capturedAt ||
        now - metadata.capturedAt >= RETENTION_SECONDS) throw new Error();
    return plaintext;
  } catch {
    // Never expose partial plaintext, key material or provider details.
    throw new Error('backup-envelope-rejected');
  }
}
module.exports = { seal, open };
