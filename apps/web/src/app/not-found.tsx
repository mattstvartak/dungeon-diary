import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="text-2xl">🎲</div>
              <span className="font-heading text-xl font-bold">Dungeon Diary</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="/#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
              <Link href="/#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
              <Link href="/#about" className="text-muted-foreground hover:text-foreground transition-colors">
                About
              </Link>
            </div>

            {/* Home Link */}
            <Link
              href="/"
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-primary to-primary text-foreground transition-all hover:opacity-90"
            >
              Home
            </Link>
          </div>
        </div>
      </nav>

      {/* 404 Content */}
      <div className="flex items-center justify-center px-6 py-20">
        <div className="max-w-2xl mx-auto text-center">
          {/* Error Code */}
          <h1 className="font-heading text-9xl font-bold mb-4 bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
            404
          </h1>

          {/* Title */}
          <h2 className="font-heading text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Critical Miss!
          </h2>

          {/* Description */}
          <p className="text-xl text-muted-foreground mb-8 max-w-lg mx-auto">
            You rolled a natural 1 on your perception check. The page you're looking for has vanished into the Astral Plane.
          </p>

          {/* Flavor Text */}
          <div className="bg-card rounded-2xl p-6 mb-8 max-w-md mx-auto">
            <p className="text-sm text-muted-foreground italic">
              "The ancient tome crumbles to dust in your hands. Perhaps this knowledge was never meant to be found..."
            </p>
            <p className="text-xs text-muted-foreground mt-2">— Unknown Wizard, moments before disappearing</p>
          </div>

          {/* Easter Egg */}
          <div className="mt-12 text-xs text-muted-foreground">
            <p>Roll for initiative to try again</p>
          </div>
        </div>
      </div>
    </div>
  )
}
