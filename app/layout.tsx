import type { Metadata } from 'next'
import { IBM_Plex_Mono, Syne } from 'next/font/google'
import './globals.css'

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
})

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-display',
})

export const metadata: Metadata = {
  title: 'MarketPulse Pro — Live Stock Tracker',
  description: 'Real-time stock tracker with AI-powered insights, portfolio management, and watchlists.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${ibmPlexMono.variable} ${syne.variable}`}>
      <body className="bg-[#08080e] text-[#eeeef5] font-mono antialiased">
        {children}
      </body>
    </html>
  )
}
