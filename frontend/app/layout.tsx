import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import './globals.css'
import { SiteFooter } from '@/components/SiteFooter'

const siteUrl = 'https://iddamatik.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'İddaamatik — İddaa analiz, oran istatistikleri ve maç verileri',
    template: '%s | İddaamatik',
  },
  description:
    'Geçmiş maç sonuçları ve oranlar üzerinden filtreleme, lig bazlı analiz ve eğitici rehberler. İddaa nedir, oranlar nasıl belirlenir öğrenin; bilinçli veri incelemesi için araçlar.',
  keywords: [
    'iddaa analiz',
    'oran analizi',
    'maç istatistikleri',
    'futbol bahis oranları',
    'iddaa nedir',
    'oran nasıl belirlenir',
    'karşılıklı gol',
    'alt üst bahis',
    'İddaamatik',
  ],
  authors: [{ name: 'İddaamatik' }],
  creator: 'İddaamatik',
  publisher: 'İddaamatik',
  formatDetection: { email: false, telephone: false },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: siteUrl,
    siteName: 'İddaamatik',
    title: 'İddaamatik — İddaa analiz ve oran istatistikleri',
    description:
      'Geçmiş maç ve oran verileriyle analiz, filtreleme rehberleri ve bilgilendirici içerikler. 18+; sorumlu oynayın.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'İddaamatik — İddaa analiz platformu',
    description: 'Oran ve maç verisi analizi, eğitici rehberler ve şeffaf bilgilendirme.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  alternates: { canonical: siteUrl },
  icons: {
    icon: '/logo.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

const jsonLdOrganization = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'İddaamatik',
  url: siteUrl,
  logo: `${siteUrl}/logo.png`,
  description:
    'Futbol maçları ve bahis oranları üzerinde veri odaklı analiz ve bilgilendirme sunan dijital platform.',
}

const jsonLdWebSite = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'İddaamatik',
  url: siteUrl,
  inLanguage: 'tr-TR',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" style={{ backgroundColor: '#0b0f1a' }}>
      <body
        style={{
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          backgroundColor: '#0b0f1a',
          color: '#e5e7eb',
        }}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrganization) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite) }}
        />
        <div className="app-root">{children}</div>
        <SiteFooter />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6962376212093267"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
