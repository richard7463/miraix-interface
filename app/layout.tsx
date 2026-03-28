// @ts-nocheck
import { Analytics } from '@vercel/analytics/react'
import { Toaster } from 'react-hot-toast'
import { ConditionalHeader } from '@/components/Header/ConditionalHeader'
import Providers from '@/providers/PrivyProvider'
import ThemesProvider from '@/providers/ThemesProvider'
import { isTodaysOrdersVariant, siteMetadataBase } from '@/lib/siteVariant'
import '@/styles/globals.scss'
import '@/styles/theme-config.css'

export const metadata = {
  metadataBase: siteMetadataBase,
  title: isTodaysOrdersVariant
    ? {
        default: "Today's Orders",
        template: `%s · Today's Orders`
      }
    : {
        default: 'MiraiX',
        template: `%s - MiraiX`
      },
  description: isTodaysOrdersVariant
    ? 'A standalone onchain command system that compresses wallet intelligence into one approved daily order, one forbidden order, and one receipt-backed debrief.'
    : 'AI assistant powered by ChatGPT',
  icons: {
    icon: isTodaysOrdersVariant
      ? [{ url: '/agent-logos/todays-orders.svg', type: 'image/svg+xml' }]
      : [
          { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
          { url: '/favicon.png', sizes: '16x16', type: 'image/png' }
        ],
    shortcut: isTodaysOrdersVariant
      ? '/agent-logos/todays-orders.svg'
      : '/favicon-32x32.png',
    apple: isTodaysOrdersVariant
      ? '/agent-logos/todays-orders.svg'
      : '/favicon-32x32.png'
  },
  openGraph: {
    title: isTodaysOrdersVariant ? "Today's Orders" : 'MiraiX',
    description: isTodaysOrdersVariant
      ? 'A standalone onchain command system that compresses wallet intelligence into one approved daily order, one forbidden order, and one receipt-backed debrief.'
      : 'AI assistant powered by ChatGPT',
    images: ['/opengraph-image']
  },
  twitter: {
    card: 'summary_large_image',
    title: isTodaysOrdersVariant ? "Today's Orders" : 'MiraiX',
    description: isTodaysOrdersVariant
      ? 'A standalone onchain command system that compresses wallet intelligence into one approved daily order, one forbidden order, and one receipt-backed debrief.'
      : 'AI assistant powered by ChatGPT',
    images: ['/opengraph-image']
  },
  other: {
    'base:app_id': '69c7823af832953fc6c8fd15'
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body suppressHydrationWarning>
        <Providers>
          <ThemesProvider>
            <ConditionalHeader />
            {children}
            <Toaster />
          </ThemesProvider>
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
