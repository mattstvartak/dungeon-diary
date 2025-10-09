import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Cinzel } from 'next/font/google'
import { AuthProvider } from '@/providers/auth-provider'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-cinzel',
  weight: ['400', '600', '700', '800'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Dungeon Diary - Chronicle Your Adventures',
  description: 'Record D&D sessions, get AI-powered transcriptions and summaries. Never forget an adventure again.',
  keywords: ['D&D', 'dungeons and dragons', 'session recording', 'campaign management', 'AI transcription'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${cinzel.variable} antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
