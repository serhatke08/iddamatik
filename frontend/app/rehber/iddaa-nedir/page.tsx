import type { Metadata } from 'next'
import { SiteHeader } from '@/components/SiteHeader'

const siteUrl = 'https://iddamatik.vercel.app'
const url = `${siteUrl}/rehber/iddaa-nedir`

export const metadata: Metadata = {
  title: 'İddaa nedir? Türkiye’de yasal spor bahisleri ve temel kavramlar',
  description:
    'İddaa nedir, nasıl oynanır, oran ve maç sonucu kavramları nelerdir? Yasal çerçeve, sorumlu oyun ve bilgilendirici özet — arama motorları için yapılandırılmış rehber.',
  keywords: [
    'iddaa nedir',
    'yasal bahis',
    'spor toto',
    'maç sonucu bahis',
    'oran nedir',
    'sorumlu oyun',
  ],
  openGraph: {
    title: 'İddaa nedir? | İddaamatik Rehber',
    description:
      'Türkiye’de yasal spor bahisleri, temel terimler ve bilinçli oyun hatırlatması. Kesin kazanç vaadi yoktur.',
    url,
    type: 'article',
    locale: 'tr_TR',
  },
  alternates: { canonical: url },
}

const jsonLdArticle = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'İddaa nedir? Temel kavramlar ve yasal çerçeve',
  description:
    'İddaa ve yasal spor bahislerinin tanımı, oran ve maç sonucu kavramları, sorumlu oyun uyarısı.',
  url,
  inLanguage: 'tr-TR',
  author: { '@type': 'Organization', name: 'İddaamatik' },
  publisher: { '@type': 'Organization', name: 'İddaamatik', url: siteUrl },
}

const jsonLdFaq = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'İddaa nedir?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'İddaa, Türkiye’de Spor Toto ve yetkili bayiler aracılığıyla sunulan yasal spor bahis ürünlerinden biridir. Maç sonuçları, gol sayıları ve çeşitli yan bahis türleri üzerinden oynanır; sonuçlar müsabaka gerçekleştikten sonra kesinleşir.',
      },
    },
    {
      '@type': 'Question',
      name: 'Oran ne anlama gelir?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Oran, bir sonucun gerçekleşme olasılığına göre belirlenen çarpandır; düşük oran genelde daha olası görülen sonucu, yüksek oran daha az olası görülen sonucu ifade eder. Oranlar bahis şirketi marjı ile birlikte fiyatlanır.',
      },
    },
  ],
}

