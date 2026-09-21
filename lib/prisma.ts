// lib/prisma.ts
// One PrismaClient per process. Prisma 7 has no bundled query engine: the client talks to
// Postgres through the pg driver adapter, which owns the connection pool.
import { PrismaPg } from '@prisma/adapter-pg'
import { publicEnv, serverEnv } from '@/lib/env'
import { PrismaClient } from '@/generated/prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

function createClient() {
  const adapter = new PrismaPg({ connectionString: serverEnv.databaseUrl })
  return new PrismaClient({ adapter })
}

const prisma = globalForPrisma.prisma ?? createClient()

if (!publicEnv.isProduction) globalForPrisma.prisma = prisma

/** The one client of the process; every query, guard and action goes through it (the integration suite proxies this module to its transaction). */
export default prisma
