// FilePath: app/not-found.tsx

import Link from 'next/link'
import { Home, Search, ArrowLeft, RefreshCw } from 'lucide-react'
import GoBackButton from '@/components/go-back-button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto text-center space-y-8">
        {/* 404 Animation */}
        <div className="relative">
          <div className="text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 animate-pulse">
            404
          </div>
          <div className="absolute inset-0 text-8xl md:text-9xl font-black text-blue-600/10 transform translate-x-2 translate-y-2">
            404
          </div>
        </div>

        {/* Main content */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
              Oops! Page Not Found
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed max-w-md mx-auto">
              Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved, deleted, or you entered the wrong URL.
            </p>
          </div>

          {/* Suggestions */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">What can you do?</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50/80 text-blue-700">
                <Search className="h-5 w-5 flex-shrink-0" />
                <span>Check the URL for typos</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50/80 text-green-700">
                <RefreshCw className="h-5 w-5 flex-shrink-0" />
                <span>Try refreshing the page</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50/80 text-purple-700">
                <Home className="h-5 w-5 flex-shrink-0" />
                <span>Go back to homepage</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Link 
              href="/" 
              className="group inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-lg"
            >
              <Home className="h-5 w-5 transition-transform group-hover:-translate-y-0.5" />
              Return Home
            </Link>
            
            <GoBackButton />
          </div>

          {/* Help text */}
          <p className="text-sm text-gray-500 mt-8">
            Still having trouble? 
            <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium ml-1 hover:underline">
              Contact our support team
            </Link>
          </p>
        </div>
      </div>

      {/* Floating elements for visual interest */}
      <div className="absolute top-20 left-10 w-3 h-3 bg-blue-400 rounded-full animate-bounce delay-100"></div>
      <div className="absolute top-32 right-16 w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-300"></div>
      <div className="absolute bottom-20 left-20 w-4 h-4 bg-indigo-400 rounded-full animate-bounce delay-500"></div>
      <div className="absolute bottom-32 right-12 w-3 h-3 bg-pink-400 rounded-full animate-bounce delay-700"></div>
    </div>
  )
}
