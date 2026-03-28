import type { Metadata } from 'next'
import { RehberPageLayout } from '@/components/RehberPageLayout'
import { OranAnalizIcerik } from '@/components/rehber/OranAnalizIcerik'

const siteUrl = 'https://iddamatik.vercel.app'
const path = '/rehber/iddaa-oran-analiz'
const url = `${siteUrl}${path}`

export const metadata: Metadata = {
  title: 'İddaa oran analizi: implied probability, geçmiş band ve bağlam',
  description:
    'İddaa oran analizi nasıl yapılır: oranı olasılık olarak okuma, marj, geçmiş oran bandı, lig tutarlılığı ve tuzaklar. Uzun rehber.',
  keywords: ['iddaa oran analiz', 'oran analizi', 'implied probability', 'bahis oranı istatistik'],
  openGraph: { title: 'İddaa oran analizi | İddaamatik', url, type: 'article', locale: 'tr_TR' },
  alternates: { canonical: url },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'İddaa oran analizi',
  url,
  inLanguage: 'tr-TR',
  author: { '@type': 'Organization', name: 'İddaamatik' },
  publisher: { '@type': 'Organization', name: 'İddaamatik', url: siteUrl },
}

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <RehberPageLayout breadcrumbLabel="İddaa oran analizi">
        <h1 style={{ fontSize: '1.85rem', marginBottom: '14px', color: '#f9fafb', lineHeight: 1.25 }}>
          İddaa oran analizi nedir?
        </h1>
        <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '22px', lineHeight: 1.6 }}>
          Oranları hem <strong>olasılık</strong> hem <strong>tarihsel dağılım</strong> ile okumak; tek başına yeterli
          değildir — <strong>maç bağlamı</strong> şarttır.
        </p>
        <OranAnalizIcerik />
      </RehberPageLayout>
    </>
  )
}
