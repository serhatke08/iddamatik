import type { Metadata } from 'next'
import { RehberPageLayout } from '@/components/RehberPageLayout'
import { ProgramRehberIcerik } from '@/components/rehber/ProgramRehberIcerik'

const siteUrl = 'https://iddamatik.vercel.app'
const path = '/rehber/iddaa-analiz-programi'
const url = `${siteUrl}${path}`

export const metadata: Metadata = {
  title: 'İddaa analiz programı: Excel, uygulama, web ve API seçenekleri',
  description:
    'İddaa analiz programı / programi: tablo şablonları, mobil uygulamalar, web panelleri ve Python/API ile model. İddaamatik filtreleri ve risk uyarıları.',
  keywords: ['iddaa analiz programi', 'iddaa analiz programı', 'bahis excel', 'iddaa analiz yazılımı'],
  openGraph: { title: 'İddaa analiz programı | İddaamatik', url, type: 'article', locale: 'tr_TR' },
  alternates: { canonical: url },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'İddaa analiz programı',
  url,
  inLanguage: 'tr-TR',
  author: { '@type': 'Organization', name: 'İddaamatik' },
  publisher: { '@type': 'Organization', name: 'İddaamatik', url: siteUrl },
}

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <RehberPageLayout breadcrumbLabel="İddaa analiz programı">
        <h1 style={{ fontSize: '1.85rem', marginBottom: '14px', color: '#f9fafb', lineHeight: 1.25 }}>
          İddaa analiz programı (programi) seçenekleri
        </h1>
        <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '22px', lineHeight: 1.6 }}>
          Kurulumlu yazılımdan <strong>tarayıcı araçlarına</strong> ve <strong>kendi modelinize</strong> kadar geniş
          bir yelpaze.
        </p>
        <ProgramRehberIcerik />
      </RehberPageLayout>
    </>
  )
}
