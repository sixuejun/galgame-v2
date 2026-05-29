import type { Metadata, Viewport } from 'next'
import { Noto_Serif_SC, Noto_Sans_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const notoSerifSC = Noto_Serif_SC({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-noto-serif-sc',
})

const notoSansMono = Noto_Sans_Mono({
  subsets: ['latin'],
  variable: '--font-noto-sans-mono',
})

export const metadata: Metadata = {
  title: '末日旧闻 - Galgame',
  description: '在泛黄的报纸碎片中，寻找末日前的真相',
}

export const viewport: Viewport = {
  themeColor: '#2a2420',
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" className={`${notoSerifSC.variable} ${notoSansMono.variable}`}>
      <body className="font-serif antialiased overflow-hidden">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
