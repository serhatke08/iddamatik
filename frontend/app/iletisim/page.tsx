import type { Metadata } from 'next'
import { SiteHeader } from '@/components/SiteHeader'

const siteUrl = 'https://iddamatik.vercel.app'

export const metadata: Metadata = {
  title: 'İletişim',
  description:
    'İddaamatik ile iletişim: öneri, iş birliği ve teknik destek talepleri. Geri bildiriminiz platformu geliştirir.',
  openGraph: {
    title: 'İletişim | İddaamatik',
    url: `${siteUrl}/iletisim`,
    type: 'website',
  },
  alternates: { canonical: `${siteUrl}/iletisim` },
}

export default function IletisimPage() {
  return (
    <div className="container">
      <SiteHeader />
      <article className="search-section" style={{ maxWidth: '640px', margin: '0 auto 32px' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '16px', color: '#f9fafb' }}>İletişim</h1>
        <div className="rehber-prose">
          <p>
            Öneri, iş birliği, teknik sorun bildirimi veya içerik düzeltme talepleriniz için aşağıdaki e-posta
            adresini kullanabilirsiniz. Mesajınıza mümkün olan en kısa sürede dönüş yapmaya çalışıyoruz.
          </p>
          <div
            style={{
              marginTop: '24px',
              padding: '20px 22px',
              borderRadius: '12px',
              background: '#0f172a',
              border: '1px solid #1f2937',
            }}
          >
            <p style={{ margin: 0, fontSize: '14px', color: '#9ca3af' }}>E-posta</p>
            <p style={{ margin: '8px 0 0', fontSize: '1.1rem' }}>
              <a href="mailto:destek@iddamatik.com" style={{ color: '#60a5fa', fontWeight: 600 }}>
                destek@iddamatik.com
              </a>
            </p>
          </div>
          <h2 style={{ marginTop: '28px' }}>Sık sorulanlar</h2>
          <p>
            <strong>Reklam ve sponsorluk:</strong> İş birliği tekliflerinizi e-posta ile iletebilirsiniz; konu satırında
            &quot;İş birliği&quot; belirtmeniz yanıt süresini kısaltır.
          </p>
          <p>
            <strong>İçerik şikâyeti:</strong> Telif veya yanlış bilgi bildirimlerinde ilgili sayfanın URL&apos;sini ve
            gerekçeyi ekleyin.
          </p>
        </div>
      </article>
    </div>
  )
}
