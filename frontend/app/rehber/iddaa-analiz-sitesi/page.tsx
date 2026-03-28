import type { Metadata } from 'next'
import { RehberPageLayout } from '@/components/RehberPageLayout'
import { SiteSecimiIcerik } from '@/components/rehber/SiteSecimiIcerik'

const siteUrl = 'https://iddamatik.vercel.app'
const path = '/rehber/iddaa-analiz-sitesi'
const url = `${siteUrl}${path}`

export const metadata: Metadata = {
  title: 'İddaa analiz sitesi nasıl seçilir? Şeffaflık, dil ve güven kriterleri',
  description:
    'İddaa analiz sitesi değerlendirme: veri kaynağı şeffaflığı, kesin kazanç vaatleri, HTTPS ve gizlilik, içerik çeşitliliği. İddaamatik konumlandırması.',
  keywords: ['iddaa analiz sitesi', 'güvenilir analiz sitesi', 'bahis veri sitesi'],
  openGraph: { title: 'İddaa analiz sitesi | İddaamatik', url, type: 'article', locale: 'tr_TR' },
  alternates: { canonical: url },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'İddaa analiz sitesi nasıl seçilir?',
  url,
  inLanguage: 'tr-TR',
  author: { '@type': 'Organization', name: 'İddaamatik' },
  publisher: { '@type': 'Organization', name: 'İddaamatik', url: siteUrl },
}

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <RehberPageLayout breadcrumbLabel="İddaa analiz sitesi">
        <h1 style={{ fontSize: '1.85rem', marginBottom: '14px', color: '#f9fafb', lineHeight: 1.25 }}>
          İddaa analiz sitesi nasıl seçilir?
        </h1>
        <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '22px', lineHeight: 1.6 }}>
          Güvenilir siteler <strong>şeffaf veri</strong>, <strong>ölçülü dil</strong> ve <strong>teknik güvenlik</strong>{' '}
          sunar.
        </p>
        <SiteSecimiIcerik />
      </RehberPageLayout>
    </>
  )
}
