import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export const PASSWORD_VERSION = 'bcrypt-hmac-sha256-v1';

export function getPasswordPepper() {
  const pepper = process.env.PASSWORD_PEPPER || '';

  if (!pepper || pepper.length < 16) {
    throw new Error('PASSWORD_PEPPER must be configured and at least 16 characters long.');
  }

  return pepper;
}

export function createSalt() {
  return crypto.randomBytes(16).toString('hex');
}

export function applyPepper(password, pepper = getPasswordPepper()) {
  return crypto.createHmac('sha256', pepper).update(String(password)).digest('hex');
}

export async function hashPasswordForStorage(password, providedSalt = createSalt(), pepper = getPasswordPepper()) {
  const pepperedPassword = applyPepper(password, pepper);
  const derivedInput = `${pepperedPassword}${providedSalt}`;
  const passwordHash = await bcrypt.hash(derivedInput, 12);

  return {
    passwordHash,
    passwordSalt: providedSalt,
    passwordVersion: PASSWORD_VERSION,
  };
}

export async function verifyPassword(inputPassword, storedHash, storedSalt, pepper = getPasswordPepper()) {
  const pepperedPassword = applyPepper(inputPassword, pepper);
  const derivedInput = `${pepperedPassword}${storedSalt}`;
  return bcrypt.compare(derivedInput, storedHash);
}

export function createHashDemo(password, salt = createSalt()) {
  const pepper = getPasswordPepper();
  const pepperedPassword = applyPepper(password, pepper);
  const saltOnlyHash = bcrypt.hashSync(`${password}${salt}`, 10);
  const pepperedHash = bcrypt.hashSync(`${pepperedPassword}${salt}`, 12);

  return {
    samplePassword: password,
    generatedSalt: salt,
    passwordVersion: PASSWORD_VERSION,
    algorithm: 'HMAC-SHA256(pepper, password) + bcrypt with unique salt',
    saltOnlyHash,
    pepperedHash,
    pepperedPassword,
    pepperStored: false,
  };
}
