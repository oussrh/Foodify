"use client"

import { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ScrollToTopButtonProps {
  primaryColor?: string
  secondaryColor?: string
}

export default function ScrollToTopButton({
  primaryColor = '#6366f1',
  secondaryColor = '#8b5cf6'
}: ScrollToTopButtonProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button when page is scrolled down 400px
      if (window.scrollY > 400) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', toggleVisibility)

    return () => {
      window.removeEventListener('scroll', toggleVisibility)
    }
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  if (!isVisible) {
    return null
  }

  return (
    <Button
      onClick={scrollToTop}
      size="icon"
      className="fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 border-2 border-white/20 backdrop-blur-sm"
      style={{
        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
      }}
      aria-label="Scroll to top"
    >
      <ArrowUp className="h-5 w-5 text-white" />
    </Button>
  )
}
