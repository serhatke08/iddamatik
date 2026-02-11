import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'İddaa Analiz Platformu',
  description: 'Futbol maçları ve oranlarını analiz edin',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  )
}
