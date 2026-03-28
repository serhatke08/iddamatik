import fs from 'fs'
import path from 'path'
import { format, isValid, parse } from 'date-fns'

export type MatchRecord = {
  match_id: string
  date: string
  time: string
  country: string
  league: string
  season: string
  home_team: string
  away_team: string
  odds: Record<string, number>
  score: string
  fthg?: number | null
  ftag?: number | null
  ftr?: string
  hthg?: number | null
  htag?: number | null
  htr?: string
  referee?: string
  status: string
  source: string
}

type OddsFilters = Record<string, number>

type FilterParams = {
  league?: string | null
  match?: string | null
  home_team?: string | null
  away_team?: string | null
  score?: string | null
  kg?: string | null
  alt?: string | null
  ust?: string | null
  iy?: string | null
  ms?: string | null
  odds_filters?: OddsFilters | null
  tolerance?: number
  tolerance_plus?: Record<string, number> | null
  tolerance_minus?: Record<string, number> | null
  limit?: number
}

const CSV_DATE_FORMATS = ['dd-MM-yy HH:mm', 'dd-MM-yyyy HH:mm']
const GOAL_LINES = [0.5, 1.5, 2.5, 3.5, 4.5]

// Vercel'de çalışması için lib/data klasörünü kullan
// Eğer lib/data yoksa, fallback olarak ../data kullan
const defaultDataRoot = path.resolve(process.cwd(), 'lib', 'data')
const fallbackDataRoot = path.resolve(process.cwd(), '..', 'data')

const getDataDir = (subdir: string) => {
  const primaryPath = path.join(defaultDataRoot, subdir)
  const fallbackPath = path.join(fallbackDataRoot, subdir)
  // Önce lib/data'yı kontrol et, yoksa ../data'yı kullan
  if (fs.existsSync(primaryPath)) {
    return primaryPath
  }
  return fallbackPath
}

const ODDS_DIR = getDataDir('oddss')
const SCORES_DIR = getDataDir('scores')
const LEGACY_RAW_DIR = getDataDir('raw')
const LEGACY_OVERVIEW_DIR = getDataDir('football-data')

let cache: MatchRecord[] = []
let lastMtimes: Record<string, number> = {}

const parseDate = (value: string | undefined | null): string | null => {
  if (!value) return null
  const cleaned = value.trim()
  for (const fmt of CSV_DATE_FORMATS) {
    const parsed = parse(cleaned, fmt, new Date())
    if (isValid(parsed)) {
      return format(parsed, 'dd/MM/yyyy')
    }
  }
  return null
}

const parseTime = (value: string | undefined | null): string => {
  if (!value) return '00:00'
  const cleaned = value.trim()
  for (const fmt of CSV_DATE_FORMATS) {
    const parsed = parse(cleaned, fmt, new Date())
    if (isValid(parsed)) {
      return format(parsed, 'HH:mm')
    }
  }
  return '00:00'
}

const toFloat = (value: string | undefined | null): number | null => {
  if (value === undefined || value === null) return null
  const cleaned = String(value).replace(',', '.').trim()
  if (!cleaned) return null
  const parsed = Number(cleaned)
  return Number.isNaN(parsed) ? null : parsed
}

const toFixed2 = (value: number | undefined | null): number | null => {
  if (value === undefined || value === null || Number.isNaN(value)) return null
  return Number(Number(value).toFixed(2))
}

/** Maç sonucu oranları: birden fazlası seçildiğinde birleşim (OR); diğer bahis oranlarıyla yine VE (AND). */
const MS_ODDS_KEYS = new Set(['ms1', 'msx', 'ms2'])

function matchesOddsFilterKey(
  odds: Record<string, number>,
  key: string,
  value: number,
  params: FilterParams
): boolean {
  if (!(key in odds)) return false
  const target = Number(value)
  const actual = Number(odds[key] ?? 0)
  const plusTol = params.tolerance_plus?.[key] ?? 0
  const minusTol = params.tolerance_minus?.[key] ?? 0

  if (plusTol === 0 && minusTol === 0) {
    const targetFixed = Number(target.toFixed(2))
    const actualFixed = Number(actual.toFixed(2))
    return actualFixed === targetFixed
  }
  const min = Number((target - minusTol * 0.1).toFixed(1))
  const max = Number((target + plusTol * 0.1).toFixed(1))
  const actualRounded = Number(actual.toFixed(1))
  return actualRounded >= min && actualRounded <= max
}

