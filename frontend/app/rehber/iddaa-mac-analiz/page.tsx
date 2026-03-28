import type { Metadata } from 'next'
import { RehberPageLayout } from '@/components/RehberPageLayout'
import { MacAnaliziIcerik } from '@/components/rehber/MacAnaliziIcerik'

const siteUrl = 'https://iddamatik.vercel.app'
const path = '/rehber/iddaa-mac-analiz'
const url = `${siteUrl}${path}`

export const metadata: Metadata = {
  title: 'İddaa maç analizi: form, H2H, deplasman, kadro ve oran uyumu',
  description:
    'Maç analizi nasıl yapılır: son maçlar (5 vs 10+), karşılıklı geçmiş, ev/deplasman ayrımı, eksikler, seyahat ve oranlarla hikâye tutarlılığı. Detaylı Türkçe rehber.',
  keywords: [
    'iddaa maç analiz',
    'maç analizi bahis',
    'karşılıklı maç',
    'deplasman performansı',
    'form analizi',
  ],
  openGraph: { title: 'İddaa maç analizi (detaylı) | İddaamatik', url, type: 'article', locale: 'tr_TR' },
  alternates: { canonical: url },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'İddaa maç analizi rehberi',
  url,
  inLanguage: 'tr-TR',
  author: { '@type': 'Organization', name: 'İddaamatik' },
  publisher: { '@type': 'Organization', name: 'İddaamatik', url: siteUrl },
}

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <RehberPageLayout breadcrumbLabel="İddaa maç analizi">
        <h1 style={{ fontSize: '1.85rem', marginBottom: '14px', color: '#f9fafb', lineHeight: 1.25 }}>
          İddaa maç analizi
        </h1>
        <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '22px', lineHeight: 1.6 }}>
          Tek satırlık “kim kazanır” yerine; <strong>form örneklemı</strong>, <strong>H2H</strong>,{' '}
          <strong>deplasman</strong>, <strong>kadro</strong> ve <strong>oran</strong> uyumunu birlikte okumak.
        </p>
        <MacAnaliziIcerik />
      </RehberPageLayout>
    </>
  )
}
