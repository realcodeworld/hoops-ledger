'use client'

import { useState, useRef, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
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

const DROPDOWN_WIDTH = 224

export function PlayerActionsDropdown({ player }: PlayerActionsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState<{ top: number; left?: number; right?: number }>({
    top: 0,
  })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const updateMenuPosition = () => {
    const el = buttonRef.current
    if (!el) return
    const buttonRect = el.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const gap = 4
    const top = buttonRect.bottom + gap
    if (buttonRect.right + DROPDOWN_WIDTH > viewportWidth - 16) {
      setMenuStyle({
        top,
        right: Math.max(8, viewportWidth - buttonRect.right),
        left: undefined,
      })
    } else {
      setMenuStyle({
        top,
        left: Math.max(8, buttonRect.left),
        right: undefined,
      })
    }
  }

  useLayoutEffect(() => {
    if (!isOpen) return
    updateMenuPosition()
    const handlePositionUpdate = () => updateMenuPosition()
    window.addEventListener('scroll', handlePositionUpdate, true)
    window.addEventListener('resize', handlePositionUpdate)
    return () => {
      window.removeEventListener('scroll', handlePositionUpdate, true)
      window.removeEventListener('resize', handlePositionUpdate)
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

      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[200] bg-black/20"
              aria-hidden
              onClick={() => setIsOpen(false)}
            />
            <div
              ref={dropdownRef}
              className="fixed z-[201] w-56 bg-white border border-gray-200 rounded-xl shadow-lg py-1"
              style={{
                top: menuStyle.top,
                ...(menuStyle.left != null ? { left: menuStyle.left } : {}),
                ...(menuStyle.right != null ? { right: menuStyle.right } : {}),
              }}
            >
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
                  type="button"
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
                type="button"
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
                type="button"
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
          </>,
          document.body
        )}
    </div>
  )
}