export default function IddaaNedirPage() {
  return (
    <div className="container">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdArticle) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }} />
      <SiteHeader />
      <article className="search-section" style={{ maxWidth: '860px', margin: '0 auto 32px' }}>
        <nav style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '16px' }}>
          <a href="/" style={{ color: '#60a5fa', textDecoration: 'none' }}>
            Ana sayfa
          </a>
          <span aria-hidden> / </span>
          <span>Rehber</span>
          <span aria-hidden> / </span>
          <span style={{ color: '#e5e7eb' }}>İddaa nedir?</span>
        </nav>
        <h1 style={{ fontSize: '1.85rem', marginBottom: '16px', color: '#f9fafb', lineHeight: 1.25 }}>
          İddaa nedir? Yasal spor bahisleri ve temel kavramlar
        </h1>
        <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '24px' }}>
          Güncellenme: 2026 · Bilgilendirme amaçlıdır; hukuki veya finansal tavsiye değildir.
        </p>

        <div className="rehber-prose">
          <p>
            <strong>İddaa</strong>, Türkiye&apos;de <strong>Spor Toto</strong> bünyesinde, yetkili bayiler ve yasal
            dijital kanallar üzerinden oynatılan <strong>spor bahisleri</strong> ürünlerinden biridir. Kullanıcılar;
            futbol ve diğer branşlarda maç sonucu, toplam gol, karşılıklı gol gibi farklı <strong>bahis
            türlerinden</strong> seçim yaparak tahminde bulunur. Kazanç, müsabakanın resmi sonucuna ve oynanan bahsin
            kurallarına göre hesaplanır.
          </p>

          <h2>Yasal çerçeve ve yaş sınırı</h2>
          <p>
            Şans oyunları ve bahis düzenlemeleri ülkelere göre değişir. Türkiye&apos;de yasal çerçeve dışında
            sunulan sitelere yönelik riskler (ödeme, güvenlik, hukuki durum) kullanıcıya aittir. <strong>18 yaşından
            küçüklerin</strong> bahis oynaması yasaktır. İddaamatik bir bahis operatörü değildir;{' '}
            <strong>bilgi ve veri analizi</strong> odaklı içerik sunar.
          </p>

          <h2>Temel terimler</h2>
          <ul>
            <li>
              <strong>Maç sonucu (1-X-2):</strong> Ev sahibi galibiyet, beraberlik veya deplasman galibiyeti seçenekleri.
            </li>
            <li>
              <strong>Oran:</strong> Olasılıkların ve işletme marjının birlikte yansıtıldığı çarpan; kazanç potansiyeli
              ile risk arasında denge kurar.
            </li>
            <li>
              <strong>Alt / üst (ör. 2,5 gol):</strong> Toplam gol sayısının belirlenen çizginin altında veya üstünde
              kalıp kalmayacağına dair bahis.
            </li>
            <li>
              <strong>Karşılıklı gol (KG):</strong> Her iki takımın da gol atıp atmayacağına ilişkin pazarlar.
            </li>
          </ul>

          <h2>Bahis türleri (özet)</h2>
          <p>
            Maç sonucu dışında <strong>çifte şans</strong>, <strong>handikap</strong>, <strong>ilk yarı
            sonucu</strong>, <strong>toplam gol (alt/üst)</strong>, <strong>karşılıklı gol</strong>,{' '}
            <strong>doğru skor</strong> gibi onlarca yan pazar bulunabilir. Her birinin <strong>kesin sonuç
            tanımı</strong> (ör. uzatmalar dahil mi, VAR sonrası iptal mi) farklıdır; oynamadan önce kural metnini
            okumak gerekir.
          </p>

          <h2>Analiz kültürü: neden “tek maç” yeterli değil?</h2>
          <p>
            Profesyonel çerçevede bahis, <strong>tek seferlik tahmin</strong> değil <strong>uzun vadeli
            süreç</strong> olarak düşünülür: örneklem, disiplin, bütçe kontrolü. İddaamatik içerikleri bu yüzden{' '}
            <a href="/rehber/iddaa-analiz-nasil-yapilir" style={{ color: '#60a5fa' }}>
              analiz metodolojisi
            </a>{' '}
            ve{' '}
            <a href="/rehber/iddaa-istatistik" style={{ color: '#60a5fa' }}>
              istatistik okuma
            </a>{' '}
            konularında derinleşir.
          </p>

          <h2>İddaamatik burada ne yapar?</h2>
          <p>
            Platformumuz, geçmişe dönük <strong>maç ve oran verilerini</strong> incelemenize yardımcı filtreler ve
            istatistik özetleri sunar. Bu, &quot;geçmişte bu oranlarla neler olmuş&quot; sorusuna veri tarafından
            yaklaşmanızı sağlar; <strong>gelecekteki sonuçları garanti etmez</strong>. Daha teknik kullanım için{' '}
            <a href="/nasil-calisir" style={{ color: '#60a5fa' }}>
              Filtreleme nasıl çalışır?
            </a>{' '}
            rehberine göz atabilirsiniz.
          </p>

          <h2>Sorumlu oyun</h2>
          <p>
            Bahis, eğlence bütçesi dışına taşmamalıdır. Kayıpları telafi etme baskısı, borçlanma veya günlük yaşamı
            aksatma belirtileri varsa profesyonel destek hatlarını ve resmi sorumlu oyun kaynaklarını kullanın.
          </p>

          <h2>Sık sorulanlar</h2>
          <p>
            <strong>İddaa ile canlı bahis aynı mı?</strong> Ürün paketleri ve kanallar operatöre göre değişir; her
            bahis türünün kural seti farklıdır.
          </p>
          <p>
            <strong>Oranlar neden sürekli değişir?</strong> Piyasa haberleri, bahis hacmi ve risk yönetimi nedeniyle
            oranlar güncellenir. Ayrıntılı açıklama için{' '}
            <a href="/rehber/oran-nasil-belirlenir" style={{ color: '#60a5fa' }}>
              Oranlar nasıl belirlenir?
            </a>{' '}
            sayfamızı okuyun.
          </p>
        </div>
      </article>
    </div>
  )
}
