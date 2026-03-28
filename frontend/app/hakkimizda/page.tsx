import type { Metadata } from 'next'
import { SiteHeader } from '@/components/SiteHeader'

const siteUrl = 'https://iddamatik.vercel.app'

export const metadata: Metadata = {
  title: 'Hakkımızda',
  description:
    'İddaamatik: geçmiş maç ve oran verileriyle analiz odaklı bilgi platformu. Misyonumuz, şeffaf veri ve eğitici içerikle bilinçli izleyici kitlesi oluşturmaktır.',
  keywords: ['İddaamatik', 'iddaa analiz platformu', 'oran istatistikleri', 'maç veri analizi'],
  openGraph: {
    title: 'Hakkımızda | İddaamatik',
    description: 'Platform hakkında: veri kaynakları, kullanım amacı ve sorumluluk ilkeleri.',
    url: `${siteUrl}/hakkimizda`,
    type: 'article',
  },
  alternates: { canonical: `${siteUrl}/hakkimizda` },
}

export default function HakkimizdaPage() {
  return (
    <div className="container">
      <SiteHeader />
      <article className="search-section" style={{ maxWidth: '820px', margin: '0 auto 32px' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '16px', color: '#f9fafb' }}>Hakkımızda</h1>
        <div className="rehber-prose">
          <p>
            <strong>İddaamatik</strong>, futbol müsabakalarına ait geçmişe dönük maç sonuçları ve bahis oranlarını
            bir araya getirerek kullanıcıların veri üzerinden kendi analizlerini yapmasına yardımcı olan bir bilgi
            platformudur. Amacımız &quot;kazanma garantisi&quot; sunmak değil; <strong>şeffaf veri</strong>,{' '}
            <strong>filtrelenebilir arşiv</strong> ve <strong>öğretici rehber içerikleri</strong> ile ziyaretçilerin
            oranların ve maç sonuçlarının nasıl ilişkilendirilebileceğini anlamasına katkı sağlamaktır.
          </p>
          <h2>Ne sunuyoruz?</h2>
          <ul>
            <li>
              Geçmiş maçlarda lig, takım, skor ve çeşitli bahis türlerine göre <strong>filtreleme</strong> araçları.
            </li>
            <li>
              Oranların istatistiksel dağılımına dair <strong>görselleştirmeler ve özetler</strong> (sayfa özelliklerine
              bağlı olarak).
            </li>
            <li>
              &quot;İddaa nedir?&quot;, &quot;Oranlar nasıl belirlenir?&quot; gibi konularda <strong>tarafsız bilgilendirme</strong>{' '}
              yazıları — Google ve diğer arama motorlarında güvenilir kaynak olmayı hedefleyen SEO uyumlu içerikler.
            </li>
          </ul>
          <h2>Sorumluluk ve yaş sınırı</h2>
          <p>
            Şans oyunları Türkiye&apos;de yasal düzenlemelere tabidir. Platformumuz yasal düzenlemelere aykırı teşvik
            veya reklam niteliği taşıyan içerik üretmez. <strong>18 yaşından küçüklerin</strong> bahis ve şans
            oyunlarına katılması yasaktır. İddaamatik&apos;i kullanarak verdiğiniz kararlardan yalnızca siz
            sorumlusunuz; burada yer alan hiçbir veri veya analiz <strong>yatırım tavsiyesi</strong> veya{' '}
            <strong>kesin sonuç vaadi</strong> değildir.
          </p>
          <h2>İletişim</h2>
          <p>
            Sorularınız için{' '}
            <a href="/iletisim" style={{ color: '#60a5fa' }}>
              İletişim
            </a>{' '}
            sayfamızdaki kanalları kullanabilirsiniz.
          </p>
        </div>
      </article>
    </div>
  )
}
