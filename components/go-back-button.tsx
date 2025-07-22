// FilePath: components/go-back-button.tsx

'use client'

import { ArrowLeft } from 'lucide-react'

export default function GoBackButton() {
  const handleGoBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back()
    } else {
      // Fallback to home page if no history
      window.location.href = '/'
    }
  }

  return (
    <button 
      onClick={handleGoBack}
      className="group inline-flex items-center gap-3 bg-white/80 hover:bg-white text-gray-700 hover:text-gray-900 px-8 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 border border-gray-200/50 hover:border-gray-300 shadow-lg hover:shadow-xl backdrop-blur-sm"
    >
      <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
      Go Back
    </button>
  )
}
