// prisma.config.ts (Prisma 7: the datasource URL and the seed command live here, not in the
// schema or package.json). The CLI no longer reads .env by itself, hence dotenv.
import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  // A folder: schema.prisma holds the menu, the orders and the people, pos.prisma the point of sale.
  schema: 'prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})
