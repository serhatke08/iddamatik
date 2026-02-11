'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import axios from 'axios'

type PageProps = {
  params: { id: string }
  searchParams?: Record<string, string | string[] | undefined>
}

type Match = {
  match_id: string
  home_team: string
  away_team: string
  league: string
  date: string
  time: string
  score?: string
  odds?: Record<string, number>
  hthg?: number | null
  htag?: number | null
}

type MatchData = {
  match: Match
  stats: Array<{
    label: string
    odd: number
    total: number
    hits: number
    rate: number
  }>
}

const formatOdds = (value: number | undefined | null): string => {
  if (value === undefined || value === null || Number.isNaN(value)) return '-'
  return Number(value).toFixed(2)
}

const parseQueryOdd = (value: string | string[] | undefined): number | null => {
  if (!value) return null
  const raw = Array.isArray(value) ? value[0] : value
  const parsed = Number(raw.replace(',', '.').trim())
  return Number.isNaN(parsed) ? null : Number(parsed.toFixed(2))
}

const getKgOddsDisplay = (match: Match) => {
  const odds = match.odds || {}
  const kgVar = odds.kg_var
  const kgYok = odds.kg_yok

  if ((kgVar === undefined || kgVar === null) && (kgYok === undefined || kgYok === null)) {
    return '-'
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(40px, auto))',
        columnGap: '8px',
        rowGap: '2px',
        whiteSpace: 'nowrap',
        justifyItems: 'center'
      }}
    >
      <span>Var</span>
      <span>{formatOdds(kgVar)}</span>
      <span>Yok</span>
      <span>{formatOdds(kgYok)}</span>
    </div>
  )
}

const getAltUstDisplay = (match: Match, type: 'alt' | 'ust', override?: number | null) => {
  if (override !== undefined && override !== null) return formatOdds(override)
  const key = type === 'alt' ? 'u25' : 'o25'
  return formatOdds(match.odds?.[key])
}

const getIyDisplay = (match: Match) => {
  if (match.hthg !== null && match.htag !== null && match.hthg !== undefined && match.htag !== undefined) {
    return `${match.hthg}-${match.htag}`
  }
  const odds = match.odds || {}
  if (odds.iy1 || odds.iyx || odds.iy2) {
    const iy1 = odds.iy1?.toFixed?.(2) ?? '-'
    const iyx = odds.iyx?.toFixed?.(2) ?? '-'
    const iy2 = odds.iy2?.toFixed?.(2) ?? '-'
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(28px, auto))', columnGap: '10px', whiteSpace: 'nowrap' }}>
        <span>{iy1}</span>
        <span>{iyx}</span>
        <span>{iy2}</span>
      </div>
    )
  }
  return '-'
}

const getTeamInitials = (name: string) => {
  const parts = name.split(' ').filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export default function MatchAnalysisPage({ params, searchParams }: PageProps) {
  const [matchData, setMatchData] = useState<MatchData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const matchResponse = await axios.get(`/api/match/${params.id}`)
        setMatchData(matchResponse.data)
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Veri yüklenemedi')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id])

  if (loading) {
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
        <div className="loading">
          <div className="spinner"></div>
          <p>Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (error || !matchData) {
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
        <div className="no-matches">
          <h3>🔍 {error || 'Maç bulunamadı'}</h3>
          <p>Bu ID ile eşleşen maç yok.</p>
        </div>
      </div>
    )
  }

  const { match, stats } = matchData

  const ms1 = parseQueryOdd(searchParams?.ms1)
  const msx = parseQueryOdd(searchParams?.msx)
  const ms2 = parseQueryOdd(searchParams?.ms2)
  const kg = parseQueryOdd(searchParams?.kg)
  const alt = parseQueryOdd(searchParams?.alt)
  const ust = parseQueryOdd(searchParams?.ust)

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

      {/* Üst tablo */}
      <div className="matches-container" style={{ overflowX: 'auto' }}>
        <table className="matches-table">
          <thead>
            <tr>
              <th>Lig</th>
              <th>Maç</th>
              <th>Skor</th>
              <th>MS1</th>
              <th>MSX</th>
              <th>MS2</th>
              <th>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(40px, auto))', columnGap: '8px', whiteSpace: 'nowrap', justifyItems: 'center', fontSize: '11px' }}>
                  <span>KG Var</span>
                  <span>KG Yok</span>
                </div>
              </th>
              <th>Alt</th>
              <th>Üst</th>
              <th>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(28px, auto))', columnGap: '10px', whiteSpace: 'nowrap', justifyItems: 'start' }}>
                  <span>iy1</span>
                  <span>iyx</span>
                  <span>iy2</span>
                </div>
              </th>
              <th>MS</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{match.league}</td>
              <td>{match.home_team} - {match.away_team}</td>
              <td>{match.score || '-'}</td>
              <td>{formatOdds(ms1 ?? match.odds?.ms1)}</td>
              <td>{formatOdds(msx ?? match.odds?.msx)}</td>
              <td>{formatOdds(ms2 ?? match.odds?.ms2)}</td>
              <td>{getKgOddsDisplay(match)}</td>
              <td>{getAltUstDisplay(match, 'alt', alt ?? null)}</td>
              <td>{getAltUstDisplay(match, 'ust', ust ?? null)}</td>
              <td>{getIyDisplay(match)}</td>
              <td>{match.score || '-'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Takım bilgileri */}
      <div className="matches-container" style={{ marginTop: '24px', padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: '30px', alignItems: 'start' }}>
        {/* Home Team */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '120px', 
              height: '120px', 
              borderRadius: '50%', 
              backgroundColor: '#1f2a37', 
              color: '#fff', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontWeight: 600,
              fontSize: '2rem',
              border: '4px solid #3b82f6'
            }}>
              {getTeamInitials(match.home_team)}
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>MS1</div>
              <div style={{ fontSize: '20px', fontWeight: 700 }}>{match.home_team}</div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ backgroundColor: '#374151', width: '1px' }}></div>

        {/* Away Team */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '120px', 
              height: '120px', 
              borderRadius: '50%', 
              backgroundColor: '#1f2a37', 
              color: '#fff', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontWeight: 600,
              fontSize: '2rem',
              border: '4px solid #3b82f6'
            }}>
              {getTeamInitials(match.away_team)}
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>MS2</div>
              <div style={{ fontSize: '20px', fontWeight: 700 }}>{match.away_team}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Alt istatistikler */}
      <div className="matches-container" style={{ marginTop: '24px' }}>
        <table className="matches-table">
          <thead>
            <tr>
              <th>Oran Türü</th>
              <th>Oran</th>
              <th>Toplam</th>
              <th>Tutan</th>
              <th>Yüzde</th>
            </tr>
          </thead>
          <tbody>
            {stats.length === 0 && (
              <tr>
                <td colSpan={5}>Bu maç için yeterli istatistik yok.</td>
              </tr>
            )}
            {stats.map((stat) => (
              <tr key={stat.label}>
                <td>{stat.label}</td>
                <td>{Number(stat.odd).toFixed(2)}</td>
                <td>{stat.total}</td>
                <td>{stat.hits}</td>
                <td>%{stat.rate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
