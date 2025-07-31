'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical } from 'lucide-react'

interface StableDropdownMenuProps {
  children: React.ReactNode
  align?: 'start' | 'center' | 'end'
  className?: string
  triggerClassName?: string
}

export function StableDropdownMenu({ 
  children, 
  align = 'end', 
  className = 'w-48',
  triggerClassName = 'opacity-0 group-hover:opacity-100 transition-opacity'
}: StableDropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`${triggerClassName} ${isOpen ? 'opacity-100' : ''} relative z-10`}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align={align} 
        className={`${className} z-50`}
        sideOffset={4}
        onPointerDownOutside={() => setIsOpen(false)}
        onEscapeKeyDown={() => setIsOpen(false)}
      >
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}