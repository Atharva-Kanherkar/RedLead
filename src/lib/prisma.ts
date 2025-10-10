// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client Singleton
 *
 * This ensures only ONE instance of PrismaClient exists throughout the application lifecycle.
 * Multiple instances would create multiple connection pools, exhausting database connections.
 *
 * In development, we use globalThis to preserve the instance across hot-reloads.
 * In production, a simple module-level variable is sufficient.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
