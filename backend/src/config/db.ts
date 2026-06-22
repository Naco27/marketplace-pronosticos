import { PrismaClient } from '@prisma/client';

const isProd = process.env.NODE_ENV === 'production';

const prisma = new PrismaClient({
  log: isProd ? ['error', 'warn'] : ['query', 'info', 'warn', 'error'],
});

export default prisma;
