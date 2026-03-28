import type { Metadata } from 'next'
import { SiteHeader } from '@/components/SiteHeader'

const siteUrl = 'https://iddamatik.vercel.app'
const url = `${siteUrl}/rehber/oran-nasil-belirlenir`

export const metadata: Metadata = {
  title: 'Oranlar nasıl belirlenir? Olasılık, marj ve piyasa dengesi',
  description:
    'Bahis oranları nasıl hesaplanır? İmplied probability, bookmaker marjı, Asian handicap ve oran hareketleri. SEO uyumlu, tarafsız eğitim içeriği.',
  keywords: [
    'oran nasıl belirlenir',
    'bahis oranı hesaplama',
    'bookmaker marjı',
    'implied probability',
    'oran hareketi',
    'iddaa oranları',
  ],
  openGraph: {
    title: 'Oranlar nasıl belirlenir? | İddaamatik Rehber',
    description:
      'Olasılık tahmini, marj ve risk yönetimi: spor bahis oranlarının arkasındaki mantık (bilgilendirme).',
    url,
    type: 'article',
    locale: 'tr_TR',
  },
  alternates: { canonical: url },
}

const jsonLdArticle = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Oranlar nasıl belirlenir? Olasılık ve marj',
  description: 'Spor bahis oranlarının olasılık ve işletme marjı ile ilişkisi.',
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
      name: 'Bahis oranı ile olasılık arasındaki ilişki nedir?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Olasılık tahmini sayısallaştırılır ve genellikle ondalık veya kesirli orana çevrilir. Üzerine işletme marjı (overround) eklenerek piyasaya sunulan fiyat elde edilir; bu yüzden tüm sonuçların çıpalı olasılıkları toplamı %100’ü genelde aşar.',
      },
    },
    {
      '@type': 'Question',
      name: 'Oranlar maç öncesi neden değişir?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Takım haberleri, sakatlıklar, hava koşulları ve bahis hacminin dağılımı oranları hareket ettirir; işletmeler risklerini dengelemek için fiyat günceller.',
      },
    },
  ],
}

