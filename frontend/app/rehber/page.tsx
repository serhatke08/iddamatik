import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/SiteHeader'

const siteUrl = 'https://iddamatik.vercel.app'

export const metadata: Metadata = {
  title: 'İddaa analiz rehberi — oran, istatistik ve maç analizi yazıları',
  description:
    'İddaa oran analizi, istatistik, maç analizi, analiz programı ve nasıl yapılır konularında bilgilendirici sayfalar. İddaamatik rehber indeksi.',
  keywords: [
    'iddaa analiz',
    'iddaa oran analiz',
    'iddaa istatistik',
    'iddaa analiz programı',
    'iddaa analiz sitesi',
  ],
  openGraph: {
    title: 'İddaa analiz rehberi | İddaamatik',
    description: 'Oran, istatistik ve maç analizi konularında tüm rehber yazıları.',
    url: `${siteUrl}/rehber`,
    type: 'website',
    locale: 'tr_TR',
  },
  alternates: { canonical: `${siteUrl}/rehber` },
}

const articles = [
  { href: '/rehber/iddaa-analiz', title: 'İddaa analiz nedir?' },
  { href: '/rehber/iddaa-oran-analiz', title: 'İddaa oran analizi' },
  { href: '/rehber/iddaa-istatistik', title: 'İddaa istatistik' },
  { href: '/rehber/iddaa-mac-analiz', title: 'İddaa maç analizi' },
  { href: '/rehber/iddaa-analiz-nasil-yapilir', title: 'İddaa analiz nasıl yapılır?' },
  { href: '/rehber/iddaa-analiz-programi', title: 'İddaa analiz programı / programi' },
  { href: '/rehber/iddaa-analiz-sitesi', title: 'İddaa analiz sitesi nasıl seçilir?' },
  { href: '/rehber/iddaa-nedir', title: 'İddaa nedir?' },
  { href: '/rehber/oran-nasil-belirlenir', title: 'Oranlar nasıl belirlenir?' },
  { href: '/nasil-calisir', title: 'Filtreleme nasıl çalışır? (platform)' },
]

export default function RehberIndexPage() {
  return (
    <div className="container">
      <SiteHeader />
      <article className="search-section" style={{ maxWidth: '720px', margin: '0 auto 40px' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '12px', color: '#f9fafb' }}>Bilgi rehberi</h1>
        <p style={{ color: '#9ca3af', marginBottom: '28px', lineHeight: 1.6 }}>
          Arama motorlarında sık sorulan başlıklara göre hazırlanmış içerikler. 18+; kesin kazanç vaadi yoktur.
        </p>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {articles.map((a) => (
            <li key={a.href} style={{ borderBottom: '1px solid #1f2937' }}>
              <Link
                href={a.href}
                style={{
                  display: 'block',
                  padding: '14px 0',
                  color: '#60a5fa',
                  textDecoration: 'none',
                  fontSize: '15px',
                  fontWeight: 500,
                }}
              >
                {a.title}
              </Link>
            </li>
          ))}
        </ul>
      </article>
    </div>
  )
}
