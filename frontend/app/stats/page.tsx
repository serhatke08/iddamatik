'use client'

export default function StatsPage() {
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
          </nav>
        </div>
      </nav>

      <div className="search-section">
        <h2 style={{ marginBottom: '16px' }}>📈 Canlı Lig İstatistikleri (Futbol API)</h2>
        <p style={{ marginBottom: '12px', lineHeight: 1.6, color: '#9ca3af', fontSize: '14px' }}>
          Bu sayfada, harici Futbol API üzerinden gelecek lig tablosu, fikstür ve oyuncu istatistiklerini göstereceğiz.
          Şu an için sadece altyapı hazır; endpointleri netleştirdiğimizde burada Süper Lig, Avrupa Ligi vb. için canlı
          puan durumu ve form tabloları görünecek.
        </p>
      </div>
    </div>
  )
}

