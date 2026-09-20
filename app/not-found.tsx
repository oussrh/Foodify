// FilePath: app/not-found.tsx

import Link from 'next/link'
import { Home, Search, ArrowLeft, RefreshCw } from 'lucide-react'
import GoBackButton from '@/components/go-back-button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-muted/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-muted/20 rounded-full blur-3xl delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -/2 -/2 w-80 h-80 bg-muted/20 rounded-full blur-3xl delay-500"></div>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto text-center space-y-8">
        {/* 404 Animation */}
        <div className="relative">
          <div className="text-8xl md:text-9xl font-black text-transparent bg-clip-text">
            404
          </div>
          <div className="absolute inset-0 text-8xl md:text-9xl font-black text-muted-foreground/10 transform">
            404
          </div>
        </div>

        {/* Main content */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Oops! Page Not Found
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-md mx-auto">
              Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved, deleted, or you entered the wrong URL.
            </p>
          </div>

          {/* Suggestions */}
          <div className="bg-card/70 rounded-lg p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-foreground mb-4">What can you do?</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-3 p-3 rounded-md bg-muted text-muted-foreground">
                <Search className="h-5 w-5 flex-shrink-0" />
                <span>Check the URL for typos</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-md bg-muted text-success">
                <RefreshCw className="h-5 w-5 flex-shrink-0" />
                <span>Try refreshing the page</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-md bg-muted text-muted-foreground">
                <Home className="h-5 w-5 flex-shrink-0" />
                <span>Go back to homepage</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Link 
              href="/" 
              className="group inline-flex items-center gap-3 text-white px-8 py-4 rounded-lg font-semibold transition-colors transform"
            >
              <Home className="h-5 w-5 transition-transform.5" />
              Return Home
            </Link>
            
            <GoBackButton />
          </div>

          {/* Help text */}
          <p className="text-sm text-muted-foreground mt-8">
            Still having trouble? 
            <Link href="/" className="text-muted-foreground hover:text-muted-foreground font-medium ml-1 hover:underline">
              Contact our support team
            </Link>
          </p>
        </div>
      </div>

      {/* Floating elements for visual interest */}
      <div className="absolute top-20 left-10 w-3 h-3 bg-primary rounded-full delay-100"></div>
      <div className="absolute top-32 right-16 w-2 h-2 bg-primary rounded-full delay-300"></div>
      <div className="absolute bottom-20 left-20 w-4 h-4 bg-primary rounded-full delay-500"></div>
      <div className="absolute bottom-32 right-12 w-3 h-3 bg-primary rounded-full delay-700"></div>
    </div>
  )
}
