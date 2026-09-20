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
      className="group inline-flex items-center gap-3 bg-card/80 hover:bg-card text-muted-foreground hover:text-foreground px-8 py-4 rounded-lg font-semibold transition-colors transform border border-border/50 hover:border-border"
    >
      <ArrowLeft className="h-5 w-5 transition-transform" />
      Go Back
    </button>
  )
}
