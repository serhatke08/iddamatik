'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import Link from 'next/link'

interface UpcomingMatch {
  match_id: string
  home_team: string
  away_team: string
  league: string
  country: string
  date: string
  time: string
  status: string
  odds: Record<string, number>
  fixture_id: number
}

interface GeneralAnalysisItem {
  range: string
    total: number
    hit: number
    rate: number
  kgVar: number
  kgYok: number
  iyKgVar: number
  iyKgYok: number
}

interface GeneralAnalysis {
  ms1: GeneralAnalysisItem
  msx: GeneralAnalysisItem
  ms2: GeneralAnalysisItem
  pool: {
    total: number
    ms1Rate: number
    msxRate: number
    ms2Rate: number
    kgVar: number
    kgYok: number
    iyKgVar: number
    iyKgYok: number
  }
}

interface DeepAnalysis {
  total: number
  ms1Rate: number
  msxRate: number
  ms2Rate: number
  kgVar: number
  kgYok: number
  iyKgVar: number
  iyKgYok: number
}

interface AnalysisResponse {
  generalAnalysis: GeneralAnalysis
  deepAnalysis: DeepAnalysis
  comment: {
    dominantResult: string
    dominantRate: number
    isKgRisky: boolean
    isFavored: boolean
    recommendation: string
  }
  odds: {
    ms1: number
    msx: number
    ms2: number
  }
}

interface CouponPrediction {
  match: UpcomingMatch
  betType: string
  betLabel: string
  rate: number
  recommendation: string
}

