'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import axios from 'axios'
import Link from 'next/link'

interface Match {
  match_id: string
  home_team: string
  away_team: string
  league: string
  date: string
  time: string
  status: string
  odds: Record<string, number>
  source: string
  country?: string
  season?: string
  score?: string
  fthg?: number | null
  ftag?: number | null
  hthg?: number | null
  htag?: number | null
}

type OddsFilters = {
  ms1?: string
  msx?: string
  ms2?: string
  o05?: string
  u05?: string
  o15?: string
  u15?: string
  o25?: string
  u25?: string
  o35?: string
  u35?: string
  o45?: string
  u45?: string
  kg_var?: string
  kg_yok?: string
}

const formatOdd = (value: number | undefined | null): string => {
  if (value === undefined || value === null || Number.isNaN(value)) return '-'
  return Number(value).toFixed(2)
}

const formatOddFlexible = (value: number | string | undefined | null): string => {
  if (value === undefined || value === null) return '-'
  const num = typeof value === 'number' ? value : Number(String(value).replace(',', '.'))
  if (Number.isNaN(num)) return String(value)
  return Number(num).toFixed(2)
}

const formatInt = (value: number | null | undefined): string => {
  if (value === undefined || value === null || Number.isNaN(value)) return '0'
  try {
    return Number(value).toLocaleString('tr-TR')
  } catch {
    return String(value)
  }
}

// Lig isimlerini formatla (gösterim için)
const formatLeagueName = (leagueName: string): string => {
  if (leagueName === 'Premiership') {
    return 'Scottish Premiership'
  }
  if (leagueName === 'Serie A Betano') {
    return 'Serie A'
  }
  if (leagueName === 'Russia Premier League') {
    return 'Russia Premier League'
  }
  if (leagueName === 'Brazil Serie A') {
    return 'Brazil Serie A'
  }
  return leagueName
}

// Lig isimlerini logolarla eşleştir
  const getLeagueLogo = (leagueName: string): string | null => {
  const leagueLogoMap: Record<string, string> = {
    'Premier League': '/images/leagues/premier-league-1.svg',
    'Ligue 1': '/images/leagues/Ligue1_logo.png',
    'Serie A': '/images/leagues/serie-a.jpeg',
    'LaLiga': '/images/leagues/laliga.webp',
    'Super Lig': '/images/leagues/super-lig-logo-white-bg.svg',
    'Süper Lig': '/images/leagues/super-lig-logo-white-bg.svg',
    'Serie A Betano': '/images/leagues/serie-a.jpeg',
    'Bundesliga': '/images/leagues/bundesliga-2-white-bg.svg',
    'Eredivisie': '/images/leagues/eredivisie-nieuw-logo-2017-white-bg.svg',
    'Liga Portugal': '/images/leagues/liga-portugal-logo-png.png',
    'Champions League': '/images/leagues/uefa-champions-league-1.svg',
    'UEFA Champions League': '/images/leagues/uefa-champions-league-1.svg',
    'Europa League': '/images/leagues/avrupaligi.png',
    'Premiership': '/images/leagues/scottish-premiership.png',
    'Scottish Premiership': '/images/leagues/scottish-premiership.png',
    'MLS': '/images/leagues/major-league-soccer-symbol.png',
    'A-League': '/images/leagues/a-league-men-logo-white-bg.png',
    'Russia Premier League': '/images/leagues/russia-premier-league-white-bg.png',
    'Brazil Serie A': '/images/leagues/brasil-serie-a.png'
  }
  return leagueLogoMap[leagueName] || null
}