export default function OranNasilBelirlenirPage() {
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
          <span style={{ color: '#e5e7eb' }}>Oranlar nasıl belirlenir?</span>
        </nav>
        <h1 style={{ fontSize: '1.85rem', marginBottom: '16px', color: '#f9fafb', lineHeight: 1.25 }}>
          Oranlar nasıl belirlenir? Olasılık, marj ve piyasa dengesi
        </h1>
        <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '24px' }}>
          Güncellenme: 2026 · Eğitim içeriği; belirli bir operatörün ticari formülünü ifşa etmez.
        </p>

        <div className="rehber-prose">
          <p>
            Spor bahislerinde gördüğünüz <strong>oran</strong> (fiyat), kısaca iki şeyin birleşimidir:{' '}
            <strong>sonuç için tahmin edilen olasılık</strong> ve <strong>bahis şirketinin marjı</strong> (kâr payı).
            Oranlar &quot;rastgele&quot; seçilmez; modelleme, uzman görüşü ve piyasadan gelen bahis akışı ile sürekli
            güncellenir.
          </p>

          <h2>1. Olasılıktan fiyata</h2>
          <p>
            Önce analistler veya modeller bir sonucun gerçekleşme ihtimalini tahmin eder (örneğin ev sahibi galibiyeti
            için %45). Bu olasılık, ondalık orana çevrilebilir: kabaca{' '}
            <code style={{ color: '#93c5fd' }}>1 / olasılık</code> ilişkisiyle düşünülür (uygulamada kesir ve ondalık
            formatlar ve yuvarlamalar devreye girer). Tek bir sonuç için bu basit çerçeve işe yarar; çoklu sonuçta ise
            tüm seçenekler birlikte normalize edilir.
          </p>

          <h2>2. Marj (overround)</h2>
          <p>
            İşletme, risk aldığı için tüm seçeneklere küçük bir &quot;pay&quot; ekler. Bu yüzden bir maçın 1-X-2
            piyasasında, çıpalı olasılıkların toplamı <strong>%100’ün üzerine</strong> çıkar; fark marjı gösterir.
            Marj ne kadar yüksekse, uzun vadede teorik olarak oyuncu getirisi o kadar düşük olabilir — bu genel bir
            ilkedir, bireysel sonuçları garanti etmez.
          </p>

          <h2>3. Oran neden hareket eder?</h2>
          <ul>
            <li>
              <strong>Bilgi akışı:</strong> sakatlık, kadro, hava, hakem gibi faktörler tahminleri değiştirir.
            </li>
            <li>
              <strong>Bahis hacmi:</strong> tek taraflı yoğun para akışı, şirketin riskini artırır; denge için oran
              kaydırılır.
            </li>
            <li>
              <strong>Rekabet:</strong> farklı siteler birbirinin fiyatına göre ince ayar yapabilir.
            </li>
          </ul>

          <h2>4. Ondalık oran ve “çıpalı” olasılık</h2>
          <p>
            Ondalık (decimal) formatta oran <code style={{ color: '#93c5fd' }}>2.00</code> ise kabaca{' '}
            <strong>1 / 2.00 = %50</strong> çıpalı olasılık okuması yapılabilir (marj hariç düşünülmüş basit
            yaklaşım). Gerçek piyasada bu üç sonuçlu (1-X-2) bir maçta her seçenek için ayrı marj ve yuvarlama
            olduğundan, üç çıpalı olasılığın toplamı <strong>%100’ün üzerine</strong> çıkar — fark, bahis
            şirketinin payıdır.
          </p>
          <p>
            <strong>Kapanış oranı</strong> (maç öncesi son fiyat) birçok modelde referans kabul edilir: açılış ile
            kapanış arasındaki fark, piyasanın yeni bilgiye nasıl uyum sağladığını gösterir. “Erken değer” arayan
            yaklaşımlar, açılış–kapanış farkını inceleyebilir; bu, analiz disiplinidir, kazanç garantisi değildir.
          </p>

          <h2>5. “Sharp” ve “soft” hatlar (kavramsal)</h2>
          <p>
            Profesyonel literatürde <strong>keskin (sharp)</strong> piyasalar derin likidite ve hızlı fiyat
            güncellemesi ile bilinir; <strong>yumuşak (soft)</strong> hatlar daha yavaş uyum sağlayabilir. Bireysel
            oyuncu için pratik ders: <strong>oran hareketi</strong> bazen bilgi akışını takip eder — senin manuel
            analizin ile çelişiyorsa, ya senin modelinde eksik vardır ya da piyasa farklı bir bilgi setini
            fiyatlamıştır.
          </p>

          <h2>6. İddaamatik’te veriyle ilişki</h2>
          <p>
            Platformumuz, geçmiş maçlarda belirli bir <strong>oran seviyesinin</strong> nasıl dağıldığını incelemenize
            yardımcı olur; bu, &quot;aynı fiyat bandında geçmişte ne olmuş&quot; sorusuna yöneliktir. Bu analiz{' '}
            <strong>gelecekteki maçların kesin sonucunu öngörmez</strong>. Filtre mantığı için{' '}
            <a href="/nasil-calisir" style={{ color: '#60a5fa' }}>
              Filtreleme rehberi
            </a>
            ; aynı konuda görsel özet için{' '}
            <a href="/odds" style={{ color: '#60a5fa' }}>
              Oranlar
            </a>{' '}
            sayfasına da bakabilirsiniz.
          </p>

          <h2>7. Özet</h2>
          <p>
            Oranlar; <strong>olasılık tahmini + marj + piyasa dengesi</strong> ile şekillenir. Bilinçli kullanıcı,
            oranı &quot;sihirli sayı&quot; değil, <strong>fiyat</strong> olarak görür ve bütçesini buna göre yönetir.
          </p>
        </div>
      </article>
    </div>
  )
}
