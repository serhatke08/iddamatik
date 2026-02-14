import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'İddaa Analiz Platformu',
  description: 'Futbol maçları ve oranlarını analiz edin',
  icons: {
    icon: '/logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6962376212093267"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