export default function Home() {
  const [leagueFilter, setLeagueFilter] = useState('')
  const [matchFilter, setMatchFilter] = useState('')
  const [scoreFilter, setScoreFilter] = useState('')
  const [kgFilter, setKgFilter] = useState('')
  const [altFilter, setAltFilter] = useState('')
  const [ustFilter, setUstFilter] = useState('')
  const [iyFilter, setIyFilter] = useState('')
  const [iy1Filter, setIy1Filter] = useState('')
  const [iyxFilter, setIyxFilter] = useState('')
  const [iy2Filter, setIy2Filter] = useState('')
  const [oddsFilters, setOddsFilters] = useState<OddsFilters>({})
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [sortLoading, setSortLoading] = useState(false)
  const [dbTotalCount, setDbTotalCount] = useState<number | null>(null)
  const [selectedLeagues, setSelectedLeagues] = useState<string[]>([])
  const [availableLeagues, setAvailableLeagues] = useState<string[]>([])
  const requestSeq = useRef(0)

  const runFilterSearch = useCallback(async () => {
    const requestId = ++requestSeq.current
    setLoading(true)
    setError(null)
    setHasSearched(true)
    const timeoutId = window.setTimeout(() => {
      if (requestId === requestSeq.current) {
        setLoading(false)
        setError('İstek zaman aşımına uğradı')
      }
    }, 20000)

    try {
      const params: Record<string, string> = {}
      if (leagueFilter.trim()) params.league = leagueFilter.trim()
      if (matchFilter.trim()) params.match = matchFilter.trim()
      if (scoreFilter.trim()) params.score = scoreFilter.trim()
      if (kgFilter.trim()) params.kg = kgFilter.trim()
      if (altFilter.trim()) params.alt = altFilter.trim()
      if (ustFilter.trim()) params.ust = ustFilter.trim()
      if (iyFilter.trim()) params.iy = iyFilter.trim()

      Object.entries(oddsFilters).forEach(([key, value]) => {
        if (value && value.trim()) {
          params[key] = value.trim()
        }
      })

      const hasAnyFilter = Object.keys(params).length > 0
      if (!hasAnyFilter) {
        // Hiç filtre yoksa hiçbir maçı gösterme (oynanmamış maç listesi de yok)
        setHasSearched(false)
        setMatches([])
        setTotalCount(0)
        setLoading(false)
        window.clearTimeout(timeoutId)
        return
      }

      const response = await axios.get('/api/csv-filter', { params })
      if (requestId !== requestSeq.current) return
      setMatches(response.data || [])
      setTotalCount((response.data || []).length)
    } catch (err: any) {
      if (requestId !== requestSeq.current) return
      setError(err.response?.data?.detail || 'Filtreleme sırasında bir hata oluştu')
      setMatches([])
      setTotalCount(0)
    } finally {
      window.clearTimeout(timeoutId)
      if (requestId === requestSeq.current) {
        setLoading(false)
      }
    }
  }, [leagueFilter, matchFilter, scoreFilter, kgFilter, altFilter, ustFilter, iyFilter, oddsFilters])

  const updateOddsFilter = (key: keyof OddsFilters, value: string) => {
    setOddsFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      runFilterSearch()
    }, 300)
    return () => clearTimeout(timer)
  }, [runFilterSearch])

  useEffect(() => {
    const saved = sessionStorage.getItem('idaa_home_scroll')
    if (saved) {
      const y = Number(saved)
      if (!Number.isNaN(y)) {
        window.scrollTo(0, y)
      }
    }
  }, [])

  // Toplam maç sayısını (tüm CSV veri tabanı) bir kez çek
  useEffect(() => {
    const fetchTotalCount = async () => {
      try {
        const response = await axios.get('/api/csv-count')
        const count = response.data?.count
        if (typeof count === 'number' && !Number.isNaN(count)) {
          setDbTotalCount(count)
        }
      } catch (err) {
        // Sessiz geç
      }
    }
    fetchTotalCount()
  }, [])

  // Tüm ligleri bir kez çek
  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        const response = await axios.get('/api/csv-leagues')
        const leagues = response.data || []
        if (Array.isArray(leagues) && leagues.length > 0) {
          setAvailableLeagues(leagues)
        }
      } catch (err) {
        // Sessiz geç
      }
    }
    fetchLeagues()
  }, [])

  // Oran türü etiketleri
  const getMarketLabel = (key: string): string => {
    const labels: Record<string, string> = {
      'ms1': '1 (Ev Sahibi)',
      'msx': 'X (Beraberlik)',
      'ms2': '2 (Deplasman)',
      'kg_var': 'KG Var',
      'kg_yok': 'KG Yok',
      'o05': 'Üst 0.5',
      'u05': 'Alt 0.5',
      'o15': 'Üst 1.5',
      'u15': 'Alt 1.5',
      'o25': 'Üst 2.5',
      'u25': 'Alt 2.5',
      'o35': 'Üst 3.5',
      'u35': 'Alt 3.5',
      'o45': 'Üst 4.5',
      'u45': 'Alt 4.5'
    }
    return labels[key] || key
  }

  // Maç durumu class'ı
  const getStatusClass = (status: string): string => {
    const statusMap: Record<string, string> = {
      'PAST': 'past',
      'TODAY': 'today',
      'UPCOMING': 'upcoming'
    }
    return statusMap[status] || 'upcoming'
  }

  // Maç durumu Türkçe
  const getStatusText = (status: string): string => {
    const statusMap: Record<string, string> = {
      'PAST': 'Geçmiş',
      'TODAY': 'Bugün',
      'UPCOMING': 'Yaklaşan'
    }
    return statusMap[status] || 'Yaklaşan'
  }

  const getTotalGoalsDisplay = (match: Match): React.ReactNode => {
    const odds = match.odds || {}
    const lines: Array<{ label: string; value: number | string | undefined }> = [
      { label: 'ÜST 0.5', value: odds.o05 },
      { label: 'ALT 0.5', value: odds.u05 },
      { label: 'ÜST 1.5', value: odds.o15 },
      { label: 'ALT 1.5', value: odds.u15 },
      { label: 'ÜST 2.5', value: odds.o25 },
      { label: 'ALT 2.5', value: odds.u25 },
      { label: 'ÜST 3.5', value: odds.o35 },
      { label: 'ALT 3.5', value: odds.u35 },
      { label: 'ÜST 4.5', value: odds.o45 },
      { label: 'ALT 4.5', value: odds.u45 }
    ]

    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(10, minmax(45px, auto))',
          columnGap: '8px',
          whiteSpace: 'nowrap',
          justifyItems: 'center'
        }}
      >
        {lines.map(line => (
          <span
            key={line.label}
            style={{ fontSize: '11px' }}
          >
            {formatOddFlexible(line.value)}
          </span>
        ))}
      </div>
    )
  }

  const getIyDisplay = (match: Match): React.ReactNode => {
    const odds = match.odds || {}
    if (odds.iy1 || odds.iyx || odds.iy2) {
      const iy1 = odds.iy1 ?? '-'
      const iyx = odds.iyx ?? '-'
      const iy2 = odds.iy2 ?? '-'
      return (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(28px, auto) minmax(28px, auto) minmax(28px, auto)',
            columnGap: '10px',
            whiteSpace: 'nowrap'
          }}
        >
          <span>{iy1}</span>
          <span>{iyx}</span>
          <span>{iy2}</span>
        </div>
      )
    }
    // İY kolonunda artık skor gösterme, oran yoksa boş bırak
    return '-'
  }

  const getDateTimeDisplay = (match: Match): string => {
    const date = match.date || ''
    const time = match.time || ''
    if (date && time) return `${date} ${time}`
    if (date) return date
    return '-'
  }

  const getMs1Stats = () => {
    const raw = oddsFilters.ms1?.trim()
    const parsed = raw ? Number(raw.replace(',', '.')) : null

    let total = 0
    let withResult = 0
    let hit = 0
    let miss = 0
    let over05 = 0
    let over25 = 0
    let kg = 0

    matches.forEach((m) => {
      const h = m.fthg
      const a = m.ftag
      if (h === null || a === null || h === undefined || a === undefined) {
        return
      }
      total += 1
      withResult += 1
      const homeWin = h > a
      if (homeWin) {
        hit += 1
      } else {
        miss += 1
      }
      const goals = h + a
      if (goals >= 1) over05 += 1
      if (goals >= 3) over25 += 1
      if (h > 0 && a > 0) kg += 1
    })

    if (withResult === 0) return null

    const pct = (value: number) => ((value / withResult) * 100).toFixed(1)

    return {
      odd: parsed !== null && !Number.isNaN(parsed) ? parsed.toFixed(2) : null,
      total,
      hit,
      miss,
      hitRate: pct(hit),
      missRate: pct(miss),
      over05,
      over05Rate: pct(over05),
      over25,
      over25Rate: pct(over25),
      kg,
      kgRate: pct(kg)
    }
  }

  const getMs1LeagueStats = () => {
    const base = getMs1Stats()
    if (!base) return []

    const leagueMap = new Map<
      string,
      {
        league: string
        total: number
        hit: number
        miss: number
        over05: number
        over25: number
        kg: number
      }
    >()

    matches.forEach((m) => {
      const h = m.fthg
      const a = m.ftag
      if (h === null || a === null || h === undefined || a === undefined) {
        return
      }
      const league = m.league || 'Diğer'
      if (!leagueMap.has(league)) {
        leagueMap.set(league, {
          league,
          total: 0,
          hit: 0,
          miss: 0,
          over05: 0,
          over25: 0,
          kg: 0
        })
      }
      const entry = leagueMap.get(league)!
      entry.total += 1
      const homeWin = h > a
      if (homeWin) {
        entry.hit += 1
      } else {
        entry.miss += 1
      }
      const goals = h + a
      if (goals >= 1) entry.over05 += 1
      if (goals >= 3) entry.over25 += 1
      if (h > 0 && a > 0) entry.kg += 1
    })

    const pct = (value: number, total: number) =>
      total > 0 ? ((value / total) * 100).toFixed(1) : '0.0'

    return Array.from(leagueMap.values())
      .filter(l => l.total > 0)
      .sort((a, b) => b.total - a.total)
      .map(l => ({
        league: l.league,
        total: l.total,
        hit: l.hit,
        miss: l.miss,
        hitRate: pct(l.hit, l.total),
        missRate: pct(l.miss, l.total),
        over05: l.over05,
        over05Rate: pct(l.over05, l.total),
        over25: l.over25,
        over25Rate: pct(l.over25, l.total),
        kg: l.kg,
        kgRate: pct(l.kg, l.total)
      }))
  }

  const buildAnalysisQuery = () => {
    const query: Record<string, string> = {}
    const addNumber = (key: string, value: string) => {
      const parsed = Number(value.replace(',', '.').trim())
      if (!Number.isNaN(parsed)) {
        query[key] = String(parsed)
      }
    }

    Object.entries(oddsFilters).forEach(([key, value]) => {
      if (value && value.trim()) {
        addNumber(key, value)
      }
    })

    if (kgFilter.trim()) {
      addNumber('kg', kgFilter)
    }
    if (altFilter.trim()) {
      addNumber('alt', altFilter)
    }
    if (ustFilter.trim()) {
      addNumber('ust', ustFilter)
    }

    return query
  }

  const rememberScroll = () => {
    sessionStorage.setItem('idaa_home_scroll', String(window.scrollY))
  }

  const toggleLeagueSelection = (league: string) => {
    setSelectedLeagues(prev => {
      if (prev.includes(league)) {
        return prev.filter(l => l !== league)
      }
      return [...prev, league]
    })
  }

  const clearLeagueSelection = () => {
    setSelectedLeagues([])
  }

  const displayedMatches = selectedLeagues.length
    ? matches.filter(m => m.league && selectedLeagues.includes(m.league))
    : matches

  const sortByHitRate = async () => {
    if (matches.length === 0) return
    setSortLoading(true)
    setError(null)
    try {
      const payload = {
        matches: matches.map((m) => ({ match_id: m.match_id, odds: m.odds || {} }))
      }
      const response = await axios.post('/api/odds-rates', payload)
      const results: Array<{ id: string; maxRate: number }> = response.data?.results || []
      const rateMap = new Map(results.map((r) => [r.id, r.maxRate]))
      const sorted = [...matches].sort((a, b) => {
        const aRate = rateMap.get(a.match_id) ?? 0
        const bRate = rateMap.get(b.match_id) ?? 0
        return bRate - aRate
      })
      setMatches(sorted)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Tutma oranı sıralaması başarısız')
    } finally {
      setSortLoading(false)
    }
  }

  return (
    <div className="container">
      {/* Navbar */}
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

      {/* Filter Section */}
      <div className="search-section">
        <div
          className="filter-row"
          style={{
            fontSize: '11px',
            columnGap: '6px'
          }}
        >
          <div className="filter-cell">
            <div className="filter-label">Lig</div>
            <select
              className="search-input compact filter-league-small"
              value={leagueFilter}
              onChange={(e) => setLeagueFilter(e.target.value)}
            >
              <option value="">Hepsi</option>
              {availableLeagues.length > 0 ? (
                availableLeagues.map((league) => (
                  <option key={league} value={league}>
                    {league}
                  </option>
                ))
              ) : (
                <>
                  <option value="Champions League">Europe — Champions League</option>
                  <option value="Europa League">Europe — Europa League</option>
                  <option value="Premier League">England — Premier League</option>
                  <option value="Russia Premier League">Russia — Premier League</option>
                  <option value="La Liga">Spain — LaLiga</option>
                  <option value="Bundesliga">Germany — Bundesliga</option>
                  <option value="Serie A">Italy — Serie A</option>
                  <option value="Brazil Serie A">Brazil — Serie A</option>
                  <option value="Ligue 1">France — Ligue 1</option>
                  <option value="Super Lig">Turkey — Super Lig</option>
                  <option value="Eredivisie">Netherlands — Eredivisie</option>
                  <option value="Liga Portugal">Portugal — Liga Portugal</option>
                  <option value="Scottish Premiership">Scotland — Premiership</option>
                  <option value="MLS">USA — MLS</option>
                  <option value="A-League">Australia — A-League</option>
                </>
              )}
            </select>
          </div>
          <div className="filter-cell">
            <div className="filter-label">Maç</div>
            <input
              className="search-input compact filter-input-short"
              placeholder=""
              value={matchFilter}
              onChange={(e) => setMatchFilter(e.target.value)}
            />
          </div>
          <div className="filter-cell">
            <div className="filter-label">Skor</div>
            <input
              className="search-input compact filter-input-short"
              placeholder=""
              value={scoreFilter}
              onChange={(e) => setScoreFilter(e.target.value)}
            />
          </div>
          <div className="filter-cell">
            <div className="filter-label">MS1</div>
            <input
              className="search-input compact filter-input-short"
              placeholder=""
              value={oddsFilters.ms1 || ''}
              onChange={(e) => updateOddsFilter('ms1', e.target.value)}
            />
          </div>
          <div className="filter-cell">
            <div className="filter-label">MSX</div>
            <input
              className="search-input compact filter-input-short"
              placeholder=""
              value={oddsFilters.msx || ''}
              onChange={(e) => updateOddsFilter('msx', e.target.value)}
            />
          </div>
          <div className="filter-cell">
            <div className="filter-label">MS2</div>
            <input
              className="search-input compact filter-input-short"
              placeholder=""
              value={oddsFilters.ms2 || ''}
              onChange={(e) => updateOddsFilter('ms2', e.target.value)}
            />
          </div>
          <div className="filter-cell">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(50px, 1fr))',
                columnGap: '4px'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '11px', textAlign: 'center' }}>KG Var</span>
                <input
                  className="search-input compact filter-input-short"
                  placeholder=""
                  value={oddsFilters.kg_var || ''}
                  onChange={(e) => updateOddsFilter('kg_var', e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '11px', textAlign: 'center' }}>KG Yok</span>
                <input
                  className="search-input compact filter-input-short"
                  placeholder=""
                  value={oddsFilters.kg_yok || ''}
                  onChange={(e) => updateOddsFilter('kg_yok', e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="filter-cell">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(50px, 1fr))',
                columnGap: '4px'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '11px', textAlign: 'center' }}>iy1</span>
                <input
                  className="search-input compact filter-input-short"
                  placeholder=""
                  value={iy1Filter}
                  onChange={(e) => setIy1Filter(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '11px', textAlign: 'center' }}>iyx</span>
                <input
                  className="search-input compact filter-input-short"
                  placeholder=""
                  value={iyxFilter}
                  onChange={(e) => setIyxFilter(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '11px', textAlign: 'center' }}>iy2</span>
                <input
                  className="search-input compact filter-input-short"
                  placeholder=""
                  value={iy2Filter}
                  onChange={(e) => setIy2Filter(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: '16px',
            padding: '10px 12px',
            borderRadius: '8px',
            backgroundColor: '#020617',
            border: '1px solid #1f2937',
            fontSize: '11px',
            lineHeight: 1.4
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'nowrap',
              gap: '8px',
              overflowX: 'auto'
            }}
          >
            {[
              { key: 'o05', kolon: 'O05', bahis: 'ÜST 0.5', aciklama: 'En az 1 gol olur' },
              { key: 'u05', kolon: 'U05', bahis: 'ALT 0.5', aciklama: '0-0 biter' },
              { key: 'o15', kolon: 'O15', bahis: 'ÜST 1.5', aciklama: '2+ gol' },
              { key: 'u15', kolon: 'U15', bahis: 'ALT 1.5', aciklama: '0 veya 1 gol' },
              { key: 'o25', kolon: 'O25', bahis: 'ÜST 2.5', aciklama: '3+ gol' },
              { key: 'u25', kolon: 'U25', bahis: 'ALT 2.5', aciklama: '0–2 gol' },
              { key: 'o35', kolon: 'O35', bahis: 'ÜST 3.5', aciklama: '4+ gol' },
              { key: 'u35', kolon: 'U35', bahis: 'ALT 3.5', aciklama: '0–3 gol' },
              { key: 'o45', kolon: 'O45', bahis: 'ÜST 4.5', aciklama: '5+ gol' },
              { key: 'u45', kolon: 'U45', bahis: 'ALT 4.5', aciklama: '0–4 gol' }
            ].map(item => (
              <div
                key={item.key}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '1px',
                  padding: '4px 6px',
                  borderRadius: '6px',
                  backgroundColor: '#020617',
                  minWidth: '95px'
                }}
              >
                <div style={{ fontWeight: 600 }}>{item.bahis}</div>
                <div style={{ fontSize: '9px', lineHeight: 1.1, color: '#9ca3af', textAlign: 'center' }}>
                  {item.aciklama}
                </div>
                <input
                  className="search-input compact filter-input-short"
                  placeholder=""
                  value={(oddsFilters as any)[item.key] || ''}
                  onChange={(e) => updateOddsFilter(item.key as keyof OddsFilters, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button className="btn-primary" onClick={runFilterSearch}>Filtrele</button>
          <button
            className="btn-secondary"
            onClick={() => {
              setLeagueFilter('')
              setMatchFilter('')
              setScoreFilter('')
              setKgFilter('')
              setAltFilter('')
              setUstFilter('')
              setIyFilter('')
              setOddsFilters({})
              setSelectedLeagues([])
              setMatches([])
              setHasSearched(false)
              setTotalCount(0)
            }}
          >
            Temizle
          </button>
          <input
            className="search-input compact"
            style={{ maxWidth: '220px', minWidth: '180px' }}
            value={
              hasSearched
                ? `${formatInt(matches.length)} sonuç bulundu`
                : `${formatInt(dbTotalCount ?? 45847)} toplam sonuç`
            }
            readOnly
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Yükleniyor...</p>
        </div>
      )}

      {/* Matches */}
      {!loading && displayedMatches.length === 0 && !error && (
        <div className="no-matches">
          <h3>🔍 Maç bulunamadı</h3>
          <p>{hasSearched ? 'Filtrelerinizi değiştirip tekrar deneyin.' : 'Lütfen filtre girip arama yapın.'}</p>
        </div>
      )}

      {/* MS1 oranı için hızlı istatistik kutusu */}
      {!loading && matches.length > 0 && getMs1Stats() && (
        <div
          style={{
            marginTop: '16px',
            padding: '12px 14px',
            borderRadius: '8px',
            backgroundColor: '#020617',
            border: '1px solid #1f2937',
            fontSize: '11px',
            lineHeight: 1.5
          }}
        >
          {(() => {
            const s = getMs1Stats()!
            return (
              <>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(130px, 1.5fr) repeat(2, minmax(120px, 1fr))',
                    columnGap: '16px',
                    rowGap: '6px',
                    alignItems: 'stretch',
                    marginBottom: getMs1LeagueStats().length > 0 ? '10px' : 0
                  }}
                >
                  {/* Sol taraf: başlık ve toplam maç */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      borderRight: '1px solid #1f2937',
                      paddingRight: '10px'
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 600 }}>
                      {s.odd ? (
                        <>
                          MS1 <span style={{ color: '#facc15' }}>{s.odd}</span> oranı
                        </>
                      ) : (
                        <>Seçili maçların istatistiği</>
                      )}
                    </div>
                    <div style={{ color: '#9ca3af' }}>
                      <strong>{formatInt(s.total)}</strong> maçın geçmiş performansı
                    </div>
                  </div>

                  {/* Oran sonucu kartı */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      background: 'linear-gradient(to bottom right, #022c22, #020617)',
                      border: '1px solid #064e3b'
                    }}
                  >
                    <div style={{ fontSize: '11px', color: '#a7f3d0' }}>Maç Sonucu (MS1)</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                      <span>Tutmuş</span>
                      <span>
                        <strong>{formatInt(s.hit)}</strong> ({s.hitRate}%)
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                      <span>Yatmış</span>
                      <span>
                        <strong>{formatInt(s.miss)}</strong> ({s.missRate}%)
                      </span>
                    </div>
                  </div>

                  {/* Goller ve KG kartı */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      background: 'linear-gradient(to bottom right, #111827, #020617)',
                      border: '1px solid #1f2937'
                    }}
                  >
                    <div style={{ fontSize: '11px', color: '#93c5fd' }}>Goller & KG</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                      <span>0.5 ÜST</span>
                      <span>
                        <strong>{formatInt(s.over05)}</strong> ({s.over05Rate}%)
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                      <span>2.5 ÜST</span>
                      <span>
                        <strong>{formatInt(s.over25)}</strong> ({s.over25Rate}%)
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                      <span>KG Var</span>
                      <span>
                        <strong>{formatInt(s.kg)}</strong> ({s.kgRate}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Liglere göre dağılım */}
                {getMs1LeagueStats().length > 0 && (
                  <div
                    style={{
                      borderTop: '1px solid #1f2937',
                      paddingTop: '8px',
                      marginTop: '4px'
                    }}
                  >
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '6px' }}>
                      {s.odd ? (
                        <>Liglere göre MS1 {s.odd} dağılımı:</>
                      ) : (
                        <>Liglere göre dağılım:</>
                      )}
                    </div>
                    {selectedLeagues.length > 0 && (
                      <div
                        style={{
                          marginBottom: '6px',
                          fontSize: '11px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          color: '#e5e7eb'
                        }}
                      >
                        <span>
                          Seçili ligler: <strong>{selectedLeagues.join(', ')}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={clearLeagueSelection}
                          style={{
                            fontSize: '10px',
                            padding: '3px 6px',
                            borderRadius: '999px',
                            border: '1px solid #4b5563',
                            backgroundColor: 'transparent',
                            color: '#9ca3af',
                            cursor: 'pointer'
                          }}
                        >
                          Hepsini göster
                        </button>
                      </div>
                    )}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '12px'
                      }}
                    >
                      {getMs1LeagueStats().map((l) => {
                        const logoPath = getLeagueLogo(l.league)
                        return (
                        <div
                          key={l.league}
                          style={{
                              borderRadius: '8px',
                            backgroundColor: '#020617',
                            border: '1px solid #111827',
                            display: 'flex',
                            flexDirection: 'column',
                              overflow: 'hidden',
                              minHeight: '280px'
                            }}
                          >
                            {/* Logo Bölümü - %40 */}
                            <div
                              style={{
                                height: '40%',
                                minHeight: '112px',
                                background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%)',
                                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                padding: '12px',
                                gap: '6px'
                          }}
                        >
                              {logoPath && (
                                <img
                                  src={logoPath}
                                  alt={l.league}
                                  style={{
                                    maxWidth: '80px',
                                    maxHeight: '70px',
                                    objectFit: 'contain',
                                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                                  }}
                                />
                              )}
                              <div style={{ fontSize: '12px', fontWeight: 600, textAlign: 'center', color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                                {formatLeagueName(l.league)}
                              </div>
                            </div>
                            
                            {/* İstatistik Bölümü - %60 */}
                            <div
                              style={{
                                height: '60%',
                                padding: '10px 12px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px',
                                justifyContent: 'space-between'
                              }}
                            >
                              <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '2px' }}>
                                Toplam: <strong style={{ color: '#e5e7eb' }}>{formatInt(l.total)}</strong> maç
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                                <span style={{ color: '#9ca3af' }}>Tutmuş</span>
                                <span style={{ color: '#22c55e', fontWeight: 600 }}>
                              <strong>{formatInt(l.hit)}</strong> ({l.hitRate}%)
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                                <span style={{ color: '#9ca3af' }}>Yatmış</span>
                                <span style={{ color: '#ef4444', fontWeight: 600 }}>
                              <strong>{formatInt(l.miss)}</strong> ({l.missRate}%)
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                                <span style={{ color: '#9ca3af' }}>0.5 ÜST</span>
                                <span style={{ color: '#e5e7eb' }}>
                              <strong>{formatInt(l.over05)}</strong> ({l.over05Rate}%)
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                                <span style={{ color: '#9ca3af' }}>2.5 ÜST</span>
                                <span style={{ color: '#e5e7eb' }}>
                              <strong>{formatInt(l.over25)}</strong> ({l.over25Rate}%)
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                                <span style={{ color: '#9ca3af' }}>KG Var</span>
                                <span style={{ color: '#e5e7eb' }}>
                              <strong>{formatInt(l.kg)}</strong> ({l.kgRate}%)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleLeagueSelection(l.league)}
                            style={{
                                  marginTop: '6px',
                              fontSize: '10px',
                                  padding: '4px 8px',
                              borderRadius: '999px',
                              border: selectedLeagues.includes(l.league) ? '1px solid #16a34a' : '1px solid #4b5563',
                              backgroundColor: selectedLeagues.includes(l.league) ? '#16a34a' : 'transparent',
                              color: selectedLeagues.includes(l.league) ? '#0b1120' : '#e5e7eb',
                              cursor: 'pointer',
                                  alignSelf: 'flex-start',
                                  transition: 'all 0.2s'
                            }}
                          >
                            {selectedLeagues.includes(l.league) ? 'Bu ligi kaldır' : 'Sonuçları getir'}
                          </button>
                        </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            )
          })()}
        </div>
      )}

      {/* İddaa bültenindeki sırayı BOZMADAN, gelen diziyi aynen alt alta yaz */}
      {!loading && displayedMatches.length > 0 && (
        <div className="matches-container" style={{ overflowX: 'auto', paddingRight: '20px' }}>
          <table className="matches-table" style={{ marginRight: '0', marginBottom: '20px' }}>
            <thead>
              <tr>
                <th>Lig</th>
                <th>Maç</th>
                <th>Tarih</th>
                <th>Skor</th>
                <th>MS1</th>
                <th>MSX</th>
                <th>MS2</th>
                <th>KG Var</th>
                <th>KG Yok</th>
                <th>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(10, minmax(45px, auto))',
                      columnGap: '8px',
                      whiteSpace: 'nowrap',
                      fontSize: '11px',
                      justifyItems: 'center'
                    }}
                  >
                    {[
                      'ÜST 0.5',
                      'ALT 0.5',
                      'ÜST 1.5',
                      'ALT 1.5',
                      'ÜST 2.5',
                      'ALT 2.5',
                      'ÜST 3.5',
                      'ALT 3.5',
                      'ÜST 4.5',
                      'ALT 4.5'
                    ].map(label => (
                      <span key={label}>{label}</span>
                    ))}
                  </div>
                </th>
                <th>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(28px, auto) minmax(28px, auto) minmax(28px, auto)',
                      columnGap: '10px',
                      whiteSpace: 'nowrap',
                      justifyItems: 'start'
                    }}
                  >
                    <span>iy1</span>
                    <span>iyx</span>
                    <span>iy2</span>
                  </div>
                </th>
                <th>MS</th>
                <th>Analiz</th>
              </tr>
            </thead>
            <tbody>
              {displayedMatches.map((match) => (
                <tr key={match.match_id}>
                  <td>{match.league}</td>
                  <td>{match.home_team} - {match.away_team}</td>
                  <td>{getDateTimeDisplay(match)}</td>
                  <td>{match.score || '-'}</td>
                  <td>{formatOdd(match.odds?.ms1)}</td>
                  <td>{formatOdd(match.odds?.msx)}</td>
                  <td>{formatOdd(match.odds?.ms2)}</td>
                  <td>{formatOdd(match.odds?.kg_var)}</td>
                  <td>{formatOdd(match.odds?.kg_yok)}</td>
                  <td>{getTotalGoalsDisplay(match)}</td>
                  <td>{getIyDisplay(match)}</td>
                  <td>{match.score || '-'}</td>
                  <td>
                    <Link
                      className="btn-analiz"
                      href={{ pathname: `/match/${match.match_id}`, query: buildAnalysisQuery() }}
                      onClick={rememberScroll}
                      scroll={false}
                    >
                      Analiz
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
