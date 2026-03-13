import type { Metadata, Viewport } from 'next'
import './globals.css'
import { InstallPrompt } from '@/components/hoops/install-prompt'
import { OfflineIndicator } from '@/components/hoops/offline-indicator'

export const metadata: Metadata = {
  title: 'HoopsLedger',
  description: 'Track hoops. Track dues. Zero fuss.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon',
    apple: '/apple-icon',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'HoopsLedger',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#F97316',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <OfflineIndicator />
        {children}
        <InstallPrompt />
      </body>
    </html>
  )
}