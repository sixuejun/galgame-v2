import type { Metadata, Viewport } from 'next'
import { Playfair_Display, Special_Elite } from 'next/font/google'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['400', '700', '900'],
})

const specialElite = Special_Elite({
  subsets: ['latin'],
  variable: '--font-special-elite',
  weight: '400',
})

export const metadata: Metadata = {
  title: 'WASTELAND 2048 - Post-Apocalyptic Survival Puzzle',
  description: 'A vintage newspaper-styled 2048 puzzle game set in a post-apocalyptic wasteland. Merge survival items to rebuild civilization.',
}

export const viewport: Viewport = {
  themeColor: '#c4ad8a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${specialElite.variable}`}>
      <body className="noise-overlay">{children}</body>
    </html>
  )
}
