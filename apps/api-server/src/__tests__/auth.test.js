import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../services/passwords.js';
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from '../middleware/auth.js';

test('Security & Passwords: scrypt hashing and verification', async () => {
  const plain = 'RuralHealth@2026!Secured';
  const hashed = await hashPassword(plain);

  assert.ok(hashed.startsWith('scrypt$'), 'Hash should use scrypt prefix');
  const valid = await verifyPassword(plain, hashed);
  assert.equal(valid, true, 'Valid password must verify');

  const invalid = await verifyPassword('WrongPassword123', hashed);
  assert.equal(invalid, false, 'Invalid password must fail verification');
});

test('JWT Tokens: Access token issuance and payload verification', () => {
  const payload = {
    sub: 'user-palghar-001',
    role: 'phc_doctor',
    facilityId: 'PHC-KELWA-01',
    name: 'Dr. Ramesh Patkar'
  };

  const accessToken = signAccessToken(payload);
  assert.ok(typeof accessToken === 'string' && accessToken.length > 20, 'Access token generated');

  const decoded = verifyAccessToken(accessToken);
  assert.equal(decoded.sub, payload.sub);
  assert.equal(decoded.role, payload.role);
  assert.equal(decoded.facilityId, payload.facilityId);
});

test('JWT Tokens: Refresh token issuance and verification', () => {
  const userId = 'usr-asha-rekha-001';
  const refreshToken = signRefreshToken(userId);
  assert.ok(typeof refreshToken === 'string');

  const decoded = verifyRefreshToken(refreshToken);
  assert.equal(decoded.sub, userId);

  const invalid = verifyRefreshToken('corrupted.token.signature');
  assert.equal(invalid, null);
});
