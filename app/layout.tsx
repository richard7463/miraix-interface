// @ts-nocheck
import { Analytics } from '@vercel/analytics/react'
import { Toaster } from 'react-hot-toast'
import { Header } from '@/components/Header'
import Providers from '@/providers/PrivyProvider'
import ThemesProvider from '@/providers/ThemesProvider'
import '@/styles/globals.scss'
import '@/styles/theme-config.css'

export const metadata = {
  title: {
    default: 'MiraiX',
    template: `%s - MiraiX`
  },
  description: 'AI assistant powered by ChatGPT',
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.png', sizes: '16x16', type: 'image/png' }
    ],
    shortcut: '/favicon-32x32.png',
    apple: '/favicon-32x32.png'
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          <ThemesProvider>
            <Header />
            {children}
            <Toaster />
          </ThemesProvider>
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
