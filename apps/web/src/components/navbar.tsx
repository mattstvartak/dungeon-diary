'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/providers/auth-provider'

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { user, signOut } = useAuth()
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    setUserMenuOpen(false)
  }

  return (
    <nav className="sticky top-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/app/dashboard" className="flex items-center gap-3">
            <div className="text-2xl">🎲</div>
            <span className="font-heading text-xl font-bold">Dungeon Diary</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/app/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <Link href="/app/campaigns" className="text-muted-foreground hover:text-foreground transition-colors">
              Campaigns
            </Link>
            <Link href="/app/settings" className="text-muted-foreground hover:text-foreground transition-colors">
              Settings
            </Link>
          </div>

          {/* Right Side */}
          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" size="icon">
              🔔
            </Button>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-card transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-primary flex items-center justify-center text-sm font-semibold">
                  {user?.email?.[0].toUpperCase() || '👤'}
                </div>
              </button>

              {/* Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-card rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-border">
                    <p className="text-sm font-semibold text-foreground truncate">{user?.email}</p>
                    <p className="text-xs text-muted-foreground">Free Plan</p>
                  </div>
                  <div className="py-2">
                    <Link
                      href="/app/settings"
                      className="block px-4 py-2 text-sm text-muted-foreground hover:bg-card hover:text-foreground transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      ⚙️ Settings
                    </Link>
                    <Link
                      href="/app/settings"
                      className="block px-4 py-2 text-sm text-muted-foreground hover:bg-card hover:text-foreground transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      💳 Billing
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-muted-foreground hover:bg-card hover:text-foreground transition-colors"
                    >
                      🚪 Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4">
            <div className="h-px bg-border my-8" />
            <div className="flex flex-col gap-3">
              <Link href="/app/dashboard" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                Dashboard
              </Link>
              <Link href="/app/campaigns" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                Campaigns
              </Link>
              <Link href="/app/settings" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                Settings
              </Link>
              <button
                onClick={handleSignOut}
                className="text-left text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                🚪 Log Out
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
