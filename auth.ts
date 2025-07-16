import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import ResendProvider from 'next-auth/providers/resend'
import Credentials from 'next-auth/providers/credentials'
import prisma from './lib/prisma'
import bcrypt from 'bcryptjs'
import { verifyTOTP } from './lib/totp'

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    ResendProvider({
      apiKey: process.env.RESEND_API_KEY,
      from: `Foodify <no-reply@${process.env.RESEND_DOMAIN}>`,
    }),
    Credentials({
      async authorize(credentials) {
        const { email, password, code } = credentials as Record<string, string>
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) return null
        const valid = await bcrypt.compare(password, user.passwordHash)
        if (!valid) return null
        if (user.totpSecret) {
          if (!code || !verifyTOTP(code, user.totpSecret)) {
            throw new Error('Invalid two-factor code')
          }
        }
        return { id: user.id, email: user.email }
      },
      credentials: {
        email: {},
        password: {},
        code: { label: 'Two-factor code', type: 'text', optional: true },
      },
    }),
  ],
  session: { strategy: 'jwt' },
})
