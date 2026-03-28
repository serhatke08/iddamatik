'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'

interface AccordionItem {
  id: string
  title: string
  content: React.ReactNode
}

export default function OddsInfoPage() {
  const pathname = usePathname()
  const [openItems, setOpenItems] = useState<Set<string>>(new Set(['intro']))

  const toggleItem = (id: string) => {
    setOpenItems(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const accordionItems: AccordionItem[] = [
    {
      id: 'intro',
      title: 'Oranlar Nasıl Belirlenir?',
      content: (
        <div style={{ padding: '20px 0', lineHeight: 1.8, color: '#d1d5db' }}>
          <p style={{ marginBottom: '16px', fontSize: '15px' }}>
            Oranlar; bir maçtaki <strong style={{ color: '#60a5fa' }}>olasılıkların</strong>, <strong style={{ color: '#60a5fa' }}>piyasa beklentisinin</strong> ve <strong style={{ color: '#60a5fa' }}>risk dengesinin</strong> sayısal karşılığıdır.
          </p>
          <p style={{ marginBottom: '16px', fontSize: '15px' }}>
            Temel olarak her sonuç için bir <strong style={{ color: '#60a5fa' }}>"olasılık"</strong> tahmini yapılır, bu olasılık değeri oranlara çevrilir ve üzerine <strong style={{ color: '#fbbf24' }}>"marj"</strong> (bookmaker payı) eklenir.
          </p>
          <p style={{ fontSize: '15px' }}>
            Böylece oranlar hem <strong style={{ color: '#60a5fa' }}>tahmini olasılığı</strong> hem de <strong style={{ color: '#fbbf24' }}>piyasa kâr payını</strong> içerir.
          </p>
        </div>
      )
    },
    {
      id: 'probability',
      title: '1) Olasılık Modellemesi',
      content: (
        <div style={{ padding: '20px 0', lineHeight: 1.8, color: '#d1d5db' }}>
          <p style={{ marginBottom: '16px', fontSize: '15px' }}>
            Olasılıklar hesaplanırken aşağıdaki faktörler kullanılır:
          </p>
          <ul style={{ marginLeft: '20px', marginBottom: '16px', fontSize: '15px', listStyle: 'none' }}>
            <li style={{ marginBottom: '10px', paddingLeft: '24px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: 0, color: '#60a5fa' }}>▸</span>
              <strong style={{ color: '#93c5fd' }}>Takım güçleri</strong> ve form durumu
            </li>
            <li style={{ marginBottom: '10px', paddingLeft: '24px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: 0, color: '#60a5fa' }}>▸</span>
              <strong style={{ color: '#93c5fd' }}>Kadro değişimleri</strong>, sakat ve cezalı oyuncular
            </li>
            <li style={{ marginBottom: '10px', paddingLeft: '24px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: 0, color: '#60a5fa' }}>▸</span>
              <strong style={{ color: '#93c5fd' }}>İç/dış saha performansı</strong> ve fikstür yoğunluğu
            </li>
            <li style={{ marginBottom: '10px', paddingLeft: '24px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: 0, color: '#60a5fa' }}>▸</span>
              <strong style={{ color: '#93c5fd' }}>Hava koşulları</strong> ve geçmiş maç verileri
            </li>
          </ul>
          <p style={{ fontSize: '15px', padding: '16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', borderLeft: '3px solid #3b82f6' }}>
            Bu hesaplar <strong style={{ color: '#60a5fa' }}>istatistiksel modeller</strong>, <strong style={{ color: '#60a5fa' }}>ELO puanları</strong>, <strong style={{ color: '#60a5fa' }}>Poisson dağılımı</strong> veya <strong style={{ color: '#60a5fa' }}>makine öğrenmesi</strong> ile yapılabilir.
          </p>
        </div>
      )
    },
    {
      id: 'market',
      title: '2) Piyasa ve Likidite Etkisi',
      content: (
        <div style={{ padding: '20px 0', lineHeight: 1.8, color: '#d1d5db' }}>
          <p style={{ marginBottom: '16px', fontSize: '15px' }}>
            Oranlar sadece model çıktısına göre değil, <strong style={{ color: '#60a5fa' }}>piyasanın ilgisine göre</strong> de şekillenir.
          </p>
          <div style={{ marginBottom: '16px', padding: '16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', borderLeft: '3px solid #3b82f6' }}>
            <p style={{ marginBottom: '12px', fontSize: '15px' }}>
              <strong style={{ color: '#93c5fd' }}>Büyük ligler</strong> ve <strong style={{ color: '#93c5fd' }}>popüler takımlarda</strong> oranlar daha hızlı güncellenir.
            </p>
            <p style={{ fontSize: '15px' }}>
              <strong style={{ color: '#fbbf24' }}>Oyuncu tercihleri</strong> (ör. favorilere yoğun talep) oranları oynatır. Bu nedenle oranlar <strong style={{ color: '#60a5fa' }}>"dinamik"</strong>tir.
            </p>
          </div>
          <p style={{ fontSize: '15px' }}>
            Örneğin, bir takıma çok fazla bahis yapılırsa, bookmaker riski azaltmak için o takımın oranını düşürür (daha düşük oran = daha yüksek olasılık görünümü).
          </p>
        </div>
      )
    },
    {
      id: 'margin',
      title: '3) Marj (Bookmaker Payı)',
      content: (
        <div style={{ padding: '20px 0', lineHeight: 1.8, color: '#d1d5db' }}>
          <p style={{ marginBottom: '16px', fontSize: '15px' }}>
            Oranlar hesaplanırken toplam olasılık <strong style={{ color: '#fbbf24' }}>%100'ün üzerine</strong> çıkarılır. Bu fark <strong style={{ color: '#fbbf24' }}>marj</strong>dır.
          </p>
          <div style={{ marginBottom: '16px', padding: '20px', background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.15) 100%)', borderRadius: '10px', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
            <p style={{ marginBottom: '12px', fontSize: '15px', fontWeight: 600, color: '#fbbf24' }}>
              Örnek Hesaplama:
            </p>
            <div style={{ fontSize: '14px', lineHeight: '2' }}>
              <div>MS1: %50 → Oran: 2.00</div>
              <div>MSX: %30 → Oran: 3.33</div>
              <div>MS2: %20 → Oran: 5.00</div>
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(251, 191, 36, 0.3)' }}>
                <strong style={{ color: '#fbbf24' }}>Toplam: %100</strong>
              </div>
              <div style={{ marginTop: '8px', color: '#fbbf24' }}>
                <strong>Marj eklenince: %105-110</strong> (Bookmaker kârı)
              </div>
            </div>
          </div>
          <p style={{ fontSize: '15px', padding: '16px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '8px', borderLeft: '3px solid #fbbf24' }}>
            Bu marj, oranların <strong style={{ color: '#fbbf24' }}>"gerçek olasılıktan"</strong> biraz daha düşük görünmesine neden olur. Bookmaker bu fark sayesinde her durumda kâr eder.
          </p>
        </div>
      )
    },
    {
      id: 'types',
      title: '4) Oran Türleri (Örnekler)',
      content: (
        <div style={{ padding: '20px 0', lineHeight: 1.8, color: '#d1d5db' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#60a5fa', marginBottom: '8px' }}>MS1 / MSX / MS2</div>
              <div style={{ fontSize: '14px', color: '#9ca3af' }}>Maç Sonucu</div>
              <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '6px' }}>Ev / Beraberlik / Deplasman</div>
            </div>
            <div style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#60a5fa', marginBottom: '8px' }}>Alt / Üst</div>
              <div style={{ fontSize: '14px', color: '#9ca3af' }}>Toplam Gol Çizgisi</div>
              <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '6px' }}>0.5, 1.5, 2.5, 3.5, 4.5</div>
            </div>
            <div style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#60a5fa', marginBottom: '8px' }}>KG (BTTS)</div>
              <div style={{ fontSize: '14px', color: '#9ca3af' }}>Karşılıklı Gol</div>
              <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '6px' }}>Var / Yok</div>
            </div>
            <div style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#60a5fa', marginBottom: '8px' }}>İY / MS</div>
              <div style={{ fontSize: '14px', color: '#9ca3af' }}>İlk Yarı & Maç Sonucu</div>
              <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '6px' }}>Kombinasyonlar</div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'platform',
      title: '5) Bizim Platformda Ne Yapıyoruz?',
      content: (
        <div style={{ padding: '20px 0', lineHeight: 1.8, color: '#d1d5db' }}>
          <p style={{ marginBottom: '16px', fontSize: '15px' }}>
            Platform, <strong style={{ color: '#60a5fa' }}>geçmiş oranları</strong> ve <strong style={{ color: '#60a5fa' }}>sonuçları</strong> aynı ekranda filtrelemenizi sağlar.
          </p>
          <div style={{ marginBottom: '16px', padding: '20px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.15) 100%)', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <p style={{ marginBottom: '12px', fontSize: '15px', fontWeight: 600, color: '#10b981' }}>
              🎯 Amaç:
            </p>
            <p style={{ fontSize: '15px' }}>
              Benzer oran aralıklarında maçların nasıl sonuçlandığını görüp <strong style={{ color: '#10b981' }}>istatistiksel analiz</strong> yapmaktır.
            </p>
          </div>
          <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', borderLeft: '3px solid #ef4444' }}>
            <p style={{ fontSize: '15px', color: '#fca5a5' }}>
              ⚠️ <strong style={{ color: '#ef4444' }}>Önemli:</strong> Bu bir bahis aracı değildir; tamamen <strong style={{ color: '#ef4444' }}>veri analizi</strong> içindir.
            </p>
          </div>
        </div>
      )
    }
  ]

  return (
    <div className="container">
      <nav className="navbar">
        <div className="navbar-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img
              src="/logo.png"
              alt="İddaamatik logo"
              style={{ 
                height: '40px', 
                width: '40px', 
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3))'
              }}
            />
            <h1>İddaa Analiz Platformu</h1>
          </div>
          <nav>
            <a href="/" className={pathname === '/' ? 'active' : ''}>Ana Sayfa</a>
            <a href="/odds" className={pathname === '/odds' ? 'active' : ''}>Oranlar</a>
            <a href="/analysis-robot" className={pathname === '/analysis-robot' ? 'active' : ''}>Analiz Robotu</a>
          </nav>
        </div>
      </nav>

      <div className="search-section" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <h2 style={{ 
          marginBottom: '24px', 
          fontSize: '2rem', 
          fontWeight: 700,
          background: 'linear-gradient(135deg, #ffffff 0%, #93c5fd 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Oranlar Nasıl Belirlenir?
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {accordionItems.map((item) => {
            const isOpen = openItems.has(item.id)
            return (
              <div
                key={item.id}
                style={{
                  background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.8) 0%, rgba(30, 41, 59, 0.8) 100%)',
                  borderRadius: '12px',
                  border: `1px solid ${isOpen ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isOpen ? '0 8px 24px rgba(59, 130, 246, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.2)'
                }}
              >
                <button
                  onClick={() => toggleItem(item.id)}
                  style={{
                    width: '100%',
                    padding: '20px 24px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    textAlign: 'left',
                    transition: 'all 0.3s',
                    color: isOpen ? '#60a5fa' : '#e5e7eb',
                    fontSize: '18px',
                    fontWeight: 600
                  }}
                  onMouseEnter={(e) => {
                    if (!isOpen) {
                      e.currentTarget.style.color = '#93c5fd'
                      e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isOpen) {
                      e.currentTarget.style.color = '#e5e7eb'
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  <span>{item.title}</span>
                  <span
                    style={{
                      fontSize: '24px',
                      transition: 'transform 0.3s',
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      color: '#60a5fa'
                    }}
                  >
                    ▼
                  </span>
                </button>
                {isOpen && (
                  <div
                    style={{
                      padding: '0 24px 24px',
                      animation: 'fadeIn 0.3s ease-in'
                    }}
                  >
                    {item.content}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
