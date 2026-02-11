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

interface AnalysisResult {
  betType: string
  betKey: string
  odd: number
  oddRange: string
  superficial: {
    total: number
    hit: number
    rate: number
  }
  deep: {
    odd: string
    total: number
    hit: number
    rate: number
  } | null
  explanation: string
}

interface AnalysisResponse {
  analysis: AnalysisResult[]
  summary: {
    superficialRate: number
    deepRate: number
    totalBets: number
  }
}

export default function AnalysisRobotPage() {
  const [matches, setMatches] = useState<UpcomingMatch[]>([])
  const [loading, setLoading] = useState(false)
  const [analyzingMatch, setAnalyzingMatch] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null)
  const [hoveredBet, setHoveredBet] = useState<string | null>(null)

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
      const response = await axios.get('/api/upcoming-odds')
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
        'Eredivisie': 8,
        'Liga Portugal': 9,
        'Scottish Premiership': 10,
        'MLS': 11,
        'A-League': 12,
        'Brazil Serie A': 13,
        'Russia Premier League': 14
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
      
      if (response.data && response.data.analysis) {
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
      <nav className="navbar">
        <div className="navbar-content">
          <h1>⚽ İddaa Analiz Platformu</h1>
          <nav>
            <Link href="/">Ana Sayfa</Link>
            <Link href="/odds">Oranlar</Link>
            <Link href="/analysis-robot">Analiz Robotu</Link>
          </nav>
        </div>
      </nav>

      <div className="search-section">
        <h2 style={{ marginBottom: '16px' }}>🤖 Analiz Robotu</h2>
        <p style={{ marginBottom: '16px', color: '#9ca3af', fontSize: '14px' }}>
          Gelecek maçların oranlarını analiz edin ve tahmin yüzdelerini görün
        </p>

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
      </div>

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
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match) => (
                <tr key={match.match_id}>
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
                      {analyzingMatch === match.match_id ? 'Analiz Ediliyor...' : 'Analiz Et'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {analysisResult && (
        <div id="analysis-results" style={{ marginTop: '32px', padding: '24px', backgroundColor: '#111827', borderRadius: '8px', border: '1px solid #374151' }}>
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📊 Analiz Sonuçları
            <span
              style={{
                cursor: 'help',
                fontSize: '18px',
                color: '#3b82f6'
              }}
              title="Bu analiz, geçmiş verilere dayalı istatistiksel tahminlerdir. Her bahis türü için yüzeysel (gruplanmış) ve derinlemesine (detaylı) tahmin yüzdeleri gösterilir. Gerçek sonuçlar farklı olabilir."
            >
              ?
            </span>
          </h3>

          {analysisResult.analysis && analysisResult.analysis.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #374151' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Bahis Türü</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>Oran</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ color: '#60a5fa' }}>Yüzeysel Tahmin</span>
                        <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 400 }}>(Gruplanmış)</span>
                      </div>
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ color: '#34d399' }}>Derinlemesine Tahmin</span>
                        <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 400 }}>(Detaylı)</span>
                      </div>
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Açıklama</th>
                  </tr>
                </thead>
                <tbody>
                  {analysisResult.analysis.map((item, idx) => (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: '1px solid #374151',
                        backgroundColor: hoveredBet === item.betKey ? '#1f2937' : 'transparent',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={() => setHoveredBet(item.betKey)}
                      onMouseLeave={() => setHoveredBet(null)}
                    >
                      <td style={{ padding: '12px', fontWeight: 600, fontSize: '14px' }}>{item.betType}</td>
                      <td style={{ padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '14px' }}>{item.odd.toFixed(2)}</td>
                      <td style={{ padding: '12px', textAlign: 'center', backgroundColor: hoveredBet === item.betKey ? '#1a2332' : 'transparent' }}>
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '6px' }}>
                          {item.superficial.total} maç ({item.oddRange})
                        </div>
                        <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#60a5fa', marginBottom: '4px' }}>
                          {item.superficial.rate.toFixed(2)}%
                        </div>
                        <div style={{ fontSize: '10px', color: '#6b7280' }}>
                          Tutmuş: <span style={{ color: '#22c55e', fontWeight: 600 }}>{item.superficial.hit}</span> | 
                          Yatmış: <span style={{ color: '#ef4444', fontWeight: 600 }}>{item.superficial.total - item.superficial.hit}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', backgroundColor: hoveredBet === item.betKey ? '#1a2332' : 'transparent' }}>
                        {item.deep ? (
                          <>
                            <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '6px' }}>
                              {item.deep.total} maç ({item.deep.odd})
                            </div>
                            <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#34d399', marginBottom: '4px' }}>
                              {item.deep.rate.toFixed(2)}%
                            </div>
                            <div style={{ fontSize: '10px', color: '#6b7280' }}>
                              Tutmuş: <span style={{ color: '#22c55e', fontWeight: 600 }}>{item.deep.hit}</span> | 
                              Yatmış: <span style={{ color: '#ef4444', fontWeight: 600 }}>{item.deep.total - item.deep.hit}</span>
                            </div>
                          </>
                        ) : (
                          <div style={{ color: '#6b7280', fontSize: '12px' }}>Veri yok</div>
                        )}
                      </td>
                    <td style={{ padding: '12px', fontSize: '12px', color: '#9ca3af' }}>
                      {hoveredBet === item.betKey ? (
                        <div style={{ maxWidth: '500px', whiteSpace: 'pre-line', lineHeight: '1.6' }}>
                          <strong style={{ color: '#e5e7eb', marginBottom: '8px', display: 'block' }}>Detaylı Analiz:</strong>
                          <div style={{ 
                            padding: '12px', 
                            backgroundColor: '#1f2937', 
                            borderRadius: '6px',
                            fontFamily: 'monospace',
                            fontSize: '11px'
                          }}>
                            {item.explanation.split('\n').map((line: string, idx: number) => (
                              <div key={idx} style={{ marginBottom: line.trim() ? '4px' : '8px' }}>
                                {line}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <span style={{ cursor: 'help' }} title="Detaylı analiz için üzerine gelin">
                          {item.explanation.split('\n')[0] || 'Analiz için üzerine gelin'}...
                        </span>
                      )}
                    </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af' }}>
              <p>Bu maç için analiz verisi bulunamadı.</p>
              <p style={{ fontSize: '12px', marginTop: '8px' }}>Lütfen başka bir maç deneyin veya daha sonra tekrar kontrol edin.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
