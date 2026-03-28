import type { Metadata } from 'next'
import { RehberPageLayout } from '@/components/RehberPageLayout'
import { IstatistikRehberIcerik } from '@/components/rehber/IstatistikRehberIcerik'

const siteUrl = 'https://iddamatik.vercel.app'
const path = '/rehber/iddaa-istatistik'
const url = `${siteUrl}${path}`

export const metadata: Metadata = {
  title: 'İddaa istatistik: örneklem, ev/deplasman, rakip kalitesi ve xG',
  description:
    'İddaa istatistik rehberi: son 5 maç riski, 10–15 maç örneklem, ev/deplasman ayrımı, rakip gücü, ortalamanın ötesi ve İddaamatik ile tamamlayıcı veri.',
  keywords: ['iddaa istatistik', 'bahis istatistik', 'ev deplasman form', 'xG analiz'],
  openGraph: { title: 'İddaa istatistik | İddaamatik', url, type: 'article', locale: 'tr_TR' },
  alternates: { canonical: url },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'İddaa istatistik',
  url,
  inLanguage: 'tr-TR',
  author: { '@type': 'Organization', name: 'İddaamatik' },
  publisher: { '@type': 'Organization', name: 'İddaamatik', url: siteUrl },
}

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <RehberPageLayout breadcrumbLabel="İddaa istatistik">
        <h1 style={{ fontSize: '1.85rem', marginBottom: '14px', color: '#f9fafb', lineHeight: 1.25 }}>
          İddaa istatistik ile analiz
        </h1>
        <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '22px', lineHeight: 1.6 }}>
          Sayılar <strong>bağlam</strong> ve <strong>doğru örneklem</strong> olmadan yanıltıcı olabilir.
        </p>
        <IstatistikRehberIcerik />
      </RehberPageLayout>
    </>
  )
}
