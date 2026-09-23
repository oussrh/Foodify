// FilePath: components/go-back-button.tsx

'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

/**
 * Goes back in the browser history, or to the home page when there is no history (a page opened
 * directly); the not-found page uses it.
 */
export default function GoBackButton() {
  const router = useRouter()
  const handleGoBack = () => {
    if (window.history.length > 1) router.back()
    else router.push('/')
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