export default function AnalysisRobotPage() {
  const [matches, setMatches] = useState<UpcomingMatch[]>([])
  const [loading, setLoading] = useState(false)
  const [analyzingMatch, setAnalyzingMatch] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null)
  const [hoveredBet, setHoveredBet] = useState<string | null>(null)
  const [couponPredictions, setCouponPredictions] = useState<CouponPrediction[]>([])
  const [analyzingCoupon, setAnalyzingCoupon] = useState(false)

  useEffect(() => {
    fetchMatches()
  }, [])

  const parseTime = (timeStr: string): number => {
    if (!timeStr) return 9999 // Saat yoksa en sona
    const parts = timeStr.split(':')
    if (parts.length >= 2) {
      const hours = parseInt(parts[0]) || 0
      const minutes = parseInt(parts[1]) || 0
      return hours * 60 + minutes // Dakika cinsinden
    }
    return 9999
  }

  const fetchMatches = async () => {
    setLoading(true)
    try {
      // Yeni API endpoint'i kullan
      const response = await axios.get('/api/upcoming-matches?days=14')
      const allMatches = response.data.matches || []
      
      // Lig önceliği
      const leaguePriority: Record<string, number> = {
        'Super Lig': 1,
        'Süper Lig': 1,
        'Premier League': 2,
        'LaLiga': 3,
        'Serie A': 4,
        'Bundesliga': 5,
        'Ligue 1': 6,
        'Champions League': 7,
        'Europa League': 8,
        'Eredivisie': 9,
        'Liga Portugal': 10,
        'Scottish Premiership': 11,
        'MLS': 12,
        'A-League': 13,
        'Brazil Serie A': 14,
        'Russia Premier League': 15
      }
      
      // Önce saate göre, sonra lig önceliğine göre sırala
      const sortedMatches = allMatches.sort((a: UpcomingMatch, b: UpcomingMatch) => {
        const aTime = parseTime(a.time || '')
        const bTime = parseTime(b.time || '')
        
        // Önce saate göre sırala
        if (aTime !== bTime) {
          return aTime - bTime
        }
        
        // Aynı saatteyse lig önceliğine göre
        const aPriority = leaguePriority[a.league] || 999
        const bPriority = leaguePriority[b.league] || 999
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority
        }
        
        // Aynı lig ve saatteyse lig ismine göre
        return a.league.localeCompare(b.league)
      })
      
      setMatches(sortedMatches)
    } catch (error) {
      console.error('Error fetching matches:', error)
    } finally {
      setLoading(false)
    }
  }

  const analyzeCoupon = async () => {
    if (matches.length === 0) {
      alert('Analiz edilecek maç bulunamadı. Önce maçları yükleyin.')
      return
    }
    
    setAnalyzingCoupon(true)
    setCouponPredictions([])
    
    const predictions: CouponPrediction[] = []
    let analyzedCount = 0
    let errorCount = 0
    let cancelled = false
    
    // Genel timeout - 5 dakika sonra iptal et
    const globalTimeout = setTimeout(() => {
      console.warn('[analyzeCoupon] Global timeout reached, cancelling...')
      cancelled = true
      setAnalyzingCoupon(false)
      alert('Analiz çok uzun sürdü. Lütfen daha az maç ile tekrar deneyin.')
    }, 300000) // 5 dakika
    
    try {
      console.log(`Starting coupon analysis for ${matches.length} matches...`)
      
      // Tüm maçları sırayla analiz et
      for (let i = 0; i < matches.length; i++) {
        // İptal kontrolü
        if (cancelled) {
          console.log('[analyzeCoupon] Cancelled, breaking loop')
          break
        }
        
        const match = matches[i]
        
        try {
          // Odds'u temizle
          const cleanOdds: Record<string, number> = {}
          Object.entries(match.odds || {}).forEach(([key, value]) => {
            if (value !== null && value !== undefined && !isNaN(Number(value))) {
              cleanOdds[key] = Number(value)
            }
          })
          
          if (Object.keys(cleanOdds).length === 0) {
            console.log(`Skipping match ${match.match_id}: No valid odds`)
            continue
          }
          
          // MS1, MSX, MS2 kontrolü
          if (!cleanOdds.H || !cleanOdds.D || !cleanOdds.A) {
            console.log(`Skipping match ${match.match_id}: Missing MS1/MSX/MS2 odds`)
            continue
          }
          
          // Analiz yap
          const response = await axios.post('/api/analyze-odds', {
            odds: cleanOdds
          })
          
          if (response.data && response.data.generalAnalysis && response.data.generalAnalysis.pool) {
            const pool = response.data.generalAnalysis.pool
            
            // En yüksek tutma oranını bul
            const rates = [
              { type: 'MS1', label: 'MS1', rate: pool.ms1Rate || 0 },
              { type: 'MSX', label: 'MSX', rate: pool.msxRate || 0 },
              { type: 'MS2', label: 'MS2', rate: pool.ms2Rate || 0 },
              { type: 'KG_VAR', label: 'KG VAR', rate: pool.kgVar || 0 },
              { type: 'KG_YOK', label: 'KG YOK', rate: pool.kgYok || 0 }
            ]
            
            // Oranları sırala
            rates.sort((a, b) => b.rate - a.rate)
            const bestBet = rates[0]
            
            // %70 ve üstü tutma oranına sahip maçları ekle
            if (bestBet.rate >= 70) {
              let recommendation = ''
              if (bestBet.rate >= 80) {
                recommendation = '🔥 Çok güçlü tahmin!'
              } else if (bestBet.rate >= 75) {
                recommendation = '✅ Güçlü tahmin'
              } else {
                recommendation = '👍 İyi tahmin'
              }
              
              predictions.push({
                match,
                betType: bestBet.type,
                betLabel: bestBet.label,
                rate: bestBet.rate,
                recommendation
              })
            }
            
            analyzedCount++
          } else {
            console.error(`Invalid response for match ${match.match_id}:`, response.data)
            errorCount++
          }
        } catch (error: any) {
          console.error(`Error analyzing match ${match.match_id}:`, error)
          errorCount++
          // Hata olsa bile devam et
          // Timeout veya network hatası olabilir, devam et
          if (error.message === 'Timeout') {
            console.warn(`Match ${match.match_id} timed out, skipping`)
          }
        }
        
        // Her 10 maçta bir progress göster
        if ((i + 1) % 10 === 0) {
          console.log(`Progress: ${i + 1}/${matches.length} matches analyzed`)
        }
      }
      
      // Oranları yüksekten düşüğe sırala
      predictions.sort((a, b) => b.rate - a.rate)
      
      console.log(`Coupon analysis complete: ${analyzedCount} analyzed, ${errorCount} errors, ${predictions.length} predictions found`)
      
      if (predictions.length === 0) {
        alert(`Analiz tamamlandı. ${analyzedCount} maç analiz edildi ancak %70+ tutma oranına sahip maç bulunamadı.`)
      } else {
        setCouponPredictions(predictions)
        // Sonuçlara scroll et
        setTimeout(() => {
          const element = document.querySelector('[data-coupon-predictions]')
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }, 100)
      }
    } catch (error: any) {
      console.error('Error analyzing coupon:', error)
      alert(`Kupon analizi sırasında bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`)
    } finally {
      // Timeout'u temizle
      clearTimeout(globalTimeout)
      // Her durumda loading'i kapat
      setAnalyzingCoupon(false)
      console.log('[analyzeCoupon] Finished, loading set to false')
    }
  }

  const analyzeMatch = async (match: UpcomingMatch) => {
    setAnalyzingMatch(match.match_id)
    setAnalysisResult(null)
    
    try {
      console.log('Analyzing match odds:', match.odds)
      
      // Odds'u temizle ve sadece sayısal değerleri al
      const cleanOdds: Record<string, number> = {}
      Object.entries(match.odds || {}).forEach(([key, value]) => {
        if (value !== null && value !== undefined && !isNaN(Number(value))) {
          cleanOdds[key] = Number(value)
        }
      })
      
      console.log('Clean odds:', cleanOdds)
      
      if (Object.keys(cleanOdds).length === 0) {
        alert('Bu maç için oran bulunamadı.')
        return
      }
      
      const response = await axios.post('/api/analyze-odds', {
        odds: cleanOdds
      })
      
      console.log('Analysis response:', response.data)
      
      if (response.data && (response.data.generalAnalysis || response.data.deepAnalysis)) {
        setAnalysisResult(response.data)
        // Sayfayı analiz sonuçlarına scroll et
        setTimeout(() => {
          const element = document.getElementById('analysis-results')
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }, 100)
      } else {
        console.error('Invalid response format:', response.data)
        alert('Analiz yapılamadı. Lütfen tekrar deneyin.')
      }
    } catch (error: any) {
      console.error('Error analyzing match:', error)
      const errorMsg = error.response?.data?.error || error.message || 'Bilinmeyen hata'
      console.error('Full error:', error)
      alert(`Analiz hatası: ${errorMsg}`)
    } finally {
      setAnalyzingMatch(null)
    }
  }

  const formatOdd = (value: number | undefined | null): string => {
    if (value === undefined || value === null || Number.isNaN(value)) return '-'
    return Number(value).toFixed(2)
  }

  const getBetTypeLabel = (betKey: string): string => {
    const labels: Record<string, string> = {
      'H': 'MS1',
      'D': 'MSX',
      'A': 'MS2',
      'BTTSY': 'KG VAR',
      'BTTSN': 'KG YOK',
      'O05': 'ÜST 0.5',
      'U05': 'ALT 0.5',
      'O15': 'ÜST 1.5',
      'U15': 'ALT 1.5',
      'O25': 'ÜST 2.5',
      'U25': 'ALT 2.5',
      'O35': 'ÜST 3.5',
      'U35': 'ALT 3.5',
      'O45': 'ÜST 4.5',
      'U45': 'ALT 4.5'
    }
    return labels[betKey] || betKey
  }

  return (
    <div className="container">
      {/* Loading Overlay - Analiz ve Kupon Tahmini için */}
      {(analyzingMatch || analyzingCoupon) && (
        <div className="loading-overlay">
          <div className="loading-overlay-content">
            <div className="loading-overlay-spinner"></div>
            <div className="loading-overlay-text">
              {analyzingCoupon ? 'Kupon analizi yapılıyor...' : 'Sonuçlar getiriliyor...'}
            </div>
          </div>
        </div>
      )}
      
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
            <Link href="/">Ana Sayfa</Link>
            <Link href="/odds">Oranlar</Link>
            <Link href="/analysis-robot">Analiz Robotu</Link>
            <Link href="/stats">İstatistik</Link>
          </nav>
        </div>
      </nav>

      <div className="search-section">
        <h2 style={{ marginBottom: '16px' }}>🤖 Analiz Robotu</h2>
        <p style={{ marginBottom: '16px', color: '#9ca3af', fontSize: '14px' }}>
          Gelecek maçların oranlarını analiz edin ve tahmin yüzdelerini görün
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={fetchMatches}
          disabled={loading}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Yükleniyor...' : 'Maçları Yenile'}
        </button>
          
          <button
            onClick={analyzeCoupon}
            disabled={analyzingCoupon || matches.length === 0}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              cursor: (analyzingCoupon || matches.length === 0) ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              opacity: (analyzingCoupon || matches.length === 0) ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {analyzingCoupon ? (
              <>
                <span className="spinner" style={{
                  width: '14px',
                  height: '14px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTop: '2px solid #ffffff',
                  borderRadius: '50%',
                  display: 'inline-block'
                }}></span>
                Analiz ediliyor...
              </>
            ) : (
              '🎯 Kupon Tahmini Yap'
            )}
          </button>
        </div>
      </div>

      {/* Kupon Tahminleri */}
      {couponPredictions.length > 0 && (
        <div data-coupon-predictions style={{ marginTop: '24px', padding: '20px', backgroundColor: '#111827', borderRadius: '8px', border: '2px solid #10b981' }}>
          <h3 style={{ marginBottom: '16px', color: '#10b981', fontSize: '20px', fontWeight: 600 }}>
            🎯 Kupon Tahminleri (%70+ Tutma Oranı)
          </h3>
          <p style={{ marginBottom: '16px', color: '#9ca3af', fontSize: '14px' }}>
            {couponPredictions.length} maç bulundu. Aşağıdaki bahisleri oynayabilirsiniz:
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #374151', backgroundColor: '#1f2937' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Lig</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Maç</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>Tarih</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>Saat</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>Oynanacak</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>Tutma Oranı</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>Öneri</th>
                </tr>
              </thead>
              <tbody>
                {couponPredictions.map((pred, idx) => (
                  <tr key={pred.match.match_id} style={{ borderBottom: '1px solid #374151' }}>
                    <td style={{ padding: '12px' }}>{pred.match.league}</td>
                    <td style={{ padding: '12px' }}>
                      <strong>{pred.match.home_team}</strong> vs <strong>{pred.match.away_team}</strong>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{pred.match.date}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{pred.match.time}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: pred.betType === 'MS1' ? '#10b981' : pred.betType === 'MSX' ? '#3b82f6' : pred.betType === 'MS2' ? '#ef4444' : '#f59e0b',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '12px'
                      }}>
                        {pred.betLabel}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px', color: '#10b981' }}>
                      {pred.rate.toFixed(2)}%
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#9ca3af' }}>
                      {pred.recommendation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {matches.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
          <p>Henüz maç bulunamadı. Lütfen daha sonra tekrar deneyin.</p>
        </div>
      )}

      {matches.length > 0 && (
        <div className="matches-container" style={{ overflowX: 'auto' }}>
          <table className="matches-table">
            <thead>
              <tr>
                <th>İşlem</th>
                <th>Lig</th>
                <th>Maç</th>
                <th>Tarih</th>
                <th>Saat</th>
                <th>MS1</th>
                <th>MSX</th>
                <th>MS2</th>
                <th>KG Var</th>
                <th>KG Yok</th>
                <th>2.5 ÜST</th>
                <th>2.5 ALT</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match) => (
                <tr key={match.match_id}>
                  <td>
                    <button
                      onClick={() => analyzeMatch(match)}
                      disabled={analyzingMatch === match.match_id}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '4px',
                        backgroundColor: analyzingMatch === match.match_id ? '#6b7280' : '#10b981',
                        color: 'white',
                        border: 'none',
                        cursor: analyzingMatch === match.match_id ? 'not-allowed' : 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      {analyzingMatch === match.match_id ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                          <span className="spinner" style={{
                            width: '14px',
                            height: '14px',
                            border: '2px solid rgba(255, 255, 255, 0.3)',
                            borderTop: '2px solid #ffffff',
                            borderRadius: '50%',
                            display: 'inline-block'
                          }}></span>
                          Analiz yapılıyor...
                        </span>
                      ) : 'Analiz Et'}
                    </button>
                  </td>
                  <td>{match.league}</td>
                  <td>
                    <strong>{match.home_team}</strong> vs <strong>{match.away_team}</strong>
                  </td>
                  <td>{match.date}</td>
                  <td>{match.time}</td>
                  <td>{formatOdd(match.odds.H)}</td>
                  <td>{formatOdd(match.odds.D)}</td>
                  <td>{formatOdd(match.odds.A)}</td>
                  <td>{formatOdd(match.odds.BTTSY)}</td>
                  <td>{formatOdd(match.odds.BTTSN)}</td>
                  <td>{formatOdd(match.odds.O25)}</td>
                  <td>{formatOdd(match.odds.U25)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {analysisResult && analysisResult.generalAnalysis && (
        <div id="analysis-results" style={{ marginTop: '32px', padding: '24px', backgroundColor: '#111827', borderRadius: '8px', border: '1px solid #374151' }}>
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📊 Profesyonel Maç Analizi
            <span
              style={{
                cursor: 'help',
                fontSize: '18px',
                color: '#3b82f6'
              }}
              title="Bu analiz, geçmiş verilere dayalı istatistiksel analizdir. ±0.05 toleransla oran aralığı bazlı ve net oran bazlı iki farklı analiz yapılmaktadır."
            >
              ?
            </span>
          </h3>

          {/* Genel İstatistiksel Analiz Tablosu */}
          <div style={{ marginBottom: '32px' }}>
            <h4 style={{ marginBottom: '16px', color: '#60a5fa', fontSize: '18px', fontWeight: 600 }}>
              1️⃣ Genel İstatistiksel Analiz (Oran Aralığı Bazlı - ±0.05 Tolerans)
            </h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', backgroundColor: '#1f2937', borderRadius: '8px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #374151', backgroundColor: '#111827' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Oran Aralığı</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>Toplam Maç</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>Tutan Maç</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>Yüzde</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>KG VAR</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>KG YOK</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>İY KG VAR</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>İY KG YOK</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // En yüksek yüzdeyi bul
                    const rates = {
                      ms1: analysisResult.generalAnalysis.ms1.rate,
                      msx: analysisResult.generalAnalysis.msx.rate,
                      ms2: analysisResult.generalAnalysis.ms2.rate
                    }
                    const maxRate = Math.max(rates.ms1, rates.msx, rates.ms2)
                    
                    // Renkleri belirle: En yüksek yeşil, diğerleri mavi/kırmızı
                    const getColor = (rate: number, type: 'ms1' | 'msx' | 'ms2') => {
                      if (rate === maxRate) return '#10b981' // Yeşil - en yüksek
                      if (type === 'ms1') return '#10b981'
                      if (type === 'msx') return '#3b82f6'
                      return '#ef4444'
                    }
                    
                    return (
                      <>
                        <tr style={{ borderBottom: '1px solid #374151' }}>
                          <td style={{ padding: '12px', fontWeight: 600, color: getColor(rates.ms1, 'ms1') }}>MS1 ({analysisResult.generalAnalysis.ms1.range})</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>{analysisResult.generalAnalysis.ms1.total.toLocaleString()}</td>
                          <td style={{ padding: '12px', textAlign: 'center', color: getColor(rates.ms1, 'ms1') }}>{analysisResult.generalAnalysis.ms1.hit.toLocaleString()}</td>
                          <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px', color: getColor(rates.ms1, 'ms1') }}>{analysisResult.generalAnalysis.ms1.rate.toFixed(2)}%</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>{analysisResult.generalAnalysis.ms1.kgVar.toFixed(2)}%</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>{analysisResult.generalAnalysis.ms1.kgYok.toFixed(2)}%</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>{analysisResult.generalAnalysis.ms1.iyKgVar.toFixed(2)}%</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>{analysisResult.generalAnalysis.ms1.iyKgYok.toFixed(2)}%</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #374151' }}>
                          <td style={{ padding: '12px', fontWeight: 600, color: getColor(rates.msx, 'msx') }}>MSX ({analysisResult.generalAnalysis.msx.range})</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>{analysisResult.generalAnalysis.msx.total.toLocaleString()}</td>
                          <td style={{ padding: '12px', textAlign: 'center', color: getColor(rates.msx, 'msx') }}>{analysisResult.generalAnalysis.msx.hit.toLocaleString()}</td>
                          <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px', color: getColor(rates.msx, 'msx') }}>{analysisResult.generalAnalysis.msx.rate.toFixed(2)}%</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>{analysisResult.generalAnalysis.msx.kgVar.toFixed(2)}%</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>{analysisResult.generalAnalysis.msx.kgYok.toFixed(2)}%</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>{analysisResult.generalAnalysis.msx.iyKgVar.toFixed(2)}%</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>{analysisResult.generalAnalysis.msx.iyKgYok.toFixed(2)}%</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #374151' }}>
                          <td style={{ padding: '12px', fontWeight: 600, color: getColor(rates.ms2, 'ms2') }}>MS2 ({analysisResult.generalAnalysis.ms2.range})</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>{analysisResult.generalAnalysis.ms2.total.toLocaleString()}</td>
                          <td style={{ padding: '12px', textAlign: 'center', color: getColor(rates.ms2, 'ms2') }}>{analysisResult.generalAnalysis.ms2.hit.toLocaleString()}</td>
                          <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px', color: getColor(rates.ms2, 'ms2') }}>{analysisResult.generalAnalysis.ms2.rate.toFixed(2)}%</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>{analysisResult.generalAnalysis.ms2.kgVar.toFixed(2)}%</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>{analysisResult.generalAnalysis.ms2.kgYok.toFixed(2)}%</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>{analysisResult.generalAnalysis.ms2.iyKgVar.toFixed(2)}%</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>{analysisResult.generalAnalysis.ms2.iyKgYok.toFixed(2)}%</td>
                        </tr>
                      </>
                    )
                  })()}
                </tbody>
              </table>
            </div>

            {/* Toplam Havuz Analizi */}
            <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#1f2937', borderRadius: '8px', border: '1px solid #3b82f6' }}>
              <h5 style={{ marginBottom: '12px', color: '#60a5fa', fontSize: '16px', fontWeight: 600 }}>
                📊 Toplam Havuz Analizi (Tüm Oran Grupları Birleşik)
              </h5>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Toplam Maç</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#e5e7eb' }}>{analysisResult.generalAnalysis.pool.total.toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>MS1 Yüzdesi</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>{analysisResult.generalAnalysis.pool.ms1Rate.toFixed(2)}%</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>MSX Yüzdesi</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#3b82f6' }}>{analysisResult.generalAnalysis.pool.msxRate.toFixed(2)}%</div>
                        </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>MS2 Yüzdesi</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ef4444' }}>{analysisResult.generalAnalysis.pool.ms2Rate.toFixed(2)}%</div>
                        </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>KG VAR</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#e5e7eb' }}>{analysisResult.generalAnalysis.pool.kgVar.toFixed(2)}%</div>
                        </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>KG YOK</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#e5e7eb' }}>{analysisResult.generalAnalysis.pool.kgYok.toFixed(2)}%</div>
                            </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>İY KG VAR</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#e5e7eb' }}>{analysisResult.generalAnalysis.pool.iyKgVar.toFixed(2)}%</div>
                            </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>İY KG YOK</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#e5e7eb' }}>{analysisResult.generalAnalysis.pool.iyKgYok.toFixed(2)}%</div>
                            </div>
                              </div>
                          </div>
                        </div>

          {/* Derinlemesine Analiz Tablosu */}
          <div style={{ marginBottom: '32px' }}>
            <h4 style={{ marginBottom: '16px', color: '#34d399', fontSize: '18px', fontWeight: 600 }}>
              2️⃣ Derinlemesine Analiz (Net Oranlar - ±0.01 Tolerans)
            </h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', backgroundColor: '#1f2937', borderRadius: '8px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #374151', backgroundColor: '#111827' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Net Oran</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>Toplam Maç</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>MS1 Başarı %</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>MSX Başarı %</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>MS2 Başarı %</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>KG VAR</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>KG YOK</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>İY KG VAR</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>İY KG YOK</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '12px', fontWeight: 600 }}>
                      MS1: {analysisResult.odds.ms1.toFixed(2)} ({analysisResult.deepAnalysis.ms1Count || 0} maç)<br/>
                      MSX: {analysisResult.odds.msx.toFixed(2)} ({analysisResult.deepAnalysis.msxCount || 0} maç)<br/>
                      MS2: {analysisResult.odds.ms2.toFixed(2)} ({analysisResult.deepAnalysis.ms2Count || 0} maç)<br/>
                      <span style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px', display: 'block' }}>
                        Havuz Toplam: {analysisResult.deepAnalysis.total.toLocaleString()} maç
                        </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>{analysisResult.deepAnalysis.total.toLocaleString()}</td>
                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px', color: '#10b981' }}>{analysisResult.deepAnalysis.ms1Rate.toFixed(2)}%</td>
                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px', color: '#3b82f6' }}>{analysisResult.deepAnalysis.msxRate.toFixed(2)}%</td>
                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px', color: '#ef4444' }}>{analysisResult.deepAnalysis.ms2Rate.toFixed(2)}%</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{analysisResult.deepAnalysis.kgVar.toFixed(2)}%</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{analysisResult.deepAnalysis.kgYok.toFixed(2)}%</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{analysisResult.deepAnalysis.iyKgVar.toFixed(2)}%</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{analysisResult.deepAnalysis.iyKgYok.toFixed(2)}%</td>
                    </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Yorum & Sonuç */}
          <div style={{ padding: '20px', backgroundColor: '#1f2937', borderRadius: '8px', border: '1px solid #fbbf24' }}>
            <h4 style={{ marginBottom: '16px', color: '#fbbf24', fontSize: '18px', fontWeight: 600 }}>
              4️⃣ Yorum & Sonuç
            </h4>
            <div style={{ lineHeight: '1.8', color: '#e5e7eb' }}>
              <p style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#fbbf24' }}>İstatistiksel Öne Çıkan Sonuç:</strong> {analysisResult.comment.dominantResult} (%{analysisResult.comment.dominantRate.toFixed(2)})
              </p>
              <p style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#fbbf24' }}>KG Açısından:</strong> {analysisResult.comment.isKgRisky ? '⚠️ Riskli (KG VAR oranı düşük)' : '✅ Güvenli (KG VAR oranı yüksek)'}
              </p>
              <p style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#fbbf24' }}>Maç Karakteri:</strong> {analysisResult.comment.isFavored ? '⭐ Favori maç' : '⚖️ Dengeli maç'}
              </p>
              
              {/* Detaylı Yorumlar */}
              {analysisResult.comment.detailedComments && analysisResult.comment.detailedComments.length > 0 && (
                <div style={{ marginTop: '16px', marginBottom: '16px', padding: '12px', backgroundColor: '#111827', borderRadius: '6px', borderLeft: '4px solid #10b981' }}>
                  <strong style={{ color: '#10b981', display: 'block', marginBottom: '8px' }}>📈 Detaylı İstatistiksel Yorumlar:</strong>
                  {analysisResult.comment.detailedComments.map((comment, idx) => (
                    <p key={idx} style={{ marginBottom: '8px', fontSize: '13px', color: '#cbd5e1' }}>
                      {comment}
                    </p>
                  ))}
                </div>
              )}
              
              <p style={{ marginBottom: '0', padding: '12px', backgroundColor: '#111827', borderRadius: '6px', borderLeft: '4px solid #3b82f6' }}>
                <strong style={{ color: '#3b82f6' }}>💡 Öneri:</strong> {analysisResult.comment.recommendation}
              </p>
            </div>
          </div>
        </div>
      )}

      {analysisResult && !analysisResult.generalAnalysis && (
        <div id="analysis-results" style={{ marginTop: '32px', padding: '24px', backgroundColor: '#111827', borderRadius: '8px', border: '1px solid #374151' }}>
            <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af' }}>
              <p>Bu maç için analiz verisi bulunamadı.</p>
              <p style={{ fontSize: '12px', marginTop: '8px' }}>Lütfen başka bir maç deneyin veya daha sonra tekrar kontrol edin.</p>
            </div>
        </div>
      )}
    </div>
  )
}
