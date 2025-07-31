'use client'

import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Use isomorphic layout effect to prevent hydration issues
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

interface CardContextMenuProps {
  children: React.ReactNode
  className?: string
  triggerClassName?: string
  alwaysVisible?: boolean
}

export function CardContextMenu({ children, className, triggerClassName, alwaysVisible = false }: CardContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [isMounted, setIsMounted] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Handle hydration with isomorphic layout effect
  useIsomorphicLayoutEffect(() => {
    setIsMounted(true)
  }, [])

  // Additional safety check for hydration
  const isClient = typeof window !== 'undefined' && isMounted

  useEffect(() => {
    if (!isClient) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('keydown', handleEscape)
      }
    }
  }, [isOpen, isClient])

  const handleToggle = () => {
    if (!isOpen && triggerRef.current && isClient) {
      const rect = triggerRef.current.getBoundingClientRect()
      const menuWidth = 200 // Estimated menu width
      const menuHeight = 150 // Estimated menu height
      
      let top = rect.bottom + 4
      let left = rect.right - menuWidth
      
      // Adjust if menu would go outside viewport - only access window if client-side
      if (left < 8) left = rect.left
      if (top + menuHeight > window.innerHeight - 8) {
        top = rect.top - menuHeight - 4
      }
      
      setPosition({ top, left })
    }
    setIsOpen(!isOpen)
  }

  const handleItemClick = () => {
    setIsOpen(false)
  }

  // Don't render anything until mounted to prevent hydration mismatch
  if (!isMounted) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 w-8 p-0 transition-opacity duration-200",
          alwaysVisible ? "opacity-100" : "opacity-0 group-hover:opacity-100",
          triggerClassName
        )}
        disabled
      >
        <MoreVertical className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <>
      <Button
        ref={triggerRef}
        variant="ghost"
        size="sm"
        onClick={handleToggle}
        className={cn(
          "h-8 w-8 p-0 transition-opacity duration-200",
          alwaysVisible 
            ? "opacity-100" 
            : "opacity-0 group-hover:opacity-100",
          isOpen && "opacity-100 bg-gray-100",
          triggerClassName
        )}
      >
        <MoreVertical className="h-4 w-4" />
      </Button>
      
      {isOpen && isClient && document.body && createPortal(
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" />
          
          {/* Menu */}
          <div
            ref={menuRef}
            className={cn(
              "fixed z-50 min-w-[200px] rounded-md border bg-white p-1 shadow-lg",
              "animate-in fade-in-0 zoom-in-95 duration-100",
              className
            )}
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
            }}
          >
            <div onClick={handleItemClick}>
              {children}
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  )
}

// Menu item component that works with the context menu
export function CardContextMenuItem({ 
  children, 
  className, 
  onClick,
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
        "hover:bg-gray-100 focus:bg-gray-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  )
}