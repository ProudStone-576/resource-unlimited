/* eslint-disable no-console */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import argon2 from 'argon2';
import { PrismaClient, UserRole } from '@prisma/client';

function loadEnvFile(path: string) {
  if (!existsSync(path)) return;

  const lines = readFileSync(path, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(trimmed);
    if (!match) continue;

    const key = match[1];
    const rawValue = match[2];
    if (!key || rawValue === undefined) continue;

    if (process.env[key]) continue;

    const value = rawValue.replace(/^(['"])(.*)\1$/, '$2');
    process.env[key] = value;
  }
}

function readArg(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function ensurePasswordStrength(password: string) {
  if (password.length < 10) return 'Password must be at least 10 characters.';

  let classes = 0;
  if (/[a-z]/.test(password)) classes++;
  if (/[A-Z]/.test(password)) classes++;
  if (/[0-9]/.test(password)) classes++;
  if (/[^a-zA-Z0-9]/.test(password)) classes++;

  if (classes < 3) return 'Password must contain at least 3 of: lowercase, uppercase, digits, symbols.';
  return null;
}

loadEnvFile(resolve(process.cwd(), '../../.env'));
loadEnvFile(resolve(process.cwd(), '../../apps/api/.env'));
loadEnvFile(resolve(process.cwd(), '.env'));

const email = (readArg('email') ?? process.env.ADMIN_EMAIL ?? 'admin@grafico.local').toLowerCase();
const password = readArg('password') ?? process.env.ADMIN_PASSWORD;
const firstName = readArg('firstName') ?? process.env.ADMIN_FIRST_NAME ?? 'Admin';
const lastName = readArg('lastName') ?? process.env.ADMIN_LAST_NAME ?? 'User';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required. Add it to .env or apps/api/.env before creating an admin.');
}

if (!password) {
  throw new Error('ADMIN_PASSWORD is required, or pass --password=YourStrongPassword.');
}

const weak = ensurePasswordStrength(password);
if (weak) throw new Error(weak);
const adminPassword = password;

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await argon2.hash(adminPassword, {
    type: argon2.argon2id,
    memoryCost: 19 * 1024,
    timeCost: 2,
    parallelism: 1,
  });

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      firstName,
      lastName,
      role: UserRole.SUPER_ADMIN,
      passwordHash,
      emailVerifiedAt: new Date(),
      isActive: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
    update: {
      firstName,
      lastName,
      role: UserRole.SUPER_ADMIN,
      passwordHash,
      emailVerifiedAt: new Date(),
      isActive: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      emailVerifiedAt: true,
    },
  });

  console.log(`Admin ready: ${user.email} (${user.role})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
