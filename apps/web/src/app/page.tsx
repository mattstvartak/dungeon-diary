'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoginModal } from '@/components/login-modal'
import { useAuth } from '@/providers/auth-provider'

export default function Home() {
  const [showLoginModal, setShowLoginModal] = useState(false)
  const { user, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.refresh()
  }

  return (
    <main className="min-h-screen">
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="text-2xl">🎲</div>
              <span className="font-heading text-xl font-bold">Dungeon Diary</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </a>
              <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
                About
              </a>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <Link href="/app/dashboard">
                    <Button variant="primary" size="sm">
                      Dashboard
                    </Button>
                  </Link>
                  <Button variant="secondary" size="sm" onClick={handleSignOut}>
                    Log Out
                  </Button>
                </>
              ) : (
                <Button variant="primary" size="sm" onClick={() => setShowLoginModal(true)}>
                  Login
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Login Modal */}
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />

      {/* Hero Section */}
      <section id="hero" className="bg-gradient-to-b from-background via-background to-muted min-h-[80vh] flex items-center justify-center px-6 py-12 pt-32">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-heading text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
            Chronicle Your Adventures
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Record your D&D sessions, get AI-powered transcriptions, and never forget an epic moment again.
            The ultimate companion for Dungeon Masters and adventurers.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" className="shadow-lg" onClick={() => setShowLoginModal(true)}>
              Start Free Trial
            </Button>
            <Button variant="secondary" size="lg" onClick={() => setShowLoginModal(true)}>
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20">
        <div className="h-px bg-border my-8 mb-16" />
        <h2 className="font-heading text-4xl font-bold text-center mb-12">
          Features for Every Adventurer
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-md transition-all">
            <CardHeader>
              <div className="text-4xl mb-2">🎙️</div>
              <CardTitle>Easy Recording</CardTitle>
              <CardDescription>
                Record sessions directly in your browser or upload audio files
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-md transition-all">
            <CardHeader>
              <div className="text-4xl mb-2">🤖</div>
              <CardTitle>AI Transcription</CardTitle>
              <CardDescription>
                Get accurate transcriptions powered by OpenAI Whisper
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-md transition-all">
            <CardHeader>
              <div className="text-4xl mb-2">📜</div>
              <CardTitle>Smart Summaries</CardTitle>
              <CardDescription>
                AI-generated summaries with NPCs, locations, and key moments
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-md transition-all">
            <CardHeader>
              <div className="text-4xl mb-2">🔍</div>
              <CardTitle>Searchable History</CardTitle>
              <CardDescription>
                Find any moment across all your campaigns instantly
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-md transition-all">
            <CardHeader>
              <div className="text-4xl mb-2">🎭</div>
              <CardTitle>Recap Generation</CardTitle>
              <CardDescription>
                "Previously on..." recaps to start your next session
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-md transition-all">
            <CardHeader>
              <div className="text-4xl mb-2">👥</div>
              <CardTitle>Share with Players</CardTitle>
              <CardDescription>
                Generate shareable links for your party to review sessions
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 py-20">
        <div className="h-px bg-border my-8 mb-16" />
        <h2 className="font-heading text-4xl font-bold text-center mb-12">
          Choose Your Plan
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Free</CardTitle>
              <CardDescription>Perfect for trying out</CardDescription>
              <div className="text-3xl font-bold mt-4">$0</div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ 1 active campaign</li>
                <li>✓ 3 sessions per month</li>
                <li>✓ 2 AI recaps per month</li>
                <li>✓ 30-day storage</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary shadow-lg-primary relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-xs font-bold">
              POPULAR
            </div>
            <CardHeader>
              <CardTitle>Premium</CardTitle>
              <CardDescription>For active campaigns</CardDescription>
              <div className="text-3xl font-bold mt-4">$9.99<span className="text-base text-muted-foreground">/mo</span></div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Unlimited campaigns</li>
                <li>✓ Unlimited recordings</li>
                <li>✓ Unlimited AI recaps</li>
                <li>✓ Permanent storage</li>
                <li>✓ Advanced AI features</li>
                <li>✓ Priority processing</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pay Per Session</CardTitle>
              <CardDescription>No commitment</CardDescription>
              <div className="text-3xl font-bold mt-4">$4.99<span className="text-base text-muted-foreground">/session</span></div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Full AI processing</li>
                <li>✓ 90-day storage</li>
                <li>✓ All features included</li>
                <li>✓ No subscription</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="max-w-4xl mx-auto px-6 py-20">
        <div className="h-px bg-border my-8 mb-16" />
        <div className="text-center">
          <h2 className="font-heading text-4xl font-bold mb-6">
            About Dungeon Diary
          </h2>
          <p className="text-lg text-muted-foreground mb-4">
            Built for Dungeon Masters and players who want to preserve their epic stories.
            Using cutting-edge AI technology from OpenAI, we make it easy to record, transcribe,
            and organize your D&D sessions.
          </p>
          <p className="text-lg text-muted-foreground">
            Never miss a moment, never forget a quest, and always have your campaign history at your fingertips.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="shadow-sm mt-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center text-muted-foreground text-sm">
            <p className="font-heading text-xl text-foreground mb-2">Dungeon Diary</p>
            <p>Chronicle your adventures. Never forget a moment.</p>
            <p className="mt-4">© 2025 Dungeon Diary. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
