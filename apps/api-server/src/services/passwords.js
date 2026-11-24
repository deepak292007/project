import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await scrypt(password, salt, 64);
  return `scrypt$${salt}$${Buffer.from(derivedKey).toString('hex')}`;
}

export async function verifyPassword(password, storedHash) {
  if (!storedHash?.startsWith('scrypt$')) return false;
  const [, salt, expected] = storedHash.split('$');
  const derivedKey = Buffer.from(await scrypt(password, salt, 64));
  const expectedKey = Buffer.from(expected, 'hex');
  return expectedKey.length === derivedKey.length && timingSafeEqual(expectedKey, derivedKey);
}
