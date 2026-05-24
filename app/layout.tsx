import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PRIMAL — Feel The Sting',
  description: 'Track your workouts, burn calories, conquer your goals.',
  keywords: ['fitness', 'workout', 'weight loss', 'sport tracker'],
  themeColor: '#FF6B00',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'PRIMAL — Feel The Sting',
    description: 'Track your workouts, burn calories, conquer your goals.',
    url: 'https://primal.velops.fr',
    siteName: 'PRIMAL',
    locale: 'fr_FR',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
