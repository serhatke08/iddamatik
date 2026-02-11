'use client'

export default function OddsInfoPage() {
  return (
    <div className="container">
      <nav className="navbar">
        <div className="navbar-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img
              src="/logo.png"
              alt="İddaamatik logo"
              style={{ height: '32px', width: '32px', objectFit: 'contain' }}
            />
            <h1>İddaa Analiz Platformu</h1>
          </div>
          <nav>
            <a href="/">Ana Sayfa</a>
            <a href="/odds">Oranlar</a>
            <a href="/analysis-robot">Analiz Robotu</a>
            <a href="/stats">İstatistik</a>
          </nav>
        </div>
      </nav>

      <div className="search-section">
        <h2 style={{ marginBottom: '16px' }}>Oranlar Nasıl Belirlenir?</h2>
        <p style={{ marginBottom: '12px', lineHeight: 1.6 }}>
          Oranlar; bir maçtaki olasılıkların, piyasa beklentisinin ve risk dengesinin sayısal
          karşılığıdır. Temel olarak her sonuç için bir “olasılık” tahmini yapılır, bu olasılık
          değeri oranlara çevrilir ve üzerine “marj” (bookmaker payı) eklenir. Böylece oranlar
          hem tahmini olasılığı hem de piyasa kâr payını içerir.
        </p>

        <h3 style={{ margin: '18px 0 10px' }}>1) Olasılık Modellemesi</h3>
        <p style={{ marginBottom: '12px', lineHeight: 1.6 }}>
          Takımların güçleri, form durumu, kadro değişimleri, sakat/cezalı oyuncular,
          iç/dış saha performansı, fikstür yoğunluğu, hava koşulları ve geçmiş maç verileri
          gibi faktörler kullanılarak olasılıklar hesaplanır. Bu hesaplar istatistiksel
          modeller, ELO puanları, Poisson dağılımı veya makine öğrenmesi ile yapılabilir.
        </p>

        <h3 style={{ margin: '18px 0 10px' }}>2) Piyasa ve Likidite Etkisi</h3>
        <p style={{ marginBottom: '12px', lineHeight: 1.6 }}>
          Oranlar sadece model çıktısına göre değil, piyasanın ilgisine göre de şekillenir.
          Büyük ligler ve popüler takımlarda oranlar daha hızlı güncellenir. Oyuncu tercihleri
          (ör. favorilere yoğun talep) oranları oynatır. Bu nedenle oranlar “dinamik”tir.
        </p>

        <h3 style={{ margin: '18px 0 10px' }}>3) Marj (Bookmaker Payı)</h3>
        <p style={{ marginBottom: '12px', lineHeight: 1.6 }}>
          Oranlar hesaplanırken toplam olasılık %100’ün üzerine çıkarılır. Bu fark marjdır.
          Örnek: MS1 %50, MSX %30, MS2 %20 toplam %100 iken, marj eklenince toplam %105–110
          olabilir. Bu marj, oranların “gerçek olasılıktan” biraz daha düşük görünmesine neden olur.
        </p>

        <h3 style={{ margin: '18px 0 10px' }}>4) Oran Türleri (Örnekler)</h3>
        <ul style={{ marginLeft: '18px', lineHeight: 1.6 }}>
          <li><strong>MS1 / MSX / MS2</strong>: Maç sonucu (Ev / Beraberlik / Deplasman)</li>
          <li><strong>Alt / Üst</strong>: Toplam gol çizgisine göre (0.5, 1.5, 2.5, 3.5, 4.5)</li>
          <li><strong>KG (BTTS)</strong>: Karşılıklı gol (Var / Yok)</li>
          <li><strong>İY / MS</strong>: İlk yarı ve maç sonucu kombinasyonları</li>
        </ul>

        <h3 style={{ margin: '18px 0 10px' }}>5) Bizim Platformda Ne Yapıyoruz?</h3>
        <p style={{ marginBottom: '12px', lineHeight: 1.6 }}>
          Platform, geçmiş oranları ve sonuçları aynı ekranda filtrelemenizi sağlar. Amaç;
          benzer oran aralıklarında maçların nasıl sonuçlandığını görüp istatistiksel
          analiz yapmaktır. Bu bir bahis aracı değildir; tamamen veri analizi içindir.
        </p>
      </div>
    </div>
  )
}
