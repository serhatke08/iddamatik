import type { Metadata } from 'next'
import { SiteHeader } from '@/components/SiteHeader'

const siteUrl = 'https://iddamatik.vercel.app'

export const metadata: Metadata = {
  title: 'Gizlilik Politikası',
  description:
    'İddaamatik gizlilik politikası: çerezler, üçüncü taraf hizmetler, reklamlar ve veri güvenliği. KVKK kapsamında aydınlatma metni özeti.',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Gizlilik Politikası | İddaamatik',
    url: `${siteUrl}/gizlilik-politikasi`,
    type: 'article',
  },
  alternates: { canonical: `${siteUrl}/gizlilik-politikasi` },
}

export default function GizlilikPage() {
  return (
    <div className="container">
      <SiteHeader />
      <article className="search-section" style={{ maxWidth: '820px', margin: '0 auto 32px' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '16px', color: '#f9fafb' }}>Gizlilik Politikası</h1>
        <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '20px' }}>
          Son güncelleme: Mart 2026. Bu metin genel bilgilendirme amaçlıdır; hukuki danışmanlık yerine geçmez.
        </p>
        <div className="rehber-prose">
          <h2>Veri sorumlusu</h2>
          <p>
            Bu web sitesi (<strong>İddaamatik</strong>) ziyaret edildiğinde, hizmetin işletilmesi ve iyileştirilmesi
            için sınırlı ölçüde teknik ve kullanım verileri işlenebilir.
          </p>
          <h2>Toplanan veriler</h2>
          <ul>
            <li>
              <strong>Teknik veriler:</strong> tarayıcı türü, cihaz tipi, yaklaşık bölge (IP üzerinden ülke düzeyinde),
              sayfa görüntüleme zamanı gibi sunucu günlükleri.
            </li>
            <li>
              <strong>Çerezler (cookies):</strong> oturum ve tercihlerin hatırlanması; üçüncü taraf analitik veya
              reklam ağlarının yerleştirdiği çerezler siteye gömülü kodlar aracılığıyla çalışabilir.
            </li>
            <li>
              <strong>Form / iletişim:</strong> İletişim sayfasından gönderdiğiniz e-posta veya mesajlarda paylaştığınız
              bilgiler yalnızca talebinizi yanıtlamak için kullanılır.
            </li>
          </ul>
          <h2>Reklamlar</h2>
          <p>
            Sitede görüntülenen reklamlar üçüncü taraf reklam ağları (ör. Google AdSense) tarafından kişiselleştirilebilir.
            Bu sağlayıcıların gizlilik politikalarını incelemenizi öneririz. Reklam tercihlerinizi tarayıcı ve cihaz
            ayarlarından yönetebilirsiniz.
          </p>
          <h2>Üçüncü taraf bağlantılar</h2>
          <p>
            Sitemizde dış sitelere bağlantılar bulunabilir. Bu sitelerin gizlilik uygulamalarından İddaamatik sorumlu
            değildir.
          </p>
          <h2>Veri güvenliği</h2>
          <p>
            Verilerin korunması için makul teknik ve idari tedbirler uygulanır; ancak internet üzerindeki hiçbir
            iletimin %100 güvenli olduğu garanti edilemez.
          </p>
          <h2>Haklarınız (KVKK)</h2>
          <p>
            Kişisel verilerinizin işlendiği ölçüde, mevzuatın öngördüğü kapsamda bilgi talep etme, düzeltme ve silme
            taleplerinizi iletişim kanallarımız üzerinden iletebilirsiniz.
          </p>
          <h2>İletişim</h2>
          <p>
            Gizlilik ile ilgili sorularınız için{' '}
            <a href="/iletisim" style={{ color: '#60a5fa' }}>
              İletişim
            </a>{' '}
            sayfamızı kullanın.
          </p>
        </div>
      </article>
    </div>
  )
}
