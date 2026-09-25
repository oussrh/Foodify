// app/layout.tsx
import './globals.css'
import { Instrument_Sans } from 'next/font/google'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'sonner'
import type { Metadata, Viewport } from 'next'

const sans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Foodify',
  description: 'AR menu platform',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAFAF8' },
    { media: '(prefers-color-scheme: dark)', color: '#141311' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={sans.variable}>
      <body suppressHydrationWarning className="font-sans">
        <SessionProvider>
          {/* No theme provider here: each route subtree mounts its own scope (components/theme-provider.tsx). */}
          {children}
          <Toaster position="top-center" toastOptions={{ className: 'font-sans' }} />
        </SessionProvider>
      </body>
    </html>
  )
}
