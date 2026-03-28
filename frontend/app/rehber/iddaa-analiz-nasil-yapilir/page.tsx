import type { Metadata } from 'next'
import { RehberPageLayout } from '@/components/RehberPageLayout'
import { AnalizNasilYapilirIcerik } from '@/components/rehber/AnalizNasilYapilirIcerik'

const siteUrl = 'https://iddamatik.vercel.app'
const path = '/rehber/iddaa-analiz-nasil-yapilir'
const url = `${siteUrl}${path}`

export const metadata: Metadata = {
  title:
    'İddaa analiz nasıl yapılır? Form, H2H, ev/deplasman, kadro ve oran çerçevesi (detaylı rehber)',
  description:
    'İddaa analizinin nasıl yapılması gerektiği: son 5 maç yeterli mi, karşılıklı maçlar (H2H), deplasman performansı, sakatlık, fikstür yoğunluğu, motivasyon, xG ve oran okuma. Kontrol listesi ve disiplin.',
  keywords: [
    'iddaa analiz nasıl yapılır',
    'iddaa analizi nasıl yapılır',
    'son 5 maç formu',
    'karşılıklı maç analizi',
    'ev deplasman form',
    'bahis analiz rehberi',
  ],
  openGraph: {
    title: 'İddaa analiz nasıl yapılır? (uzman çerçeve) | İddaamatik',
    url,
    type: 'article',
    locale: 'tr_TR',
  },
  alternates: { canonical: url },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'İddaa analiz nasıl yapılır? Profesyonel çerçeve',
  url,
  inLanguage: 'tr-TR',
  author: { '@type': 'Organization', name: 'İddaamatik' },
  publisher: { '@type': 'Organization', name: 'İddaamatik', url: siteUrl },
}

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <RehberPageLayout breadcrumbLabel="İddaa analiz nasıl yapılır?">
        <h1 style={{ fontSize: '1.85rem', marginBottom: '14px', color: '#f9fafb', lineHeight: 1.25 }}>
          İddaa analiz nasıl yapılır?
        </h1>
        <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '22px', lineHeight: 1.6 }}>
          Bu rehber; <strong>form</strong>, <strong>karşılıklı maçlar</strong>, <strong>ev–deplasman</strong>,{' '}
          <strong>kadro</strong>, <strong>fikstür</strong>, <strong>motivasyon</strong>, <strong>istatistik</strong> ve{' '}
          <strong>oran okuma</strong> için uygulanabilir bir çerçeve sunar. Kesin kazanç yoktur; amaç bilinçli karar
          sürecidir.
        </p>
        <AnalizNasilYapilirIcerik />
      </RehberPageLayout>
    </>
  )
}
