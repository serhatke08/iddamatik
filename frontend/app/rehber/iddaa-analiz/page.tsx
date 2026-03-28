import type { Metadata } from 'next'
import { RehberPageLayout } from '@/components/RehberPageLayout'
import { IddaaAnalizGenelIcerik } from '@/components/rehber/IddaaAnalizGenelIcerik'

const siteUrl = 'https://iddamatik.vercel.app'
const path = '/rehber/iddaa-analiz'
const url = `${siteUrl}${path}`

export const metadata: Metadata = {
  title: 'İddaa analiz nedir? Veri, tahmin ve idda/iddia yazımı (kapsamlı)',
  description:
    'İddaa analiz (idda analiz, iddia analiz) ne demek? Veri odaklı çerçeve, taraftarlık tuzakları, analiz ile tahmin farkı ve İddaamatik’in rolü.',
  keywords: [
    'iddaa analiz',
    'idda analiz',
    'iddia analiz',
    'iddaa analizi nedir',
    'spor bahis analizi',
  ],
  openGraph: { title: 'İddaa analiz nedir? | İddaamatik', url, type: 'article', locale: 'tr_TR' },
  alternates: { canonical: url },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'İddaa analiz nedir?',
  url,
  inLanguage: 'tr-TR',
  author: { '@type': 'Organization', name: 'İddaamatik' },
  publisher: { '@type': 'Organization', name: 'İddaamatik', url: siteUrl },
}

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <RehberPageLayout breadcrumbLabel="İddaa analiz">
        <h1 style={{ fontSize: '1.85rem', marginBottom: '14px', color: '#f9fafb', lineHeight: 1.25 }}>
          İddaa analiz nedir?
        </h1>
        <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '22px', lineHeight: 1.6 }}>
          Kavramsal giriş: <strong>iddaa analizi</strong> ile <strong>tahmin</strong> aynı şey değildir; aşağıda
          ayrıntılı açıklıyoruz.
        </p>
        <IddaaAnalizGenelIcerik />
      </RehberPageLayout>
    </>
  )
}