const listCsvFiles = (dir: string): string[] => {
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((file) => file.toLowerCase().endsWith('.csv') && !file.startsWith('.'))
    .map((file) => path.join(dir, file))
}

const getMtimes = (paths: string[]): Record<string, number> => {
  const result: Record<string, number> = {}
  for (const filePath of paths) {
    try {
      result[filePath] = fs.statSync(filePath).mtimeMs
    } catch {
      continue
    }
  }
  return result
}

const needsReload = (): boolean => {
  const files = [
    ...listCsvFiles(ODDS_DIR),
    ...listCsvFiles(SCORES_DIR),
    ...listCsvFiles(LEGACY_RAW_DIR),
    ...listCsvFiles(LEGACY_OVERVIEW_DIR)
  ]
  const current = getMtimes(files)
  const currentKeys = Object.keys(current)
  const lastKeys = Object.keys(lastMtimes)
  if (currentKeys.length !== lastKeys.length) return true
  for (const key of currentKeys) {
    if (current[key] !== lastMtimes[key]) return true
  }
  return false
}

const parseCsv = (content: string): string[][] => {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i]
    const next = content[i + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (!inQuotes && char === ',') {
      row.push(field)
      field = ''
      continue
    }

    if (!inQuotes && (char === '\n' || char === '\r')) {
      if (char === '\r' && next === '\n') {
        i += 1
      }
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      continue
    }

    field += char
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows
}

const rowValue = (row: Record<string, string>, ...keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = row[key]
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return value
    }
  }
  return undefined
}

