'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import axios from 'axios'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

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
  const pathname = usePathname()
  const [leagueFilter, setLeagueFilter] = useState('')
  const [matchFilter, setMatchFilter] = useState('')
  const [scoreFilter, setScoreFilter] = useState('')
  const [kgFilter, setKgFilter] = useState('')
  const [altFilter, setAltFilter] = useState('')
  const [ustFilter, setUstFilter] = useState('')
  const [iyFilter, setIyFilter] = useState('')
  const [oddsFilters, setOddsFilters] = useState<OddsFilters>({})
  const [tolerancePlus, setTolerancePlus] = useState<Record<string, number>>({})
  const [toleranceMinus, setToleranceMinus] = useState<Record<string, number>>({})
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [sortLoading, setSortLoading] = useState(false)
  const [dbTotalCount, setDbTotalCount] = useState<number | null>(null)
  const [selectedLeagues, setSelectedLeagues] = useState<string[]>([])
  const [availableLeagues, setAvailableLeagues] = useState<string[]>([])
  const [openTooltip, setOpenTooltip] = useState<string | null>(null)
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
          
          // Tolerans parametreleri
          const plus = tolerancePlus[key] ?? 0
          const minus = toleranceMinus[key] ?? 0
          if (plus > 0) {
            params[`${key}_plus`] = String(plus)
          }
          if (minus > 0) {
            params[`${key}_minus`] = String(minus)
          }
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
  }, [leagueFilter, matchFilter, scoreFilter, kgFilter, altFilter, ustFilter, iyFilter, oddsFilters, tolerancePlus, toleranceMinus])

  const updateOddsFilter = (key: keyof OddsFilters, value: string) => {
    setOddsFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  // Debounce ile filtreleme - sadece kullanıcı yazmayı bıraktığında çalış
  useEffect(() => {
    // Eğer hiçbir filtre yoksa, arama yapma
    const hasFilters = leagueFilter.trim() || matchFilter.trim() || scoreFilter.trim() || 
                      kgFilter.trim() || altFilter.trim() || ustFilter.trim() || iyFilter.trim() ||
                      Object.values(oddsFilters).some(v => v && v.trim())
    
    if (!hasFilters) {
      setHasSearched(false)
      setMatches([])
      setTotalCount(0)
      return
    }

    const timer = setTimeout(() => {
      runFilterSearch()
    }, 1000) // 1 saniye debounce
    
    return () => clearTimeout(timer)
  }, [leagueFilter, matchFilter, scoreFilter, kgFilter, altFilter, ustFilter, iyFilter, oddsFilters, tolerancePlus, toleranceMinus, runFilterSearch])

  useEffect(() => {
    const saved = sessionStorage.getItem('idaa_home_scroll')
    if (saved) {
      const y = Number(saved)
      if (!Number.isNaN(y)) {
        window.scrollTo(0, y)
      }
    }
  }, [])

  // AdSense reklamlarını yükle
  useEffect(() => {
    const initAds = () => {
      try {
        if (typeof window !== 'undefined') {
          const adsbygoogle = (window as any).adsbygoogle
          if (adsbygoogle && adsbygoogle.loaded) {
            // Script yüklendiyse reklamları initialize et
            const adElements = document.querySelectorAll('.adsbygoogle:not([data-adsbygoogle-status])')
            if (adElements.length > 0) {
              adsbygoogle.push({})
              adsbygoogle.push({})
            }
          } else if (adsbygoogle) {
            // Script yükleniyor, bekle
            adsbygoogle.push({})
            adsbygoogle.push({})
          }
        }
      } catch (e: any) {
        // Hata mesajını sadece gerçekten önemliyse göster
        if (!e?.message?.includes('already have ads')) {
          console.error('AdSense yükleme hatası:', e)
        }
      }
    }

    // DOM hazır olduktan sonra ve script yüklendikten sonra initialize et
    if (typeof window !== 'undefined') {
      // İlk deneme
      setTimeout(initAds, 500)
      
      // Script yüklenene kadar kontrol et
      const checkInterval = setInterval(() => {
        if ((window as any).adsbygoogle) {
          initAds()
          clearInterval(checkInterval)
        }
      }, 200)
      
      // 15 saniye sonra timeout
      setTimeout(() => clearInterval(checkInterval), 15000)
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

  // Tooltip dışarı tıklanınca kapat
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-tooltip-container]')) {
        setOpenTooltip(null)
      }
    }
    if (openTooltip) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [openTooltip])

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
    // MS1, MSX veya MS2'den herhangi biri varsa çalış
    const ms1Raw = oddsFilters.ms1?.trim()
    const msxRaw = oddsFilters.msx?.trim()
    const ms2Raw = oddsFilters.ms2?.trim()
    
    const ms1Parsed = ms1Raw ? Number(ms1Raw.replace(',', '.')) : null
    const msxParsed = msxRaw ? Number(msxRaw.replace(',', '.')) : null
    const ms2Parsed = ms2Raw ? Number(ms2Raw.replace(',', '.')) : null
    
    // Hangi filtreler aktif?
    const activeFilters: string[] = []
    if (ms1Parsed !== null && !Number.isNaN(ms1Parsed)) activeFilters.push(`MS1 ${ms1Parsed.toFixed(2)}`)
    if (msxParsed !== null && !Number.isNaN(msxParsed)) activeFilters.push(`MSX ${msxParsed.toFixed(2)}`)
    if (ms2Parsed !== null && !Number.isNaN(ms2Parsed)) activeFilters.push(`MS2 ${ms2Parsed.toFixed(2)}`)
    
    // Hiçbiri yoksa null dön
    if (activeFilters.length === 0) return null
    
    // İlk aktif filtreyi kullan (başlık için)
    const parsed = ms1Parsed ?? msxParsed ?? ms2Parsed

    let total = 0
    let withResult = 0
    let ms1Hit = 0
    let ms1Miss = 0
    let msxHit = 0
    let msxMiss = 0
    let ms2Hit = 0
    let ms2Miss = 0
    let over05 = 0
    let over15 = 0
    let over25 = 0
    let kgVar = 0
    let kgYok = 0
    
    // Detaylı istatistikler
    let over05Dep = 0 // Deplasman 0.5 üst
    let over05Ev = 0 // Ev sahibi 0.5 üst
    let over15Dep = 0
    let over15Ev = 0
    let over25Dep = 0
    let over25Ev = 0
    let kgVarDep = 0 // KG var + deplasman gol
    let kgVarEv = 0 // KG var + ev sahibi gol
    
    // İlk yarı istatistikleri
    let iyOver05 = 0
    let iyOver05Dep = 0
    let iyOver05Ev = 0
    let iyKgVar = 0
    let iyKgVarDep = 0
    let iyKgVarEv = 0
    let iyKgYok = 0
    let iyKgYokDep = 0
    let iyKgYokEv = 0
    
    // MS1/MSX/MS2 için KG istatistikleri
    let ms1KgVar = 0
    let ms1KgVarDep = 0
    let ms1KgVarEv = 0
    let ms1KgYok = 0
    let ms1KgYokDep = 0
    let ms1KgYokEv = 0
    let msxKgVar = 0
    let msxKgVarDep = 0
    let msxKgVarEv = 0
    let msxKgYok = 0
    let msxKgYokDep = 0
    let msxKgYokEv = 0
    let ms2KgVar = 0
    let ms2KgVarDep = 0
    let ms2KgVarEv = 0
    let ms2KgYok = 0
    let ms2KgYokDep = 0
    let ms2KgYokEv = 0
    
    const leagueSet = new Set<string>()

    matches.forEach((m) => {
      const h = m.fthg
      const a = m.ftag
      if (h === null || a === null || h === undefined || a === undefined) {
        return
      }
      total += 1
      withResult += 1
      
      if (m.league) leagueSet.add(m.league)
      
      // Maç sonuçları
      const isMs1 = h > a
      const isMsx = h === a
      const isMs2 = h < a
      
      if (isMs1) {
        ms1Hit += 1
        msxMiss += 1
        ms2Miss += 1
      } else if (isMs2) {
        ms1Miss += 1
        msxMiss += 1
        ms2Hit += 1
      } else {
        ms1Miss += 1
        msxHit += 1
        ms2Miss += 1
      }
      
      const goals = h + a
      if (goals >= 1) {
        over05 += 1
        if (a >= 1) over05Dep += 1
        if (h >= 1) over05Ev += 1
      }
      if (goals >= 2) {
        over15 += 1
        if (a >= 1) over15Dep += 1
        if (h >= 1) over15Ev += 1
      }
      if (goals >= 3) {
        over25 += 1
        if (a >= 1) over25Dep += 1
        if (h >= 1) over25Ev += 1
      }
      
      const hasKg = h > 0 && a > 0
      if (hasKg) {
        kgVar += 1
        if (a >= 1) kgVarDep += 1
        if (h >= 1) kgVarEv += 1
        
        // MS1/MSX/MS2 için KG
        if (isMs1) {
          ms1KgVar += 1
          if (a >= 1) ms1KgVarDep += 1
          if (h >= 1) ms1KgVarEv += 1
        } else if (isMsx) {
          msxKgVar += 1
          if (a >= 1) msxKgVarDep += 1
          if (h >= 1) msxKgVarEv += 1
        } else if (isMs2) {
          ms2KgVar += 1
          if (a >= 1) ms2KgVarDep += 1
          if (h >= 1) ms2KgVarEv += 1
        }
      } else {
        kgYok += 1
        if (isMs1) {
          ms1KgYok += 1
          if (a === 0) ms1KgYokDep += 1
          if (h === 0) ms1KgYokEv += 1
        } else if (isMsx) {
          msxKgYok += 1
          if (a === 0) msxKgYokDep += 1
          if (h === 0) msxKgYokEv += 1
        } else if (isMs2) {
          ms2KgYok += 1
          if (a === 0) ms2KgYokDep += 1
          if (h === 0) ms2KgYokEv += 1
        }
      }
      
      // İlk yarı istatistikleri
      const hthg = (m as any).hthg
      const htag = (m as any).htag
      if (hthg !== null && hthg !== undefined && htag !== null && htag !== undefined) {
        const iyGoals = hthg + htag
        if (iyGoals >= 1) {
          iyOver05 += 1
          if (htag >= 1) iyOver05Dep += 1
          if (hthg >= 1) iyOver05Ev += 1
        }
        
        // İlk yarı KG
        const iyHasKg = hthg > 0 && htag > 0
        if (iyHasKg) {
          iyKgVar += 1
          if (htag >= 1) iyKgVarDep += 1
          if (hthg >= 1) iyKgVarEv += 1
        } else {
          iyKgYok += 1
          if (htag === 0) iyKgYokDep += 1
          if (hthg === 0) iyKgYokEv += 1
        }
      }
    })

    if (withResult === 0) return null

    const pct = (value: number) => ((value / withResult) * 100).toFixed(1)

    return {
      odd: parsed !== null && !Number.isNaN(parsed) ? parsed.toFixed(2) : null,
      activeFilters: activeFilters, // Aktif filtreler listesi
      total,
      totalLeagues: leagueSet.size,
      hit: ms1Hit,
      miss: ms1Miss,
      hitRate: pct(ms1Hit),
      missRate: pct(ms1Miss),
      ms1Hit,
      ms1Miss,
      ms1HitRate: pct(ms1Hit),
      ms1MissRate: pct(ms1Miss),
      msxHit,
      msxMiss,
      msxHitRate: pct(msxHit),
      msxMissRate: pct(msxMiss),
      ms2Hit,
      ms2Miss,
      ms2HitRate: pct(ms2Hit),
      ms2MissRate: pct(ms2Miss),
      over05,
      over05Rate: pct(over05),
      over05Dep,
      over05DepRate: pct(over05Dep),
      over05Ev,
      over05EvRate: pct(over05Ev),
      over15,
      over15Rate: pct(over15),
      over15Dep,
      over15DepRate: pct(over15Dep),
      over15Ev,
      over15EvRate: pct(over15Ev),
      over25,
      over25Rate: pct(over25),
      over25Dep,
      over25DepRate: pct(over25Dep),
      over25Ev,
      over25EvRate: pct(over25Ev),
      kgVar,
      kgVarRate: pct(kgVar),
      kgVarDep,
      kgVarDepRate: pct(kgVarDep),
      kgVarEv,
      kgVarEvRate: pct(kgVarEv),
      kgYok,
      kgYokRate: pct(kgYok),
      iyOver05,
      iyOver05Rate: iyOver05 > 0 ? pct(iyOver05) : null,
      iyOver05Dep,
      iyOver05DepRate: iyOver05Dep > 0 ? pct(iyOver05Dep) : null,
      iyOver05Ev,
      iyOver05EvRate: iyOver05Ev > 0 ? pct(iyOver05Ev) : null,
      iyKgVar,
      iyKgVarRate: iyKgVar > 0 ? pct(iyKgVar) : null,
      iyKgVarDep,
      iyKgVarDepRate: iyKgVarDep > 0 ? pct(iyKgVarDep) : null,
      iyKgVarEv,
      iyKgVarEvRate: iyKgVarEv > 0 ? pct(iyKgVarEv) : null,
      iyKgYok,
      iyKgYokRate: iyKgYok > 0 ? pct(iyKgYok) : null,
      iyKgYokDep,
      iyKgYokDepRate: iyKgYokDep > 0 ? pct(iyKgYokDep) : null,
      iyKgYokEv,
      iyKgYokEvRate: iyKgYokEv > 0 ? pct(iyKgYokEv) : null,
      ms1KgVar,
      ms1KgVarRate: pct(ms1KgVar),
      ms1KgVarDep,
      ms1KgVarDepRate: pct(ms1KgVarDep),
      ms1KgVarEv,
      ms1KgVarEvRate: pct(ms1KgVarEv),
      ms1KgYok,
      ms1KgYokRate: pct(ms1KgYok),
      ms1KgYokDep,
      ms1KgYokDepRate: pct(ms1KgYokDep),
      ms1KgYokEv,
      ms1KgYokEvRate: pct(ms1KgYokEv),
      msxKgVar,
      msxKgVarRate: pct(msxKgVar),
      msxKgVarDep,
      msxKgVarDepRate: pct(msxKgVarDep),
      msxKgVarEv,
      msxKgVarEvRate: pct(msxKgVarEv),
      msxKgYok,
      msxKgYokRate: pct(msxKgYok),
      msxKgYokDep,
      msxKgYokDepRate: pct(msxKgYokDep),
      msxKgYokEv,
      msxKgYokEvRate: pct(msxKgYokEv),
      ms2KgVar,
      ms2KgVarRate: pct(ms2KgVar),
      ms2KgVarDep,
      ms2KgVarDepRate: pct(ms2KgVarDep),
      ms2KgVarEv,
      ms2KgVarEvRate: pct(ms2KgVarEv),
      ms2KgYok,
      ms2KgYokRate: pct(ms2KgYok),
      ms2KgYokDep,
      ms2KgYokDepRate: pct(ms2KgYokDep),
      ms2KgYokEv,
      ms2KgYokEvRate: pct(ms2KgYokEv)
    }
  }

  const getDetailedStats = () => {
    // Herhangi bir filtre dolu mu kontrol et
    const hasAnyFilter = 
      oddsFilters.ms1?.trim() || 
      oddsFilters.msx?.trim() || 
      oddsFilters.ms2?.trim() || 
      oddsFilters.kg_var?.trim() || 
      oddsFilters.kg_yok?.trim() ||
      oddsFilters.o05?.trim() ||
      oddsFilters.u05?.trim() ||
      oddsFilters.o15?.trim() ||
      oddsFilters.u15?.trim() ||
      oddsFilters.o25?.trim() ||
      oddsFilters.u25?.trim() ||
      oddsFilters.o35?.trim() ||
      oddsFilters.u35?.trim() ||
      oddsFilters.o45?.trim() ||
      oddsFilters.u45?.trim() ||
      kgFilter.trim() ||
      altFilter.trim() ||
      ustFilter.trim()

    if (!hasAnyFilter || matches.length === 0) return null

    // Hangi filtre doluysa onu göster
    let filterLabel = 'Seçili Filtre'
    let filterValue: string | null = null
    let filterKey: string | null = null
    let toleranceRange: string | null = null
    
    if (oddsFilters.ms1?.trim()) {
      filterLabel = 'MS1'
      filterValue = oddsFilters.ms1.trim()
      filterKey = 'ms1'
    } else if (oddsFilters.msx?.trim()) {
      filterLabel = 'MSX'
      filterValue = oddsFilters.msx.trim()
      filterKey = 'msx'
    } else if (oddsFilters.ms2?.trim()) {
      filterLabel = 'MS2'
      filterValue = oddsFilters.ms2.trim()
      filterKey = 'ms2'
    } else if (oddsFilters.kg_var?.trim()) {
      filterLabel = 'KG VAR'
      filterValue = oddsFilters.kg_var.trim()
      filterKey = 'kg_var'
    } else if (oddsFilters.kg_yok?.trim()) {
      filterLabel = 'KG YOK'
      filterValue = oddsFilters.kg_yok.trim()
      filterKey = 'kg_yok'
    } else if (kgFilter.trim()) {
      filterLabel = 'KG'
      filterValue = kgFilter.trim()
    } else if (ustFilter.trim()) {
      filterLabel = 'ÜST'
      filterValue = ustFilter.trim()
    } else if (altFilter.trim()) {
      filterLabel = 'ALT'
      filterValue = altFilter.trim()
    } else if (oddsFilters.o05?.trim() || oddsFilters.o15?.trim() || oddsFilters.o25?.trim() || oddsFilters.o35?.trim() || oddsFilters.o45?.trim()) {
      const oFilter = oddsFilters.o05?.trim() || oddsFilters.o15?.trim() || oddsFilters.o25?.trim() || oddsFilters.o35?.trim() || oddsFilters.o45?.trim()
      filterLabel = 'ÜST'
      filterValue = oFilter || null
    } else if (oddsFilters.u05?.trim() || oddsFilters.u15?.trim() || oddsFilters.u25?.trim() || oddsFilters.u35?.trim() || oddsFilters.u45?.trim()) {
      const uFilter = oddsFilters.u05?.trim() || oddsFilters.u15?.trim() || oddsFilters.u25?.trim() || oddsFilters.u35?.trim() || oddsFilters.u45?.trim()
      filterLabel = 'ALT'
      filterValue = uFilter || null
    }

    // Tolerans aralığını hesapla
    if (filterKey && filterValue) {
      const baseValue = Number(filterValue.replace(',', '.'))
      if (!Number.isNaN(baseValue)) {
        const plus = tolerancePlus[filterKey] ?? 0
        const minus = toleranceMinus[filterKey] ?? 0
        if (plus > 0 || minus > 0) {
          const min = baseValue - minus * 0.1
          const max = baseValue + plus * 0.1
          const range: number[] = []
          for (let v = min; v <= max; v += 0.1) {
            range.push(Number(v.toFixed(1)))
          }
          toleranceRange = range.map(v => v.toFixed(1)).join(', ')
        }
      }
    }

    let total = 0
    let withResult = 0
    let ms1 = 0
    let msx = 0
    let ms2 = 0
    let over05 = 0
    let under05 = 0
    let over15 = 0
    let under15 = 0
    let over25 = 0
    let under25 = 0
    let over35 = 0
    let under35 = 0
    let over45 = 0
    let under45 = 0
    let kgVar = 0
    let kgYok = 0

    matches.forEach((m) => {
      const h = m.fthg
      const a = m.ftag
      if (h === null || a === null || h === undefined || a === undefined) {
        return
      }
      total += 1
      withResult += 1
      
      // Maç sonucu
      if (h > a) {
        ms1 += 1
      } else if (h < a) {
        ms2 += 1
      } else {
        msx += 1
      }
      
      // Gol çizgileri
      const goals = h + a
      if (goals >= 1) over05 += 1
      else under05 += 1
      if (goals >= 2) over15 += 1
      else under15 += 1
      if (goals >= 3) over25 += 1
      else under25 += 1
      if (goals >= 4) over35 += 1
      else under35 += 1
      if (goals >= 5) over45 += 1
      else under45 += 1
      
      // KG
      if (h > 0 && a > 0) kgVar += 1
      else kgYok += 1
    })

    if (withResult === 0) return null

    const pct = (value: number) => ((value / withResult) * 100).toFixed(1)

    return {
      filterLabel,
      filterValue: filterValue ? Number(filterValue.replace(',', '.')).toFixed(2) : null,
      toleranceRange,
      total,
      withResult,
      ms1,
      msx,
      ms2,
      ms1Rate: pct(ms1),
      msxRate: pct(msx),
      ms2Rate: pct(ms2),
      over05,
      under05,
      over05Rate: pct(over05),
      under05Rate: pct(under05),
      over15,
      under15,
      over15Rate: pct(over15),
      under15Rate: pct(under15),
      over25,
      under25,
      over25Rate: pct(over25),
      under25Rate: pct(under25),
      over35,
      under35,
      over35Rate: pct(over35),
      under35Rate: pct(under35),
      over45,
      under45,
      over45Rate: pct(over45),
      under45Rate: pct(under45),
      kgVar,
      kgYok,
      kgVarRate: pct(kgVar),
      kgYokRate: pct(kgYok)
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
        ms1: number
        msx: number
        ms2: number
        over05: number
        under05: number
        over15: number
        under15: number
        over25: number
        under25: number
        over35: number
        under35: number
        over45: number
        under45: number
        kgVar: number
        kgYok: number
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
          ms1: 0,
          msx: 0,
          ms2: 0,
          over05: 0,
          under05: 0,
          over15: 0,
          under15: 0,
          over25: 0,
          under25: 0,
          over35: 0,
          under35: 0,
          over45: 0,
          under45: 0,
          kgVar: 0,
          kgYok: 0
        })
      }
      const entry = leagueMap.get(league)!
      entry.total += 1
      
      // Maç sonuçları
      if (h > a) {
        entry.ms1 += 1
      } else if (h < a) {
        entry.ms2 += 1
      } else {
        entry.msx += 1
      }
      
      // Gol çizgileri
      const goals = h + a
      if (goals >= 1) entry.over05 += 1
      else entry.under05 += 1
      if (goals >= 2) entry.over15 += 1
      else entry.under15 += 1
      if (goals >= 3) entry.over25 += 1
      else entry.under25 += 1
      if (goals >= 4) entry.over35 += 1
      else entry.under35 += 1
      if (goals >= 5) entry.over45 += 1
      else entry.under45 += 1
      
      // KG
      if (h > 0 && a > 0) entry.kgVar += 1
      else entry.kgYok += 1
    })

    const pct = (value: number, total: number) =>
      total > 0 ? ((value / total) * 100).toFixed(1) : '0.0'

    return Array.from(leagueMap.values())
      .filter(l => l.total > 0)
      .sort((a, b) => b.total - a.total)
      .map(l => ({
        league: l.league,
        total: l.total,
        ms1: l.ms1,
        msx: l.msx,
        ms2: l.ms2,
        ms1Rate: pct(l.ms1, l.total),
        msxRate: pct(l.msx, l.total),
        ms2Rate: pct(l.ms2, l.total),
        over05: l.over05,
        under05: l.under05,
        over05Rate: pct(l.over05, l.total),
        under05Rate: pct(l.under05, l.total),
        over15: l.over15,
        under15: l.under15,
        over15Rate: pct(l.over15, l.total),
        under15Rate: pct(l.under15, l.total),
        over25: l.over25,
        under25: l.under25,
        over25Rate: pct(l.over25, l.total),
        under25Rate: pct(l.under25, l.total),
        over35: l.over35,
        under35: l.under35,
        over35Rate: pct(l.over35, l.total),
        under35Rate: pct(l.under35, l.total),
        over45: l.over45,
        under45: l.under45,
        over45Rate: pct(l.over45, l.total),
        under45Rate: pct(l.under45, l.total),
        kgVar: l.kgVar,
        kgYok: l.kgYok,
        kgVarRate: pct(l.kgVar, l.total),
        kgYokRate: pct(l.kgYok, l.total)
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

  const filterTooltips: Record<string, { title: string; description: string; example: string }> = {
    match: {
      title: 'Maç Filtresi',
      description: 'Takım isimlerine göre arama yapabilirsiniz. Ev sahibi veya deplasman takımının ismini yazabilirsiniz.',
      example: 'Örnek: "Galatasaray", "Real Madrid", "Liverpool"'
    },
    score: {
      title: 'Skor Filtresi',
      description: 'Maç sonucuna göre filtreleme yapabilirsiniz. Skor formatında arama yapın.',
      example: 'Örnek: "2-1", "0-0", "3-2"'
    },
    ms1: {
      title: 'MS1 (Maç Sonucu 1)',
      description: 'Ev sahibi takımın kazanma oranına göre filtreleme yapabilirsiniz. Ev sahibi takımın kazandığı maçları bulur.',
      example: 'Örnek: "2.50" (2.50 oranında ev sahibi kazanan maçlar)'
    },
    msx: {
      title: 'MSX (Maç Sonucu X)',
      description: 'Beraberlik oranına göre filtreleme yapabilirsiniz. Berabere biten maçları bulur.',
      example: 'Örnek: "3.20" (3.20 oranında berabere biten maçlar)'
    },
    ms2: {
      title: 'MS2 (Maç Sonucu 2)',
      description: 'Deplasman takımının kazanma oranına göre filtreleme yapabilirsiniz. Deplasman takımının kazandığı maçları bulur.',
      example: 'Örnek: "2.80" (2.80 oranında deplasman kazanan maçlar)'
    },
    kg_var: {
      title: 'KG Var (Karşılıklı Gol Var)',
      description: 'Her iki takımın da gol attığı maçları bulmak için kullanılır. BTTS (Both Teams To Score) oranına göre filtreleme yapabilirsiniz.',
      example: 'Örnek: "1.85" (1.85 oranında her iki takımın da gol attığı maçlar)'
    },
    kg_yok: {
      title: 'KG Yok (Karşılıklı Gol Yok)',
      description: 'En az bir takımın gol atamadığı maçları bulmak için kullanılır. Karşılıklı gol olmayan maçları filtreler.',
      example: 'Örnek: "1.95" (1.95 oranında karşılıklı gol olmayan maçlar)'
    }
  }

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
    <div className="main-layout">
      {/* Sol Reklam - Desktop Only */}
      <div className="ad-left">
        <ins 
          className="adsbygoogle"
          style={{ display: 'block', minHeight: '250px' }}
          data-ad-client="ca-pub-6962376212093267"
          data-ad-slot="2661289799"
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>

      {/* Ana İçerik */}
      <div className="main-content">
    <div className="container">
      {/* Navbar */}
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
            <a href="/stats" className={pathname === '/stats' ? 'active' : ''}>İstatistik</a>
          </nav>
        </div>
      </nav>

      {/* Banner Reklam Alanı - Boşluk */}
      <div className="banner-space" style={{ height: '100px', width: '100%' }}></div>

      {/* Filter Section */}
      <div className="search-section">
        <div
          className="filter-row"
          style={{
            fontSize: '11px',
            columnGap: '2px',
            display: 'grid',
            gridTemplateColumns: '20% 5% 10% 10% 10% 10% 10% 5% 20%',
            alignItems: 'start'
          }}
        >
          <div className="filter-cell" style={{ minWidth: '200px' }}>
            <div className="filter-label">Lig</div>
            <select
              className="search-input compact filter-league-small"
              value={leagueFilter}
              onChange={(e) => setLeagueFilter(e.target.value)}
              style={{ width: '100%', minWidth: '180px' }}
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
          <div></div>
          <div className="filter-cell" style={{ marginRight: '-2px' }}>
            <div className="filter-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
              Maç
              <div
                data-tooltip-container
                style={{
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setOpenTooltip(openTooltip === 'match' ? null : 'match')
                  }}
                  onMouseEnter={() => setOpenTooltip('match')}
                  onMouseLeave={() => setOpenTooltip(null)}
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: 'rgba(59, 130, 246, 0.2)',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    color: '#60a5fa',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)'
                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.6)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'
                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)'
                  }}
                >
                  ?
                </button>
                {openTooltip === 'match' && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 'calc(100% + 8px)',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      padding: '8px 12px',
                      background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)',
                      border: '1px solid rgba(59, 130, 246, 0.4)',
                      borderRadius: '8px',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                      zIndex: 9999,
                      minWidth: '220px',
                      maxWidth: '280px',
                      fontSize: '11px',
                      lineHeight: 1.5,
                      color: '#d1d5db',
                      pointerEvents: 'auto',
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      whiteSpace: 'normal'
                    }}
                    onMouseEnter={() => setOpenTooltip('match')}
                    onMouseLeave={() => setOpenTooltip(null)}
                  >
                    <div style={{ fontWeight: 600, color: '#60a5fa', marginBottom: '6px', fontSize: '12px' }}>
                      {filterTooltips.match.title}
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      {filterTooltips.match.description}
                    </div>
                    <div style={{ padding: '6px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '4px', fontSize: '10px', color: '#93c5fd' }}>
                      {filterTooltips.match.example}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <input
              className="search-input compact filter-input-short"
              placeholder=""
              value={matchFilter}
              onChange={(e) => setMatchFilter(e.target.value)}
            />
          </div>
          <div className="filter-cell" style={{ marginLeft: '-2px', marginRight: '-2px' }}>
            <div className="filter-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
              Skor
              <div
                data-tooltip-container
                style={{
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setOpenTooltip(openTooltip === 'score' ? null : 'score')
                  }}
                  onMouseEnter={() => setOpenTooltip('score')}
                  onMouseLeave={() => setOpenTooltip(null)}
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: 'rgba(59, 130, 246, 0.2)',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    color: '#60a5fa',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)'
                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.6)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'
                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)'
                  }}
                >
                  ?
                </button>
                {openTooltip === 'score' && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 'calc(100% + 8px)',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      padding: '8px 12px',
                      background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)',
                      border: '1px solid rgba(59, 130, 246, 0.4)',
                      borderRadius: '8px',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                      zIndex: 9999,
                      minWidth: '220px',
                      maxWidth: '280px',
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      whiteSpace: 'normal',
                      pointerEvents: 'auto',
                      fontSize: '11px',
                      lineHeight: 1.5,
                      color: '#d1d5db'
                    }}
                    onMouseEnter={() => setOpenTooltip('score')}
                    onMouseLeave={() => setOpenTooltip(null)}
                  >
                    <div style={{ fontWeight: 600, color: '#60a5fa', marginBottom: '6px', fontSize: '12px' }}>
                      {filterTooltips.score.title}
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      {filterTooltips.score.description}
                    </div>
                    <div style={{ padding: '6px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '4px', fontSize: '10px', color: '#93c5fd' }}>
                      {filterTooltips.score.example}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <input
              className="search-input compact filter-input-short"
              placeholder=""
              value={scoreFilter}
              onChange={(e) => setScoreFilter(e.target.value)}
            />
          </div>
          <div className="filter-cell" style={{ marginLeft: '-2px', marginRight: '-2px' }}>
            <div className="filter-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
              MS1
              <div
                data-tooltip-container
                style={{
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setOpenTooltip(openTooltip === 'ms1' ? null : 'ms1')
                  }}
                  onMouseEnter={() => setOpenTooltip('ms1')}
                  onMouseLeave={() => setOpenTooltip(null)}
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: 'rgba(59, 130, 246, 0.2)',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    color: '#60a5fa',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)'
                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.6)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'
                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)'
                  }}
                >
                  ?
                </button>
                {openTooltip === 'ms1' && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 'calc(100% + 8px)',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      padding: '8px 12px',
                      background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)',
                      border: '1px solid rgba(59, 130, 246, 0.4)',
                      borderRadius: '8px',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                      zIndex: 9999,
                      minWidth: '220px',
                      maxWidth: '280px',
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      whiteSpace: 'normal',
                      pointerEvents: 'auto',
                      fontSize: '11px',
                      lineHeight: 1.5,
                      color: '#d1d5db'
                    }}
                    onMouseEnter={() => setOpenTooltip('ms1')}
                    onMouseLeave={() => setOpenTooltip(null)}
                  >
                    <div style={{ fontWeight: 600, color: '#60a5fa', marginBottom: '6px', fontSize: '12px' }}>
                      {filterTooltips.ms1.title}
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      {filterTooltips.ms1.description}
                    </div>
                    <div style={{ padding: '6px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '4px', fontSize: '10px', color: '#93c5fd' }}>
                      {filterTooltips.ms1.example}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <input
              className="search-input compact filter-input-short"
              placeholder=""
              value={oddsFilters.ms1 || ''}
              onChange={(e) => updateOddsFilter('ms1', e.target.value)}
            />
            <div style={{ display: 'flex', gap: '2px', marginTop: '4px' }}>
              <select
                className="search-input compact"
                style={{ width: '50%', padding: '4px', fontSize: '10px' }}
                value={tolerancePlus['ms1'] ?? 0}
                onChange={(e) => setTolerancePlus(prev => ({ ...prev, ms1: Number(e.target.value) }))}
                title="Üst tolerans"
              >
                {[0, 1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n === 0 ? '+' : `+${n}`}</option>)}
              </select>
              <select
                className="search-input compact"
                style={{ width: '50%', padding: '4px', fontSize: '10px' }}
                value={toleranceMinus['ms1'] ?? 0}
                onChange={(e) => setToleranceMinus(prev => ({ ...prev, ms1: Number(e.target.value) }))}
                title="Alt tolerans"
              >
                {[0, 1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n === 0 ? '-' : `-${n}`}</option>)}
              </select>
          </div>
          </div>
          <div className="filter-cell" style={{ marginLeft: '-2px', marginRight: '-2px' }}>
            <div className="filter-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
              MSX
              <div
                data-tooltip-container
                style={{
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setOpenTooltip(openTooltip === 'msx' ? null : 'msx')
                  }}
                  onMouseEnter={() => setOpenTooltip('msx')}
                  onMouseLeave={() => setOpenTooltip(null)}
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: 'rgba(59, 130, 246, 0.2)',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    color: '#60a5fa',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)'
                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.6)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'
                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)'
                  }}
                >
                  ?
                </button>
                {openTooltip === 'msx' && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 'calc(100% + 8px)',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      padding: '8px 12px',
                      background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)',
                      border: '1px solid rgba(59, 130, 246, 0.4)',
                      borderRadius: '8px',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                      zIndex: 9999,
                      minWidth: '220px',
                      maxWidth: '280px',
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      whiteSpace: 'normal',
                      pointerEvents: 'auto',
                      fontSize: '11px',
                      lineHeight: 1.5,
                      color: '#d1d5db'
                    }}
                    onMouseEnter={() => setOpenTooltip('msx')}
                    onMouseLeave={() => setOpenTooltip(null)}
                  >
                    <div style={{ fontWeight: 600, color: '#60a5fa', marginBottom: '6px', fontSize: '12px' }}>
                      {filterTooltips.msx.title}
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      {filterTooltips.msx.description}
                    </div>
                    <div style={{ padding: '6px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '4px', fontSize: '10px', color: '#93c5fd' }}>
                      {filterTooltips.msx.example}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <input
              className="search-input compact filter-input-short"
              placeholder=""
              value={oddsFilters.msx || ''}
              onChange={(e) => updateOddsFilter('msx', e.target.value)}
            />
            <div style={{ display: 'flex', gap: '2px', marginTop: '4px' }}>
              <select
                className="search-input compact"
                style={{ width: '50%', padding: '4px', fontSize: '10px' }}
                value={tolerancePlus['msx'] ?? 0}
                onChange={(e) => setTolerancePlus(prev => ({ ...prev, msx: Number(e.target.value) }))}
                title="Üst tolerans"
              >
                {[0, 1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n === 0 ? '+' : `+${n}`}</option>)}
              </select>
              <select
                className="search-input compact"
                style={{ width: '50%', padding: '4px', fontSize: '10px' }}
                value={toleranceMinus['msx'] ?? 0}
                onChange={(e) => setToleranceMinus(prev => ({ ...prev, msx: Number(e.target.value) }))}
                title="Alt tolerans"
              >
                {[0, 1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n === 0 ? '-' : `-${n}`}</option>)}
              </select>
          </div>
          </div>
          <div className="filter-cell" style={{ marginLeft: '-2px' }}>
            <div className="filter-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
              MS2
              <div
                data-tooltip-container
                style={{
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setOpenTooltip(openTooltip === 'ms2' ? null : 'ms2')
                  }}
                  onMouseEnter={() => setOpenTooltip('ms2')}
                  onMouseLeave={() => setOpenTooltip(null)}
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: 'rgba(59, 130, 246, 0.2)',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    color: '#60a5fa',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)'
                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.6)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'
                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)'
                  }}
                >
                  ?
                </button>
                {openTooltip === 'ms2' && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 'calc(100% + 8px)',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      padding: '8px 12px',
                      background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)',
                      border: '1px solid rgba(59, 130, 246, 0.4)',
                      borderRadius: '8px',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                      zIndex: 9999,
                      minWidth: '220px',
                      maxWidth: '280px',
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      whiteSpace: 'normal',
                      pointerEvents: 'auto',
                      fontSize: '11px',
                      lineHeight: 1.5,
                      color: '#d1d5db'
                    }}
                    onMouseEnter={() => setOpenTooltip('ms2')}
                    onMouseLeave={() => setOpenTooltip(null)}
                  >
                    <div style={{ fontWeight: 600, color: '#60a5fa', marginBottom: '6px', fontSize: '12px' }}>
                      {filterTooltips.ms2.title}
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      {filterTooltips.ms2.description}
                    </div>
                    <div style={{ padding: '6px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '4px', fontSize: '10px', color: '#93c5fd' }}>
                      {filterTooltips.ms2.example}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <input
              className="search-input compact filter-input-short"
              placeholder=""
              value={oddsFilters.ms2 || ''}
              onChange={(e) => updateOddsFilter('ms2', e.target.value)}
            />
            <div style={{ display: 'flex', gap: '2px', marginTop: '4px' }}>
              <select
                className="search-input compact"
                style={{ width: '50%', padding: '4px', fontSize: '10px' }}
                value={tolerancePlus['ms2'] ?? 0}
                onChange={(e) => setTolerancePlus(prev => ({ ...prev, ms2: Number(e.target.value) }))}
                title="Üst tolerans"
              >
                {[0, 1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n === 0 ? '+' : `+${n}`}</option>)}
              </select>
              <select
                className="search-input compact"
                style={{ width: '50%', padding: '4px', fontSize: '10px' }}
                value={toleranceMinus['ms2'] ?? 0}
                onChange={(e) => setToleranceMinus(prev => ({ ...prev, ms2: Number(e.target.value) }))}
                title="Alt tolerans"
              >
                {[0, 1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n === 0 ? '-' : `-${n}`}</option>)}
              </select>
          </div>
          </div>
          <div></div>
          <div className="filter-cell" style={{ minWidth: '200px', maxWidth: '100%' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', columnGap: '20px', alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <div className="filter-label" style={{ textAlign: 'center', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                  KG Var
                  <div
                    data-tooltip-container
              style={{
                      position: 'relative',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenTooltip(openTooltip === 'kg_var' ? null : 'kg_var')
                      }}
                      onMouseEnter={() => setOpenTooltip('kg_var')}
                      onMouseLeave={() => setOpenTooltip(null)}
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: 'rgba(59, 130, 246, 0.2)',
                        border: '1px solid rgba(59, 130, 246, 0.4)',
                        color: '#60a5fa',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)'
                        e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.6)'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'
                        e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)'
                      }}
                    >
                      ?
                    </button>
                    {openTooltip === 'kg_var' && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 'calc(100% + 8px)',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          padding: '8px 12px',
                          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)',
                          border: '1px solid rgba(59, 130, 246, 0.4)',
                          borderRadius: '8px',
                          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                          zIndex: 9999,
                          minWidth: '220px',
                          maxWidth: '280px',
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word',
                          whiteSpace: 'normal',
                          pointerEvents: 'auto',
                          fontSize: '11px',
                          lineHeight: 1.5,
                          color: '#d1d5db'
                        }}
                        onMouseEnter={() => setOpenTooltip('kg_var')}
                        onMouseLeave={() => setOpenTooltip(null)}
                      >
                        <div style={{ fontWeight: 600, color: '#60a5fa', marginBottom: '6px', fontSize: '12px' }}>
                          {filterTooltips.kg_var.title}
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                          {filterTooltips.kg_var.description}
                        </div>
                        <div style={{ padding: '6px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '4px', fontSize: '10px', color: '#93c5fd' }}>
                          {filterTooltips.kg_var.example}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <input
                  className="search-input compact filter-input-short"
                  placeholder=""
                  value={oddsFilters.kg_var || ''}
                  onChange={(e) => updateOddsFilter('kg_var', e.target.value)}
                  style={{ width: '100%' }}
                />
                <div style={{ display: 'flex', gap: '2px', marginTop: '4px', width: '100%' }}>
                  <select
                    className="search-input compact"
                    style={{ width: '50%', padding: '4px', fontSize: '10px' }}
                    value={tolerancePlus['kg_var'] ?? 0}
                    onChange={(e) => setTolerancePlus(prev => ({ ...prev, kg_var: Number(e.target.value) }))}
                    title="Üst tolerans"
                  >
                    {[0, 1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n === 0 ? '+' : `+${n}`}</option>)}
                  </select>
                  <select
                    className="search-input compact"
                    style={{ width: '50%', padding: '4px', fontSize: '10px' }}
                    value={toleranceMinus['kg_var'] ?? 0}
                    onChange={(e) => setToleranceMinus(prev => ({ ...prev, kg_var: Number(e.target.value) }))}
                    title="Alt tolerans"
                  >
                    {[0, 1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n === 0 ? '-' : `-${n}`}</option>)}
                  </select>
              </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <div className="filter-label" style={{ textAlign: 'center', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                  KG Yok
                  <div
                    data-tooltip-container
              style={{
                      position: 'relative',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenTooltip(openTooltip === 'kg_yok' ? null : 'kg_yok')
                      }}
                      onMouseEnter={() => setOpenTooltip('kg_yok')}
                      onMouseLeave={() => setOpenTooltip(null)}
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: 'rgba(59, 130, 246, 0.2)',
                        border: '1px solid rgba(59, 130, 246, 0.4)',
                        color: '#60a5fa',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)'
                        e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.6)'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'
                        e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)'
                      }}
                    >
                      ?
                    </button>
                    {openTooltip === 'kg_yok' && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 'calc(100% + 8px)',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          padding: '8px 12px',
                          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)',
                          border: '1px solid rgba(59, 130, 246, 0.4)',
                          borderRadius: '8px',
                          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                          zIndex: 9999,
                          minWidth: '220px',
                          maxWidth: '280px',
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word',
                          whiteSpace: 'normal',
                          pointerEvents: 'auto',
                          fontSize: '11px',
                          lineHeight: 1.5,
                          color: '#d1d5db'
                        }}
                        onMouseEnter={() => setOpenTooltip('kg_yok')}
                        onMouseLeave={() => setOpenTooltip(null)}
                      >
                        <div style={{ fontWeight: 600, color: '#60a5fa', marginBottom: '6px', fontSize: '12px' }}>
                          {filterTooltips.kg_yok.title}
              </div>
                        <div style={{ marginBottom: '8px' }}>
                          {filterTooltips.kg_yok.description}
              </div>
                        <div style={{ padding: '6px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '4px', fontSize: '10px', color: '#93c5fd' }}>
                          {filterTooltips.kg_yok.example}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <input
                  className="search-input compact filter-input-short"
                  placeholder=""
                  value={oddsFilters.kg_yok || ''}
                  onChange={(e) => updateOddsFilter('kg_yok', e.target.value)}
                  style={{ width: '100%' }}
                />
                <div style={{ display: 'flex', gap: '2px', marginTop: '4px', width: '100%' }}>
                  <select
                    className="search-input compact"
                    style={{ width: '50%', padding: '4px', fontSize: '10px' }}
                    value={tolerancePlus['kg_yok'] ?? 0}
                    onChange={(e) => setTolerancePlus(prev => ({ ...prev, kg_yok: Number(e.target.value) }))}
                    title="Üst tolerans"
                  >
                    {[0, 1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n === 0 ? '+' : `+${n}`}</option>)}
                  </select>
                  <select
                    className="search-input compact"
                    style={{ width: '50%', padding: '4px', fontSize: '10px' }}
                    value={toleranceMinus['kg_yok'] ?? 0}
                    onChange={(e) => setToleranceMinus(prev => ({ ...prev, kg_yok: Number(e.target.value) }))}
                    title="Alt tolerans"
                  >
                    {[0, 1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n === 0 ? '-' : `-${n}`}</option>)}
                  </select>
              </div>
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
              gap: '6px',
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
                  padding: '3px 5px',
                  borderRadius: '5px',
                  backgroundColor: '#020617',
                  minWidth: '80px'
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '10px' }}>{item.bahis}</div>
                <div style={{ fontSize: '8px', lineHeight: 1.1, color: '#9ca3af', textAlign: 'center' }}>
                  {item.aciklama}
                </div>
                <input
                  className="search-input compact filter-input-short"
                  placeholder=""
                  value={(oddsFilters as any)[item.key] || ''}
                  onChange={(e) => updateOddsFilter(item.key as keyof OddsFilters, e.target.value)}
                  style={{ padding: '3px', fontSize: '10px' }}
                />
                <div style={{ display: 'flex', gap: '2px', marginTop: '3px', width: '100%' }}>
                  <select
                    className="search-input compact"
                    style={{ width: '50%', padding: '3px', fontSize: '9px' }}
                    value={tolerancePlus[item.key] ?? 0}
                    onChange={(e) => setTolerancePlus(prev => ({ ...prev, [item.key]: Number(e.target.value) }))}
                    title="Üst tolerans"
                  >
                    {[0, 1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n === 0 ? '+' : `+${n}`}</option>)}
                  </select>
                  <select
                    className="search-input compact"
                    style={{ width: '50%', padding: '3px', fontSize: '9px' }}
                    value={toleranceMinus[item.key] ?? 0}
                    onChange={(e) => setToleranceMinus(prev => ({ ...prev, [item.key]: Number(e.target.value) }))}
                    title="Alt tolerans"
                  >
                    {[0, 1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n === 0 ? '-' : `-${n}`}</option>)}
                  </select>
                </div>
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
              setTolerancePlus({})
              setToleranceMinus({})
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
            
            // MS1, MSX, MS2 tutmuş sayılarına göre sırala
            const results = [
              { type: 'ms1', hit: s.ms1Hit, color: '#022c22', borderColor: '#064e3b', textColor: '#a7f3d0' },
              { type: 'msx', hit: s.msxHit, color: '#451a03', borderColor: '#78350f', textColor: '#fbbf24' },
              { type: 'ms2', hit: s.ms2Hit, color: '#1e3a8a', borderColor: '#3b82f6', textColor: '#60a5fa' }
            ].sort((a, b) => b.hit - a.hit)
            
            // En çok tutan yeşil, en az kırmızı, ortadaki mavi
            results[0].color = '#022c22'
            results[0].borderColor = '#064e3b'
            results[0].textColor = '#22c55e'
            if (results.length > 1) {
              results[results.length - 1].color = '#7f1d1d'
              results[results.length - 1].borderColor = '#991b1b'
              results[results.length - 1].textColor = '#ef4444'
            }
            if (results.length > 2) {
              results[1].color = '#1e3a8a'
              results[1].borderColor = '#3b82f6'
              results[1].textColor = '#60a5fa'
            }
            
            const ms1Card = results.find(r => r.type === 'ms1') || results[0]
            const msxCard = results.find(r => r.type === 'msx') || results[1]
            const ms2Card = results.find(r => r.type === 'ms2') || results[2]
            
            return (
              <>
                {/* Toplam lig ve maç sayısı */}
                <div style={{ 
                  marginBottom: '16px', 
                  padding: '16px', 
                  borderRadius: '6px', 
                  backgroundColor: '#111827',
                  border: '1px solid #1f2937',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '4px' }}>
                    Toplam <strong style={{ color: '#e5e7eb' }}>{s.totalLeagues}</strong> lig
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#facc15' }}>
                    {formatInt(s.total)} maç
                  </div>
                </div>
                
                {/* Üst satır: MS1, MSX, MS2 */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(130px, 1.5fr) repeat(3, minmax(100px, 1fr))',
                    columnGap: '12px',
                    rowGap: '6px',
                    alignItems: 'stretch',
                    marginBottom: '12px'
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
                      {s.activeFilters && s.activeFilters.length > 0 ? (
                        <>
                          {s.activeFilters.join(', ')} <span style={{ color: '#facc15' }}>oranları</span>
                        </>
                      ) : s.odd ? (
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

                  {/* MS1 kartı */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      background: `linear-gradient(to bottom right, ${ms1Card.color}, #020617)`,
                      border: `1px solid ${ms1Card.borderColor}`
                    }}
                  >
                    <div style={{ fontSize: '11px', color: ms1Card.textColor }}>Maç Sonucu (MS1)</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                      <span>Tutmuş</span>
                      <span>
                        <strong>{formatInt(s.ms1Hit)}</strong> ({s.ms1HitRate}%)
                      </span>
                    </div>
                  </div>

                  {/* MSX kartı */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      background: `linear-gradient(to bottom right, ${msxCard.color}, #020617)`,
                      border: `1px solid ${msxCard.borderColor}`
                    }}
                  >
                    <div style={{ fontSize: '11px', color: msxCard.textColor }}>Maç Sonucu (MSX)</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                      <span>Tutmuş</span>
                      <span>
                        <strong>{formatInt(s.msxHit)}</strong> ({s.msxHitRate}%)
                      </span>
                    </div>
                  </div>

                  {/* MS2 kartı */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      background: `linear-gradient(to bottom right, ${ms2Card.color}, #020617)`,
                      border: `1px solid ${ms2Card.borderColor}`
                    }}
                  >
                    <div style={{ fontSize: '11px', color: ms2Card.textColor }}>Maç Sonucu (MS2)</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                      <span>Tutmuş</span>
                      <span>
                        <strong>{formatInt(s.ms2Hit)}</strong> ({s.ms2HitRate}%)
                      </span>
                    </div>
                    </div>
                    </div>

                {/* Alt satır: Goller ve KG */}
                <div
                  style={{
                    padding: '12px',
                    borderRadius: '6px',
                    background: 'linear-gradient(to bottom right, #111827, #020617)',
                    border: '1px solid #1f2937',
                    marginBottom: getMs1LeagueStats().length > 0 ? '10px' : 0
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#93c5fd', marginBottom: '12px', fontWeight: 600 }}>Goller & KG</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                    {/* 0.5 ÜST - tek kutucuk içinde 3 sütun */}
                    <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: '#111827', border: '1px solid #1f2937' }}>
                      <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '6px', fontWeight: 600, textAlign: 'center' }}>0.5 ÜST</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '9px', color: '#9ca3af', marginBottom: '2px' }}>Genel</div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e5e7eb', marginBottom: '2px' }}>
                            {formatInt(s.over05)}
                          </div>
                          <div style={{ fontSize: '9px', color: '#9ca3af' }}>({s.over05Rate}%)</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '9px', color: '#9ca3af', marginBottom: '2px' }}>Dep</div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e5e7eb', marginBottom: '2px' }}>
                            {formatInt(s.over05Dep)}
                          </div>
                          <div style={{ fontSize: '9px', color: '#9ca3af' }}>({s.over05DepRate}%)</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '9px', color: '#9ca3af', marginBottom: '2px' }}>Ev</div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e5e7eb', marginBottom: '2px' }}>
                            {formatInt(s.over05Ev)}
                          </div>
                          <div style={{ fontSize: '9px', color: '#9ca3af' }}>({s.over05EvRate}%)</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* 1.5 ÜST - tek kutucuk içinde 3 sütun */}
                    <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: '#111827', border: '1px solid #1f2937' }}>
                      <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '6px', fontWeight: 600, textAlign: 'center' }}>1.5 ÜST</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '9px', color: '#9ca3af', marginBottom: '2px' }}>Genel</div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e5e7eb', marginBottom: '2px' }}>
                            {formatInt(s.over15)}
                          </div>
                          <div style={{ fontSize: '9px', color: '#9ca3af' }}>({s.over15Rate}%)</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '9px', color: '#9ca3af', marginBottom: '2px' }}>Dep</div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e5e7eb', marginBottom: '2px' }}>
                            {formatInt(s.over15Dep)}
                          </div>
                          <div style={{ fontSize: '9px', color: '#9ca3af' }}>({s.over15DepRate}%)</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '9px', color: '#9ca3af', marginBottom: '2px' }}>Ev</div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e5e7eb', marginBottom: '2px' }}>
                            {formatInt(s.over15Ev)}
                          </div>
                          <div style={{ fontSize: '9px', color: '#9ca3af' }}>({s.over15EvRate}%)</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* 2.5 ÜST - tek kutucuk içinde 3 sütun */}
                    <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: '#111827', border: '1px solid #1f2937' }}>
                      <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '6px', fontWeight: 600, textAlign: 'center' }}>2.5 ÜST</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '9px', color: '#9ca3af', marginBottom: '2px' }}>Genel</div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e5e7eb', marginBottom: '2px' }}>
                            {formatInt(s.over25)}
                          </div>
                          <div style={{ fontSize: '9px', color: '#9ca3af' }}>({s.over25Rate}%)</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '9px', color: '#9ca3af', marginBottom: '2px' }}>Dep</div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e5e7eb', marginBottom: '2px' }}>
                            {formatInt(s.over25Dep)}
                          </div>
                          <div style={{ fontSize: '9px', color: '#9ca3af' }}>({s.over25DepRate}%)</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '9px', color: '#9ca3af', marginBottom: '2px' }}>Ev</div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e5e7eb', marginBottom: '2px' }}>
                            {formatInt(s.over25Ev)}
                          </div>
                          <div style={{ fontSize: '9px', color: '#9ca3af' }}>({s.over25EvRate}%)</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* KG Var - tek kutucuk içinde 3 sütun */}
                    <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: '#111827', border: '1px solid #1f2937' }}>
                      <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '6px', fontWeight: 600, textAlign: 'center' }}>KG Var</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '9px', color: '#9ca3af', marginBottom: '2px' }}>Genel</div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e5e7eb', marginBottom: '2px' }}>
                            {formatInt(s.kgVar)}
                          </div>
                          <div style={{ fontSize: '9px', color: '#9ca3af' }}>({s.kgVarRate}%)</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '9px', color: '#9ca3af', marginBottom: '2px' }}>Dep</div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e5e7eb', marginBottom: '2px' }}>
                            {formatInt(s.kgVarDep)}
                          </div>
                          <div style={{ fontSize: '9px', color: '#9ca3af' }}>({s.kgVarDepRate}%)</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '9px', color: '#9ca3af', marginBottom: '2px' }}>Ev</div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e5e7eb', marginBottom: '2px' }}>
                            {formatInt(s.kgVarEv)}
                          </div>
                          <div style={{ fontSize: '9px', color: '#9ca3af' }}>({s.kgVarEvRate}%)</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* İY 0.5 ÜST - tek kutucuk içinde 3 sütun */}
                    {s.iyOver05 !== null && s.iyOver05 > 0 && (
                      <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: '#111827', border: '1px solid #1f2937' }}>
                        <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '6px', fontWeight: 600, textAlign: 'center' }}>İY 0.5 ÜST</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '9px', color: '#9ca3af', marginBottom: '2px' }}>Genel</div>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e5e7eb', marginBottom: '2px' }}>
                              {formatInt(s.iyOver05)}
                            </div>
                            <div style={{ fontSize: '9px', color: '#9ca3af' }}>({s.iyOver05Rate}%)</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '9px', color: '#9ca3af', marginBottom: '2px' }}>Dep</div>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e5e7eb', marginBottom: '2px' }}>
                              {formatInt(s.iyOver05Dep)}
                            </div>
                            <div style={{ fontSize: '9px', color: '#9ca3af' }}>({s.iyOver05DepRate}%)</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '9px', color: '#9ca3af', marginBottom: '2px' }}>Ev</div>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e5e7eb', marginBottom: '2px' }}>
                              {formatInt(s.iyOver05Ev)}
                            </div>
                            <div style={{ fontSize: '9px', color: '#9ca3af' }}>({s.iyOver05EvRate}%)</div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* İY KG Var - tek kutucuk içinde 3 sütun */}
                    {s.iyKgVar !== null && s.iyKgVar > 0 && (
                      <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: '#111827', border: '1px solid #1f2937' }}>
                        <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '6px', fontWeight: 600, textAlign: 'center' }}>İY KG Var</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '9px', color: '#9ca3af', marginBottom: '2px' }}>Genel</div>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e5e7eb', marginBottom: '2px' }}>
                              {formatInt(s.iyKgVar)}
                            </div>
                            <div style={{ fontSize: '9px', color: '#9ca3af' }}>({s.iyKgVarRate}%)</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '9px', color: '#9ca3af', marginBottom: '2px' }}>Dep</div>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e5e7eb', marginBottom: '2px' }}>
                              {formatInt(s.iyKgVarDep)}
                            </div>
                            <div style={{ fontSize: '9px', color: '#9ca3af' }}>({s.iyKgVarDepRate}%)</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '9px', color: '#9ca3af', marginBottom: '2px' }}>Ev</div>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e5e7eb', marginBottom: '2px' }}>
                              {formatInt(s.iyKgVarEv)}
                            </div>
                            <div style={{ fontSize: '9px', color: '#9ca3af' }}>({s.iyKgVarEvRate}%)</div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* İY KG Yok - tek kutucuk içinde 3 sütun */}
                    {s.iyKgYok !== null && s.iyKgYok > 0 && (
                      <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: '#111827', border: '1px solid #1f2937' }}>
                        <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '6px', fontWeight: 600, textAlign: 'center' }}>İY KG Yok</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '9px', color: '#9ca3af', marginBottom: '2px' }}>Genel</div>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e5e7eb', marginBottom: '2px' }}>
                              {formatInt(s.iyKgYok)}
                            </div>
                            <div style={{ fontSize: '9px', color: '#9ca3af' }}>({s.iyKgYokRate}%)</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '9px', color: '#9ca3af', marginBottom: '2px' }}>Dep</div>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e5e7eb', marginBottom: '2px' }}>
                              {formatInt(s.iyKgYokDep)}
                            </div>
                            <div style={{ fontSize: '9px', color: '#9ca3af' }}>({s.iyKgYokDepRate}%)</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '9px', color: '#9ca3af', marginBottom: '2px' }}>Ev</div>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e5e7eb', marginBottom: '2px' }}>
                              {formatInt(s.iyKgYokEv)}
                            </div>
                            <div style={{ fontSize: '9px', color: '#9ca3af' }}>({s.iyKgYokEvRate}%)</div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* MS1 KG Var - tek kutucuk içinde 3 sütun */}
                    <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: '#111827', border: '1px solid #1f2937' }}>
                      <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '6px', fontWeight: 600, textAlign: 'center' }}>MS1 KG Var</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '9px', color: '#9ca3af', marginBottom: '2px' }}>Genel</div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e5e7eb', marginBottom: '2px' }}>
                            {formatInt(s.ms1KgVar)}
                          </div>
                          <div style={{ fontSize: '9px', color: '#9ca3af' }}>({s.ms1KgVarRate}%)</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '9px', color: '#9ca3af', marginBottom: '2px' }}>Dep</div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e5e7eb', marginBottom: '2px' }}>
                            {formatInt(s.ms1KgVarDep)}
                          </div>
                          <div style={{ fontSize: '9px', color: '#9ca3af' }}>({s.ms1KgVarDepRate}%)</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '9px', color: '#9ca3af', marginBottom: '2px' }}>Ev</div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e5e7eb', marginBottom: '2px' }}>
                            {formatInt(s.ms1KgVarEv)}
                          </div>
                          <div style={{ fontSize: '9px', color: '#9ca3af' }}>({s.ms1KgVarEvRate}%)</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* MS1 KG Yok - tek kutucuk içinde 3 sütun */}
                    <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: '#111827', border: '1px solid #1f2937' }}>
                      <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '6px', fontWeight: 600, textAlign: 'center' }}>MS1 KG Yok</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '9px', color: '#9ca3af', marginBottom: '2px' }}>Genel</div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e5e7eb', marginBottom: '2px' }}>
                            {formatInt(s.ms1KgYok)}
                          </div>
                          <div style={{ fontSize: '9px', color: '#9ca3af' }}>({s.ms1KgYokRate}%)</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '9px', color: '#9ca3af', marginBottom: '2px' }}>Dep</div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e5e7eb', marginBottom: '2px' }}>
                            {formatInt(s.ms1KgYokDep)}
                          </div>
                          <div style={{ fontSize: '9px', color: '#9ca3af' }}>({s.ms1KgYokDepRate}%)</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '9px', color: '#9ca3af', marginBottom: '2px' }}>Ev</div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e5e7eb', marginBottom: '2px' }}>
                            {formatInt(s.ms1KgYokEv)}
                          </div>
                          <div style={{ fontSize: '9px', color: '#9ca3af' }}>({s.ms1KgYokEvRate}%)</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* MSX KG Var - tek kutucuk içinde 3 sütun */}
                    <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: '#111827', border: '1px solid #1f2937' }}>
                      <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '6px', fontWeight: 600, textAlign: 'center' }}>MSX KG Var</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '9px', color: '#9ca3af', marginBottom: '2px' }}>Genel</div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e5e7eb', marginBottom: '2px' }}>
                            {formatInt(s.msxKgVar)}
                          </div>
                          <div style={{ fontSize: '9px', color: '#9ca3af' }}>({s.msxKgVarRate}%)</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '9px', color: '#9ca3af', marginBottom: '2px' }}>Dep</div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e5e7eb', marginBottom: '2px' }}>
                            {formatInt(s.msxKgVarDep)}
                          </div>
                          <div style={{ fontSize: '9px', color: '#9ca3af' }}>({s.msxKgVarDepRate}%)</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '9px', color: '#9ca3af', marginBottom: '2px' }}>Ev</div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e5e7eb', marginBottom: '2px' }}>
                            {formatInt(s.msxKgVarEv)}
                          </div>
                          <div style={{ fontSize: '9px', color: '#9ca3af' }}>({s.msxKgVarEvRate}%)</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* MSX KG Yok - tek kutucuk içinde 3 sütun */}
                    <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: '#111827', border: '1px solid #1f2937' }}>
                      <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '6px', fontWeight: 600, textAlign: 'center' }}>MSX KG Yok</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '9px', color: '#9ca3af', marginBottom: '2px' }}>Genel</div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e5e7eb', marginBottom: '2px' }}>
                            {formatInt(s.msxKgYok)}
                          </div>
                          <div style={{ fontSize: '9px', color: '#9ca3af' }}>({s.msxKgYokRate}%)</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '9px', color: '#9ca3af', marginBottom: '2px' }}>Dep</div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e5e7eb', marginBottom: '2px' }}>
                            {formatInt(s.msxKgYokDep)}
                          </div>
                          <div style={{ fontSize: '9px', color: '#9ca3af' }}>({s.msxKgYokDepRate}%)</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '9px', color: '#9ca3af', marginBottom: '2px' }}>Ev</div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e5e7eb', marginBottom: '2px' }}>
                            {formatInt(s.msxKgYokEv)}
                          </div>
                          <div style={{ fontSize: '9px', color: '#9ca3af' }}>({s.msxKgYokEvRate}%)</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* MS2 KG Var - tek kutucuk içinde 3 sütun */}
                    <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: '#111827', border: '1px solid #1f2937' }}>
                      <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '6px', fontWeight: 600, textAlign: 'center' }}>MS2 KG Var</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '9px', color: '#9ca3af', marginBottom: '2px' }}>Genel</div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e5e7eb', marginBottom: '2px' }}>
                            {formatInt(s.ms2KgVar)}
                          </div>
                          <div style={{ fontSize: '9px', color: '#9ca3af' }}>({s.ms2KgVarRate}%)</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '9px', color: '#9ca3af', marginBottom: '2px' }}>Dep</div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e5e7eb', marginBottom: '2px' }}>
                            {formatInt(s.ms2KgVarDep)}
                          </div>
                          <div style={{ fontSize: '9px', color: '#9ca3af' }}>({s.ms2KgVarDepRate}%)</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '9px', color: '#9ca3af', marginBottom: '2px' }}>Ev</div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e5e7eb', marginBottom: '2px' }}>
                            {formatInt(s.ms2KgVarEv)}
                          </div>
                          <div style={{ fontSize: '9px', color: '#9ca3af' }}>({s.ms2KgVarEvRate}%)</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* MS2 KG Yok - tek kutucuk içinde 3 sütun */}
                    <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: '#111827', border: '1px solid #1f2937' }}>
                      <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '6px', fontWeight: 600, textAlign: 'center' }}>MS2 KG Yok</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '9px', color: '#9ca3af', marginBottom: '2px' }}>Genel</div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e5e7eb', marginBottom: '2px' }}>
                            {formatInt(s.ms2KgYok)}
                          </div>
                          <div style={{ fontSize: '9px', color: '#9ca3af' }}>({s.ms2KgYokRate}%)</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '9px', color: '#9ca3af', marginBottom: '2px' }}>Dep</div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e5e7eb', marginBottom: '2px' }}>
                            {formatInt(s.ms2KgYokDep)}
                          </div>
                          <div style={{ fontSize: '9px', color: '#9ca3af' }}>({s.ms2KgYokDepRate}%)</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '9px', color: '#9ca3af', marginBottom: '2px' }}>Ev</div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e5e7eb', marginBottom: '2px' }}>
                            {formatInt(s.ms2KgYokEv)}
                          </div>
                          <div style={{ fontSize: '9px', color: '#9ca3af' }}>({s.ms2KgYokEvRate}%)</div>
                        </div>
                      </div>
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
                              minHeight: '500px'
                            }}
                          >
                            {/* Logo Bölümü - %25 */}
                            <div
                              style={{
                                height: '25%',
                                minHeight: '80px',
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
                            
                            {/* İstatistik Bölümü - %75 */}
                            <div
                              style={{
                                height: '75%',
                                padding: '10px 12px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '3px',
                                overflowY: 'auto',
                                fontSize: '10px'
                              }}
                            >
                              <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>
                                Toplam: <strong style={{ color: '#e5e7eb' }}>{formatInt(l.total)}</strong> maç
                          </div>
                              
                              {/* Maç Sonuçları */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: '2px' }}>
                                <span style={{ color: '#9ca3af' }}>MS1:</span>
                                <span style={{ color: '#22c55e', fontWeight: 600 }}>
                                  <strong>{formatInt(l.ms1)}</strong> ({l.ms1Rate}%)
                            </span>
                          </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                                <span style={{ color: '#9ca3af' }}>MSX:</span>
                                <span style={{ color: '#fbbf24', fontWeight: 600 }}>
                                  <strong>{formatInt(l.msx)}</strong> ({l.msxRate}%)
                            </span>
                          </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '4px' }}>
                                <span style={{ color: '#9ca3af' }}>MS2:</span>
                                <span style={{ color: '#3b82f6', fontWeight: 600 }}>
                                  <strong>{formatInt(l.ms2)}</strong> ({l.ms2Rate}%)
                                </span>
                              </div>
                              
                              {/* Gol Çizgileri */}
                              <div style={{ borderTop: '1px solid #1f2937', paddingTop: '4px', marginTop: '2px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                                  <span style={{ color: '#9ca3af' }}>ÜST 0.5:</span>
                                <span style={{ color: '#e5e7eb' }}>
                              <strong>{formatInt(l.over05)}</strong> ({l.over05Rate}%)
                            </span>
                          </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                                  <span style={{ color: '#9ca3af' }}>ALT 0.5:</span>
                                  <span style={{ color: '#e5e7eb' }}>
                                    <strong>{formatInt(l.under05)}</strong> ({l.under05Rate}%)
                                  </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                                  <span style={{ color: '#9ca3af' }}>ÜST 1.5:</span>
                                  <span style={{ color: '#e5e7eb' }}>
                                    <strong>{formatInt(l.over15)}</strong> ({l.over15Rate}%)
                                  </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                                  <span style={{ color: '#9ca3af' }}>ALT 1.5:</span>
                                  <span style={{ color: '#e5e7eb' }}>
                                    <strong>{formatInt(l.under15)}</strong> ({l.under15Rate}%)
                                  </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                                  <span style={{ color: '#9ca3af' }}>ÜST 2.5:</span>
                                <span style={{ color: '#e5e7eb' }}>
                              <strong>{formatInt(l.over25)}</strong> ({l.over25Rate}%)
                            </span>
                          </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                                  <span style={{ color: '#9ca3af' }}>ALT 2.5:</span>
                                <span style={{ color: '#e5e7eb' }}>
                                    <strong>{formatInt(l.under25)}</strong> ({l.under25Rate}%)
                            </span>
                          </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                                  <span style={{ color: '#9ca3af' }}>ÜST 3.5:</span>
                                  <span style={{ color: '#e5e7eb' }}>
                                    <strong>{formatInt(l.over35)}</strong> ({l.over35Rate}%)
                                  </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                                  <span style={{ color: '#9ca3af' }}>ALT 3.5:</span>
                                  <span style={{ color: '#e5e7eb' }}>
                                    <strong>{formatInt(l.under35)}</strong> ({l.under35Rate}%)
                                  </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                                  <span style={{ color: '#9ca3af' }}>ÜST 4.5:</span>
                                  <span style={{ color: '#e5e7eb' }}>
                                    <strong>{formatInt(l.over45)}</strong> ({l.over45Rate}%)
                                  </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '4px' }}>
                                  <span style={{ color: '#9ca3af' }}>ALT 4.5:</span>
                                  <span style={{ color: '#e5e7eb' }}>
                                    <strong>{formatInt(l.under45)}</strong> ({l.under45Rate}%)
                                  </span>
                                </div>
                              </div>
                              
                              {/* KG */}
                              <div style={{ borderTop: '1px solid #1f2937', paddingTop: '4px', marginTop: '2px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                                  <span style={{ color: '#9ca3af' }}>KG Var:</span>
                                  <span style={{ color: '#22c55e', fontWeight: 600 }}>
                                    <strong>{formatInt(l.kgVar)}</strong> ({l.kgVarRate}%)
                                  </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '4px' }}>
                                  <span style={{ color: '#9ca3af' }}>KG Yok:</span>
                                  <span style={{ color: '#ef4444', fontWeight: 600 }}>
                                    <strong>{formatInt(l.kgYok)}</strong> ({l.kgYokRate}%)
                                  </span>
                                </div>
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

      {/* Herhangi bir filtre için detaylı istatistik kutusu */}
      {!loading && matches.length > 0 && getDetailedStats() && !getMs1Stats() && (
        <div
          style={{
            marginTop: '16px',
            padding: '16px',
            borderRadius: '8px',
            backgroundColor: '#020617',
            border: '1px solid #1f2937',
            fontSize: '12px',
            lineHeight: 1.6
          }}
        >
          {(() => {
            const s = getDetailedStats()!
            return (
              <>
                <div style={{ marginBottom: '16px', fontSize: '14px', fontWeight: 600 }}>
                  {s.filterValue ? (
                    <>
                      {s.filterLabel} <span style={{ color: '#facc15' }}>{s.filterValue}</span> oranındaki maçların detaylı analizi
                    </>
                  ) : (
                    <>Seçili maçların detaylı analizi</>
                  )}
                </div>
                
                {s.toleranceRange && (
                  <div style={{ marginBottom: '8px', padding: '8px', borderRadius: '4px', backgroundColor: '#1f2937', fontSize: '11px', color: '#60a5fa' }}>
                    📊 <strong>{s.toleranceRange}</strong> oranları içinden
                  </div>
                )}
                
                <div style={{ marginBottom: '12px', color: '#9ca3af' }}>
                  <strong style={{ color: '#e5e7eb' }}>{formatInt(s.withResult)}</strong> maçın geçmiş performansı
                </div>

                {/* Maç Sonuçları */}
                <div
                  style={{
                    padding: '12px',
                    borderRadius: '6px',
                    backgroundColor: '#111827',
                    border: '1px solid #1f2937',
                    marginBottom: '12px'
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#a7f3d0' }}>
                    Maç Sonuçları
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>MS1 (Ev Sahibi)</div>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#22c55e' }}>
                        {formatInt(s.ms1)} ({s.ms1Rate}%)
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>MSX (Beraberlik)</div>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fbbf24' }}>
                        {formatInt(s.msx)} ({s.msxRate}%)
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>MS2 (Deplasman)</div>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#3b82f6' }}>
                        {formatInt(s.ms2)} ({s.ms2Rate}%)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gol Çizgileri */}
                <div
                  style={{
                    padding: '12px',
                    borderRadius: '6px',
                    backgroundColor: '#111827',
                    border: '1px solid #1f2937',
                    marginBottom: '12px'
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#93c5fd' }}>
                    Gol Çizgileri
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', fontSize: '11px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#9ca3af' }}>0.5 ÜST</span>
                      <span style={{ color: '#e5e7eb' }}>{formatInt(s.over05)} ({s.over05Rate}%)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#9ca3af' }}>0.5 ALT</span>
                      <span style={{ color: '#e5e7eb' }}>{formatInt(s.under05)} ({s.under05Rate}%)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#9ca3af' }}>1.5 ÜST</span>
                      <span style={{ color: '#e5e7eb' }}>{formatInt(s.over15)} ({s.over15Rate}%)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#9ca3af' }}>1.5 ALT</span>
                      <span style={{ color: '#e5e7eb' }}>{formatInt(s.under15)} ({s.under15Rate}%)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#9ca3af' }}>2.5 ÜST</span>
                      <span style={{ color: '#e5e7eb' }}>{formatInt(s.over25)} ({s.over25Rate}%)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#9ca3af' }}>2.5 ALT</span>
                      <span style={{ color: '#e5e7eb' }}>{formatInt(s.under25)} ({s.under25Rate}%)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#9ca3af' }}>3.5 ÜST</span>
                      <span style={{ color: '#e5e7eb' }}>{formatInt(s.over35)} ({s.over35Rate}%)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#9ca3af' }}>3.5 ALT</span>
                      <span style={{ color: '#e5e7eb' }}>{formatInt(s.under35)} ({s.under35Rate}%)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#9ca3af' }}>4.5 ÜST</span>
                      <span style={{ color: '#e5e7eb' }}>{formatInt(s.over45)} ({s.over45Rate}%)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#9ca3af' }}>4.5 ALT</span>
                      <span style={{ color: '#e5e7eb' }}>{formatInt(s.under45)} ({s.under45Rate}%)</span>
                    </div>
                  </div>
                </div>

                {/* KG */}
                <div
                  style={{
                    padding: '12px',
                    borderRadius: '6px',
                    backgroundColor: '#111827',
                    border: '1px solid #1f2937'
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#f472b6' }}>
                    Karşılıklı Gol (KG)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>KG VAR</div>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#22c55e' }}>
                        {formatInt(s.kgVar)} ({s.kgVarRate}%)
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>KG YOK</div>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ef4444' }}>
                        {formatInt(s.kgYok)} ({s.kgYokRate}%)
                      </div>
                    </div>
                  </div>
                </div>
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
                <th>Analiz</th>
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
              </tr>
            </thead>
            <tbody>
              {displayedMatches.map((match) => (
                <tr key={match.match_id}>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
        </div>
      </div>

      {/* Sağ Reklam - Desktop Only */}
      <div className="ad-right">
        <ins 
          className="adsbygoogle"
          style={{ display: 'block', minHeight: '250px' }}
          data-ad-client="ca-pub-6962376212093267"
          data-ad-slot="2661289799"
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  )
}
