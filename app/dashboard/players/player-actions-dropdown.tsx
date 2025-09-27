'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  MoreHorizontal,
  Edit,
  Eye,
  Link as LinkIcon,
  Shield,
  ShieldOff,
  UserCheck,
  UserX
} from 'lucide-react'
import { togglePlayerExempt } from '@/lib/actions/players'
import { generateMagicLink } from '@/lib/actions/auth'

interface PlayerActionsDropdownProps {
  player: any
}

export function PlayerActionsDropdown({ player }: PlayerActionsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState<'left' | 'right'>('right')
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && buttonRef.current && dropdownRef.current) {
      const updatePosition = () => {
        if (!buttonRef.current) return

        const buttonRect = buttonRef.current.getBoundingClientRect()
        const dropdownWidth = 224 // w-56 = 14rem = 224px
        const viewportWidth = window.innerWidth

        // Check if dropdown would overflow on the right
        if (buttonRect.right + dropdownWidth > viewportWidth - 16) {
          setDropdownPosition('left')
        } else {
          setDropdownPosition('right')
        }
      }

      updatePosition()

      // Update position on scroll or resize
      const handlePositionUpdate = () => {
        updatePosition()
      }

      window.addEventListener('scroll', handlePositionUpdate)
      window.addEventListener('resize', handlePositionUpdate)

      return () => {
        window.removeEventListener('scroll', handlePositionUpdate)
        window.removeEventListener('resize', handlePositionUpdate)
      }
    }
  }, [isOpen])

  const [isGeneratingLink, setIsGeneratingLink] = useState(false)

  const handleGenerateMagicLink = async () => {
    if (!player.email) {
      alert('Player must have an email address to generate a magic link')
      return
    }
    
    setIsGeneratingLink(true)
    try {
      const result = await generateMagicLink(player.id)
      if (result.success) {
        // Show the link to the admin to copy
        const linkText = result.url || ''
        navigator.clipboard.writeText(linkText).then(() => {
          alert(`Magic link copied to clipboard!\n\nLink: ${linkText}\n\nShare this link directly with ${player.name}. It expires in 15 minutes and can only be used once.`)
        }).catch(() => {
          alert(`Magic link generated:\n\n${linkText}\n\nCopy this link and share it with ${player.name}. It expires in 15 minutes and can only be used once.`)
        })
      } else {
        alert(`Failed to generate magic link: ${result.error}`)
      }
    } catch (error) {
      alert('Failed to generate magic link')
    } finally {
      setIsGeneratingLink(false)
      setIsOpen(false)
    }
  }

  const handleToggleExempt = async () => {
    try {
      const result = await togglePlayerExempt(player.id)
      if (result.success) {
        // Page will revalidate automatically
        setIsOpen(false)
      } else {
        alert(`Failed to update player: ${result.error}`)
      }
    } catch (error) {
      alert('Failed to update player')
    }
  }

  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="tap-target"
      >
        <MoreHorizontal className="w-4 h-4" />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div
            ref={dropdownRef}
            className={`absolute top-full mt-1 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50 ${
              dropdownPosition === 'left' ? 'right-0' : 'left-0'
            }`}
            style={{
              // Ensure dropdown doesn't get clipped by table overflow
              position: 'fixed',
              ...(dropdownPosition === 'left' && buttonRef.current
                ? {
                    right: `${window.innerWidth - buttonRef.current.getBoundingClientRect().right}px`,
                    top: `${buttonRef.current.getBoundingClientRect().bottom + 4}px`,
                  }
                : buttonRef.current
                ? {
                    left: `${buttonRef.current.getBoundingClientRect().left}px`,
                    top: `${buttonRef.current.getBoundingClientRect().bottom + 4}px`,
                  }
                : {})
            }}>
            <div className="py-1">
              <Link
                href={`/dashboard/players/${player.id}`}
                className="flex items-center px-4 py-2 text-sm hover:bg-gray-100 tap-target"
                onClick={() => setIsOpen(false)}
              >
                <Eye className="w-4 h-4 mr-3" />
                View Details
              </Link>
              
              <Link
                href={`/dashboard/players/${player.id}/edit`}
                className="flex items-center px-4 py-2 text-sm hover:bg-gray-100 tap-target"
                onClick={() => setIsOpen(false)}
              >
                <Edit className="w-4 h-4 mr-3" />
                Edit Player
              </Link>

              {player.email && (
                <button
                  onClick={handleGenerateMagicLink}
                  disabled={isGeneratingLink}
                  className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 tap-target disabled:opacity-50"
                >
                  <LinkIcon className="w-4 h-4 mr-3" />
                  {isGeneratingLink ? 'Generating...' : 'Generate Magic Link'}
                </button>
              )}

              <div className="border-t border-gray-100 my-1" />

              <button
                onClick={handleToggleExempt}
                className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 tap-target"
              >
                {player.isExempt ? (
                  <>
                    <ShieldOff className="w-4 h-4 mr-3" />
                    Remove Exempt Status
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-3" />
                    Mark as Exempt
                  </>
                )}
              </button>

              <button
                className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 tap-target"
              >
                {player.isActive ? (
                  <>
                    <UserX className="w-4 h-4 mr-3" />
                    Deactivate Player
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4 mr-3" />
                    Activate Player
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}