export const csvService = {
  loadAll(): MatchRecord[] {
    if (!needsReload() && cache.length > 0) {
      return cache
    }

    const matches: MatchRecord[] = []
    const byId: Record<string, MatchRecord> = {}
    const mtimes = getMtimes([
      ...listCsvFiles(ODDS_DIR),
      ...listCsvFiles(SCORES_DIR),
      ...listCsvFiles(LEGACY_RAW_DIR),
      ...listCsvFiles(LEGACY_OVERVIEW_DIR)
    ])

    const oddsFiles = listCsvFiles(ODDS_DIR)
    const fallbackOddsFiles = oddsFiles.length ? [] : listCsvFiles(LEGACY_RAW_DIR)

    for (const csvPath of [...oddsFiles, ...fallbackOddsFiles]) {
      const raw = fs.readFileSync(csvPath, 'utf8')
      const rows = parseCsv(raw)
      if (rows.length === 0) continue

      const headers = rows[0].map((h) => h.replace(/^\uFEFF/, '').trim())
      for (const rowValues of rows.slice(1)) {
        const row: Record<string, string> = {}
        headers.forEach((key, idx) => {
          row[key] = rowValues[idx] ?? ''
        })

        const dateRaw = rowValue(row, 'matchDate', 'maçTarihi', 'macTarihi') ?? ''
        const dateVal = parseDate(dateRaw)
        if (!dateVal) continue
        const timeVal = parseTime(dateRaw)

        const home = (rowValue(row, 'homeTeam', 'ev takımı') ?? '').trim()
        const away = (rowValue(row, 'awayTeam', 'deplasman takımı') ?? '').trim()
        if (!home || !away) continue

        const odds: Record<string, number> = {}
        const mapping: Record<string, string> = {
          H: 'ms1',
          D: 'msx',
          A: 'ms2',
          O05: 'o05',
          U05: 'u05',
          O15: 'o15',
          U15: 'u15',
          O25: 'o25',
          U25: 'u25',
          O35: 'o35',
          U35: 'u35',
          O45: 'o45',
          U45: 'u45',
          BTTSY: 'kg_var',
          BTTSN: 'kg_yok'
        }

        Object.entries(mapping).forEach(([src, dst]) => {
          const val = toFloat(row[src])
          if (val !== null) {
            odds[dst] = val
          }
        })

        const matchId = String(rowValue(row, 'id') ?? `${home}-${away}-${dateVal}-${timeVal}`)
        const country = (rowValue(row, 'Country', 'Ülke') ?? '').trim()
        const leagueRaw = (rowValue(row, 'League', 'Lig') ?? '').trim()
        
        // Lig ismini normalize et - ülke bilgisini kullan
        let league = leagueRaw
        if (country && leagueRaw) {
          // Avrupa kupaları: isim sabit kalsın
          if (leagueRaw === 'Europa League') {
            league = 'Europa League'
          } else if (leagueRaw === 'Champions League' && country === 'Europe') {
            league = 'Champions League' // Europe Champions League -> Champions League
          // Aynı lig ismi farklı ülkelerde varsa ülke bilgisini ekle
          } else if (leagueRaw === 'Premier League') {
            if (country === 'Russia') {
              league = 'Russia Premier League'
            } else if (country === 'England') {
              league = 'Premier League' // İngiltere için sadece Premier League
            } else {
              league = `${country} ${leagueRaw}`
            }
          } else if (leagueRaw === 'Serie A' || leagueRaw === 'Serie A Betano') {
            if (country === 'Brazil') {
              league = 'Brazil Serie A' // Brezilya için "Brazil Serie A"
            } else if (country === 'Italy') {
              league = 'Serie A' // İtalya için sadece Serie A
            } else {
              league = leagueRaw === 'Serie A Betano' ? 'Brazil Serie A' : `${country} ${leagueRaw}`
            }
          } else if (leagueRaw === 'A-League' && country === 'Australia') {
            league = 'A-League' // Australia A-League -> A-League
          } else if (leagueRaw === 'MLS' && country === 'USA') {
            league = 'MLS' // USA MLS -> MLS
          } else if (leagueRaw === 'Premiership' && country === 'Scotland') {
            league = 'Scottish Premiership' // Scotland Premiership -> Scottish Premiership
          }
        }
        
        const match: MatchRecord = {
          match_id: matchId,
          date: dateVal,
          time: timeVal,
          country: country,
          league: league,
          season: (rowValue(row, 'Season', 'Mevsim') ?? '').trim(),
          home_team: home,
          away_team: away,
          odds,
          score: (rowValue(row, 'Score', 'Skor', 'result') ?? '').trim(),
          status: 'PAST',
          source: 'csv'
        }

        byId[matchId] = match
        matches.push(match)
      }
    }

    const scoreFiles = listCsvFiles(SCORES_DIR)
    const fallbackScoreFiles = scoreFiles.length ? [] : listCsvFiles(LEGACY_OVERVIEW_DIR)

    for (const csvPath of [...scoreFiles, ...fallbackScoreFiles]) {
      const raw = fs.readFileSync(csvPath, 'utf8')
      const rows = parseCsv(raw)
      if (rows.length === 0) continue

      const headers = rows[0].map((h) => h.replace(/^\uFEFF/, '').trim())
      for (const rowValues of rows.slice(1)) {
        const row: Record<string, string> = {}
        headers.forEach((key, idx) => {
          row[key] = rowValues[idx] ?? ''
        })

        const matchId = String(rowValue(row, 'id') ?? '').trim()
        if (!matchId) continue

        const dateRaw = rowValue(row, 'matchDate') ?? ''
        const dateVal = parseDate(dateRaw) ?? ''
        const timeVal = parseTime(dateRaw)
        const home = (rowValue(row, 'homeTeam') ?? '').trim()
        const away = (rowValue(row, 'awayTeam') ?? '').trim()
        const fthg = toFloat(rowValue(row, 'FTHG'))
        const ftag = toFloat(rowValue(row, 'FTAG'))
        const ftr = (rowValue(row, 'FTR') ?? '').trim()
        const hthg = toFloat(rowValue(row, '1HHG'))
        const htag = toFloat(rowValue(row, '1HAG'))
        const htr = (rowValue(row, '1HR') ?? '').trim()
        const score = fthg !== null && ftag !== null ? `${fthg}-${ftag}` : ''

        const existing = byId[matchId]
        if (existing) {
          if (score) {
            existing.score = score
            existing.fthg = fthg
            existing.ftag = ftag
            existing.ftr = ftr
          }
          if (hthg !== null && htag !== null) {
            existing.hthg = hthg
            existing.htag = htag
            existing.htr = htr
          }
          existing.referee = (rowValue(row, 'referee') ?? '').trim()
        } else {
          const country = (rowValue(row, 'Country') ?? '').trim()
          const leagueRaw = (rowValue(row, 'League') ?? '').trim()
          
          // Lig ismini normalize et - ülke bilgisini kullan
          let league = leagueRaw
          if (country && leagueRaw) {
            // Avrupa kupaları: isim sabit
            if (leagueRaw === 'Europa League') {
              league = 'Europa League'
            } else if (leagueRaw === 'Champions League' && country === 'Europe') {
              league = 'Champions League'
            // Aynı lig ismi farklı ülkelerde varsa ülke bilgisini ekle
            } else if (leagueRaw === 'Premier League') {
              if (country === 'Russia') {
                league = 'Russia Premier League'
              } else if (country === 'England') {
                league = 'Premier League' // İngiltere için sadece Premier League
              } else {
                league = `${country} ${leagueRaw}`
              }
          } else if (leagueRaw === 'Serie A' || leagueRaw === 'Serie A Betano') {
            if (country === 'Brazil') {
              league = 'Brazil Serie A' // Brezilya için "Brazil Serie A"
            } else if (country === 'Italy') {
              league = 'Serie A' // İtalya için sadece Serie A
            } else {
              league = leagueRaw === 'Serie A Betano' ? 'Brazil Serie A' : `${country} ${leagueRaw}`
            }
            } else if (leagueRaw === 'A-League' && country === 'Australia') {
              league = 'A-League' // Australia A-League -> A-League
            } else if (leagueRaw === 'MLS' && country === 'USA') {
              league = 'MLS' // USA MLS -> MLS
            } else if (leagueRaw === 'Premiership' && country === 'Scotland') {
              league = 'Scottish Premiership' // Scotland Premiership -> Scottish Premiership
            }
          }
          
          const match: MatchRecord = {
            match_id: matchId,
            date: dateVal,
            time: timeVal,
            country: country,
            league: league,
            season: (rowValue(row, 'Season') ?? '').trim(),
            home_team: home,
            away_team: away,
            odds: {},
            score: score,
            fthg,
            ftag,
            ftr,
            hthg,
            htag,
            htr,
            referee: (rowValue(row, 'referee') ?? '').trim(),
            status: 'PAST',
            source: 'csv'
          }
          byId[matchId] = match
          matches.push(match)
        }
      }
    }

    cache = matches
    lastMtimes = mtimes
    return matches
  },

  filterMatches(params: FilterParams): MatchRecord[] {
    const {
      league,
      match,
      home_team,
      away_team,
      score,
      kg,
      alt,
      ust,
      iy,
      ms,
      odds_filters,
      tolerance = 0.01,
      tolerance_plus,
      tolerance_minus,
      limit
    } = params

    const data = this.loadAll()
    const results: MatchRecord[] = []

    for (const m of data) {
      if (league && !m.league.toLowerCase().includes(league.toLowerCase())) continue
      if (match) {
        const combined = `${m.home_team} ${m.away_team}`.toLowerCase()
        if (!combined.includes(match.toLowerCase())) continue
      }
      if (home_team && !m.home_team.toLowerCase().includes(home_team.toLowerCase())) continue
      if (away_team && !m.away_team.toLowerCase().includes(away_team.toLowerCase())) continue
      if (score && !(m.score || '').toLowerCase().includes(score.toLowerCase())) continue
      if (iy && !(m.score || '').toLowerCase().includes(iy.toLowerCase())) continue

      if (ms) {
        const msVal = ms.trim().toLowerCase()
        const ftr = (m.ftr || '').toLowerCase()
        if (['1', 'h'].includes(msVal) && ftr && ftr !== 'h') continue
        if (['x', 'd'].includes(msVal) && ftr && ftr !== 'd') continue
        if (['2', 'a'].includes(msVal) && ftr && ftr !== 'a') continue
        if (!['1', 'h', 'x', 'd', '2', 'a'].includes(msVal)) {
          if (!(m.score || '').toLowerCase().includes(msVal)) continue
        }
      }

      if (odds_filters) {
        const odds = m.odds || {}
        const entries = Object.entries(odds_filters)
        const msEntries = entries.filter(([k]) => MS_ODDS_KEYS.has(k))
        const otherEntries = entries.filter(([k]) => !MS_ODDS_KEYS.has(k))

        let msOk = true
        if (msEntries.length >= 2) {
          msOk = msEntries.some(([key, value]) =>
            matchesOddsFilterKey(odds, key, Number(value), params)
          )
        } else if (msEntries.length === 1) {
          const [key, value] = msEntries[0]
          msOk = matchesOddsFilterKey(odds, key, Number(value), params)
        }

        if (!msOk) continue

        let otherOk = true
        for (const [key, value] of otherEntries) {
          if (!matchesOddsFilterKey(odds, key, Number(value), params)) {
            otherOk = false
            break
          }
        }
        if (!otherOk) continue
      }

      if (kg) {
        const odds = m.odds || {}
        const kgVal = kg.trim().toLowerCase()
        const fthg = m.fthg
        const ftag = m.ftag
        const hasScore = fthg !== undefined && fthg !== null && ftag !== undefined && ftag !== null
        const bothScored = !!(hasScore && fthg > 0 && ftag > 0)

        if (['1', 'var', 'yes', 'true'].includes(kgVal)) {
          if (hasScore) {
            if (!bothScored) continue
          } else if (!('kg_var' in odds)) {
            continue
          }
        } else if (['0', 'yok', 'no', 'false'].includes(kgVal)) {
          if (hasScore) {
            if (bothScored) continue
          } else if (!('kg_yok' in odds)) {
            continue
          }
        } else {
          const kgNum = toFloat(kgVal)
          if (kgNum === null) continue
          if (!('kg_var' in odds)) continue
          if (Math.abs((odds.kg_var ?? 0) - kgNum) > tolerance) continue
        }
      }

      if (alt) {
        const lineVal = toFloat(alt)
        const fthg = m.fthg
        const ftag = m.ftag
        const odds = m.odds || {}
        const hasScore = fthg !== undefined && fthg !== null && ftag !== undefined && ftag !== null
        const isLine = lineVal !== null && GOAL_LINES.includes(lineVal)

        if (hasScore && isLine) {
          const totalGoals = fthg + ftag
          if (totalGoals >= lineVal) continue
        } else if (isLine) {
          const lineMap: Record<number, string> = { 0.5: 'u05', 1.5: 'u15', 2.5: 'u25', 3.5: 'u35', 4.5: 'u45' }
          const key = lineMap[lineVal]
          if (!key || !(key in odds)) continue
        } else if (lineVal !== null) {
          const altKeys = ['u05', 'u15', 'u25', 'u35', 'u45']
          const target = Number(lineVal.toFixed(2))
          const matchesOdd = altKeys.some((key) => {
            if (!(key in odds)) return false
            const value = Number((odds[key] ?? 0).toFixed(2))
            return value === target
          })
          if (!matchesOdd) continue
        } else {
          continue
        }
      }

      if (ust) {
        const lineVal = toFloat(ust)
        const fthg = m.fthg
        const ftag = m.ftag
        const odds = m.odds || {}
        const hasScore = fthg !== undefined && fthg !== null && ftag !== undefined && ftag !== null
        const isLine = lineVal !== null && GOAL_LINES.includes(lineVal)

        if (hasScore && isLine) {
          const totalGoals = fthg + ftag
          if (totalGoals <= lineVal) continue
        } else if (isLine) {
          const lineMap: Record<number, string> = { 0.5: 'o05', 1.5: 'o15', 2.5: 'o25', 3.5: 'o35', 4.5: 'o45' }
          const key = lineMap[lineVal]
          if (!key || !(key in odds)) continue
        } else if (lineVal !== null) {
          const ustKeys = ['o05', 'o15', 'o25', 'o35', 'o45']
          const target = Number(lineVal.toFixed(2))
          const matchesOdd = ustKeys.some((key) => {
            if (!(key in odds)) return false
            const value = Number((odds[key] ?? 0).toFixed(2))
            return value === target
          })
          if (!matchesOdd) continue
        } else {
          continue
        }
      }

      results.push(m)
      // Limit varsa ve limit'e ulaşıldıysa dur
      if (limit && limit > 0 && results.length >= limit) break
    }

    return results
  }
,
  getTodayUpcoming(limit = 20): MatchRecord[] {
    const today = format(new Date(), 'dd/MM/yyyy')
    const matches = this.loadAll()
      .filter((m) => m.date === today && (!m.score || m.score === ''))
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
    return matches.slice(0, limit)
  }
,
  getMatchById(matchId: string): MatchRecord | null {
    if (!matchId) return null
    const data = this.loadAll()
    return data.find((m) => String(m.match_id) === String(matchId)) ?? null
  }
,
  getOddsStatsForOdds(odds: Record<string, number>) {
    const data = this.loadAll()

    const resultFromScore = (m: MatchRecord): 'H' | 'D' | 'A' | null => {
      if (m.fthg === undefined || m.fthg === null || m.ftag === undefined || m.ftag === null) return null
      if (m.fthg > m.ftag) return 'H'
      if (m.fthg < m.ftag) return 'A'
      return 'D'
    }

    const makeStat = (label: string, key: string, isHit: (m: MatchRecord) => boolean) => {
      const target = toFixed2(odds?.[key])
      if (target === null) return null
      let total = 0
      let hits = 0
      for (const m of data) {
        const actual = toFixed2(m.odds?.[key])
        if (actual === null || actual !== target) continue
        const hasScore = m.fthg !== undefined && m.fthg !== null && m.ftag !== undefined && m.ftag !== null
        if (!hasScore) continue
        total += 1
        if (isHit(m)) hits += 1
      }
      return { label, odd: target, total, hits, rate: total ? Math.round((hits / total) * 100) : 0 }
    }

    return [
      makeStat('MS1', 'ms1', (m) => resultFromScore(m) === 'H'),
      makeStat('MSX', 'msx', (m) => resultFromScore(m) === 'D'),
      makeStat('MS2', 'ms2', (m) => resultFromScore(m) === 'A'),
      makeStat('KG Var', 'kg_var', (m) => (m.fthg ?? 0) > 0 && (m.ftag ?? 0) > 0),
      makeStat('Alt 2.5', 'u25', (m) => ((m.fthg ?? 0) + (m.ftag ?? 0)) < 2.5),
      makeStat('Üst 2.5', 'o25', (m) => ((m.fthg ?? 0) + (m.ftag ?? 0)) > 2.5)
    ].filter(Boolean)
  }
,
  buildOddsRateIndex() {
    const data = this.loadAll()
    const index = {
      ms1: new Map<number, { total: number; hits: number }>(),
      msx: new Map<number, { total: number; hits: number }>(),
      ms2: new Map<number, { total: number; hits: number }>(),
      kg_var: new Map<number, { total: number; hits: number }>(),
      u25: new Map<number, { total: number; hits: number }>(),
      o25: new Map<number, { total: number; hits: number }>()
    }

    const resultFromScore = (m: MatchRecord): 'H' | 'D' | 'A' | null => {
      if (m.fthg === undefined || m.fthg === null || m.ftag === undefined || m.ftag === null) return null
      if (m.fthg > m.ftag) return 'H'
      if (m.fthg < m.ftag) return 'A'
      return 'D'
    }

    for (const m of data) {
      const hasScore = m.fthg !== undefined && m.fthg !== null && m.ftag !== undefined && m.ftag !== null
      if (!hasScore) continue
      const result = resultFromScore(m)
      const bothScored = (m.fthg ?? 0) > 0 && (m.ftag ?? 0) > 0
      const totalGoals = (m.fthg ?? 0) + (m.ftag ?? 0)
      const odds = m.odds || {}

      const update = (key: keyof typeof index, hit: boolean) => {
        const target = toFixed2(odds[key])
        if (target === null) return
        const current = index[key].get(target) ?? { total: 0, hits: 0 }
        current.total += 1
        if (hit) current.hits += 1
        index[key].set(target, current)
      }

      update('ms1', result === 'H')
      update('msx', result === 'D')
      update('ms2', result === 'A')
      update('kg_var', bothScored)
      update('u25', totalGoals < 2.5)
      update('o25', totalGoals > 2.5)
    }

    return index
  },
  getOddsStatsForMatch(matchId: string) {
    const match = this.getMatchById(matchId)
    if (!match) return null
    const stats = this.getOddsStatsForOdds(match.odds || {})
    return { match, stats }
  }
}
