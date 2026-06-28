import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __ruPrisma: PrismaClient | undefined;
}

const createClient = () =>
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

export const prisma: PrismaClient = global.__ruPrisma ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  global.__ruPrisma = prisma;
}
