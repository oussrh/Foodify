// FilePath: auth.ts

import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import ResendProvider from 'next-auth/providers/resend'
import Credentials from 'next-auth/providers/credentials'
import prisma from './lib/prisma'
import { serverEnv } from './lib/env'
import bcrypt from 'bcryptjs'
import { safeEqual, verifyTOTP } from './lib/totp'

declare module 'next-auth' {
  interface User {
    role?: string
  }
  interface Session {
    user: {
      id: string
      email: string
      role?: string
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

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    // The key and sender come from the parsed environment, not a literal.
    ResendProvider({ apiKey: serverEnv.resendApiKey, from: serverEnv.resendFrom }), // abatty:allow-secret
    Credentials({
      async authorize(credentials) {
        const { email, password, code, role } = credentials as Record<string, string>
        
        try {
          const user = await prisma.user.findUnique({ where: { email } })
          if (!user) {
            console.log('User not found:', email)
            return null
          }

          const valid = await bcrypt.compare(password, user.passwordHash)
          if (!valid) {
            console.log('Invalid password for user:', email)
            return null
          }

          // Check role if specified (convert role check to match your schema)
          if (role) {
            const expectedRole = role === 'ADMIN' ? 'SUPER_ADMIN' : role
            if (user.role !== expectedRole && user.role !== 'SUPER_ADMIN') {
              console.log('Role mismatch for user:', email, 'expected:', expectedRole, 'actual:', user.role)
              throw new Error('Unauthorized role')
            }
          }

          if (user.emailOtpCode) {
            const expired = user.emailOtpExpires && user.emailOtpExpires < new Date()
            if (!code || !safeEqual(code, user.emailOtpCode) || expired) {
              throw new Error('Invalid two-factor code')
            }
            await prisma.user.update({
              where: { id: user.id },
              data: { 
                emailOtpCode: null, 
                emailOtpExpires: null, 
                lastLogin: new Date() 
              },
            })
          } else if (user.totpSecret) {
            if (!code || !verifyTOTP(code, user.totpSecret)) {
              throw new Error('Invalid two-factor code')
            }
            await prisma.user.update({
              where: { id: user.id },
              data: { lastLogin: new Date() },
            })
          } else {
            // Update last login even without 2FA
            await prisma.user.update({
              where: { id: user.id },
              data: { lastLogin: new Date() },
            })
          }

          return { 
            id: user.id, 
            email: user.email,
            role: user.role
          }
        } catch (error) {
          console.error('Authorization error:', error)
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
  session: { strategy: 'jwt' },
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
