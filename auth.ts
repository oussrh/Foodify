// FilePath: auth.ts

import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import ResendProvider from 'next-auth/providers/resend'
import Credentials from 'next-auth/providers/credentials'
import prisma from './lib/prisma'
import { serverEnv } from './lib/env'
import { credentials as credentialsSchema } from './lib/schemas/user'
import { assertPortalRole, completeSecondFactor, userWithPassword } from './lib/sign-in-checks'
import { log } from './server/log'

declare module 'next-auth' {
  interface User {
    role?: string | undefined
  }
  interface Session {
    user: {
      id: string
      email: string
      /** Copied from the token, which has none for a session older than the roles */
      role?: string | undefined
    }
  }
}
// The augmentation needs the module in the program; nothing is used from it.
import type {} from 'next-auth/jwt'
declare module 'next-auth/jwt' {
  interface JWT {
    role?: string
  }
}

/**
 * NextAuth with JWT sessions; `role` rides the token into `session.user`. The credentials provider decides in this order:
 * the form parses (`credentials`), the account exists and its password matches (else null, a quiet failure), the portal
 * fits (a super admin passes either), then the second factor (a pending emailed code, else TOTP, else none); those two throw.
 */
export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    // The key and sender come from the parsed environment, not a literal; set together or not at all (lib/env.ts).
    ResendProvider(serverEnv.resendApiKey && serverEnv.resendFrom ? { apiKey: serverEnv.resendApiKey, from: serverEnv.resendFrom } : {}), // abatty:allow-secret
    Credentials({
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw)
        if (!parsed.success) return null
        const { email, password, code, role } = parsed.data

        try {
          const user = await userWithPassword(email, password)
          if (!user) return null
          // The portal the sign-in page serves; a super admin may use either.
          assertPortalRole(user, role)
          await completeSecondFactor(user, code)

          return {
            id: user.id,
            email: user.email,
            role: user.role
          }
        } catch (error) {
          log.error({ err: error }, 'authorize: refused or failed')
          throw error
        }
      },
      credentials: {
        email: {},
        password: {},
        code: { label: 'Two-factor code', type: 'text', optional: true },
        role: { type: 'text', optional: true },
      },
    }),
  ],
  // A month, set here rather than left to the library's default: a kitchen tablet is signed in
  // once when it is set up and must not be asked again mid-service, and the same window is a
  // reasonable one for a manager on their own phone.
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.role) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub || ''
        session.user.role = token.role
      }
      return session
    },
  },
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  debug: serverEnv.isDevelopment,
})
