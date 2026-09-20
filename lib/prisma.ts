// lib/prisma.ts
// One PrismaClient per process. Prisma 7 has no bundled query engine: the client talks to
// Postgres through the pg driver adapter, which owns the connection pool.
import { PrismaPg } from '@prisma/adapter-pg'
import { serverEnv } from '@/lib/env'
import { PrismaClient } from '@/generated/prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

function createClient() {
  const adapter = new PrismaPg({ connectionString: serverEnv.databaseUrl })
  return new PrismaClient({ adapter })
}

const prisma = globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
