import { format } from 'date-fns'
import crypto from 'crypto'

export type IddaaMatch = {
  match_id: string
  date: string
  time: string
  /** API event.d — Unix saniye (kickoff anı). Sunucu TZ ile format() yapılmamalı; filtre için kaynak. */
  kickoff_ts?: number
  league: string
  home_team: string
  away_team: string
  odds: Record<string, number>
  score: string
  hthg?: number | null
  htag?: number | null
  status?: 'UPCOMING' | 'LIVE' | 'FINISHED'
  source: 'iddaa'
}

type RawMatch = {
  date: string
  time: string
  league: string
  match: string
  ms1?: string
  msx?: string
  ms2?: string
  kg?: string
  alt?: string
  ust?: string
  iy?: string
  ms?: string
}

const toFloat = (value: string | undefined | null): number | null => {
  if (!value) return null
  const cleaned = value.replace(',', '.').trim()
  const parsed = Number(cleaned)
  return Number.isNaN(parsed) ? null : parsed
}

const toId = (seed: string): string => {
  return `iddaa_${crypto.createHash('sha1').update(seed).digest('hex')}`
}

const parseMatchTeams = (label: string) => {
  const parts = label.split('-').map((part) => part.trim()).filter(Boolean)
  if (parts.length >= 2) {
    return { home: parts[0], away: parts.slice(1).join(' - ') }
  }
  return { home: label.trim(), away: '' }
}

const normalizeLeagueName = (name: string): string => {
  const trimmed = name.trim()
  if (!trimmed) return name
  if (/süper\s*lig/i.test(trimmed) || /super\s*lig/i.test(trimmed)) {
    return 'Turkey — Super Lig'
  }
  return trimmed
}

const buildOdds = (raw: RawMatch): Record<string, number> => {
  const odds: Record<string, number> = {}
  const ms1 = toFloat(raw.ms1)
  const msx = toFloat(raw.msx)
  const ms2 = toFloat(raw.ms2)
  const kg = toFloat(raw.kg)
  const alt = toFloat(raw.alt)
  const ust = toFloat(raw.ust)

  if (ms1 !== null) odds.ms1 = ms1
  if (msx !== null) odds.msx = msx
  if (ms2 !== null) odds.ms2 = ms2

  if (kg !== null) odds.kg_var = kg
  if (alt !== null) odds.u25 = alt
  if (ust !== null) odds.o25 = ust

  return odds
}

/** İddaa zaman damgasını Europe/Istanbul takvim/saatine çevir (Vercel UTC format() hatasını önler). */
function formatKickoffIstanbul(epochSeconds: number): { date: string; time: string } {
  const d = new Date(epochSeconds * 1000)
  const dateFmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Istanbul',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const timeFmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Istanbul',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const dp = Object.fromEntries(dateFmt.formatToParts(d).map((p) => [p.type, p.value])) as Record<string, string>
  const tp = Object.fromEntries(timeFmt.formatToParts(d).map((p) => [p.type, p.value])) as Record<string, string>
  const date = `${dp.day}/${dp.month}/${dp.year}`
  const hour = (tp.hour || '00').padStart(2, '0')
  const minute = (tp.minute || '00').padStart(2, '0')
  return { date, time: `${hour}:${minute}` }
}

const fetchJson = async <T>(url: string, timeoutMs = 15000): Promise<T> => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`)
    }
    return await response.json()
  } finally {
    clearTimeout(timeout)
  }
}

const extractOdds = (markets: any[]) => {
  const odds: Record<string, number> = {}

  const market = (t: number, st: number, sov?: string) =>
    markets.find((m) => m.t === t && m.st === st && (sov ? String(m.sov) === sov : true))

  const market1X2 = market(1, 1)
  if (market1X2?.o?.length) {
    for (const o of market1X2.o) {
      if (o.n === '1') odds.ms1 = o.odd
      if (o.n === '0') odds.msx = o.odd
      if (o.n === '2') odds.ms2 = o.odd
    }
  }

  const marketKg = market(2, 89)
  if (marketKg?.o?.length) {
    for (const o of marketKg.o) {
      if (o.n === 'Var') odds.kg_var = o.odd
      if (o.n === 'Yok') odds.kg_yok = o.odd
    }
  }

  const marketAltUst = market(2, 60, '2.5')
  if (marketAltUst?.o?.length) {
    for (const o of marketAltUst.o) {
      if (o.n === 'Alt') odds.u25 = o.odd
      if (o.n === 'Üst') odds.o25 = o.odd
    }
  }

  const marketIY = market(2, 88)
  if (marketIY?.o?.length) {
    for (const o of marketIY.o) {
      if (o.n === '1') odds.iy1 = o.odd
      if (o.n === '0') odds.iyx = o.odd
      if (o.n === '2') odds.iy2 = o.odd
    }
  }

  return odds
}

export const fetchIddaaProgram = async (limit = 2000): Promise<IddaaMatch[]> => {
  const eventsUrl = 'https://sportsbookv2.iddaa.com/sportsbook/events?st=1&type=0&version=0'
  const competitionsUrl = 'https://sportsbookv2.iddaa.com/sportsbook/competitions'
  const today = format(new Date(), 'dd/MM/yyyy')

  const [eventsResp, competitionsResp] = await Promise.all([
    fetchJson<any>(eventsUrl, 20000),
    fetchJson<any>(competitionsUrl, 20000)
  ])

  const competitions = new Map<number, string>()
  if (Array.isArray(competitionsResp?.data)) {
    for (const comp of competitionsResp.data) {
      competitions.set(Number(comp.i), comp.n || comp.sn || 'Unknown')
    }
  }

  const events = eventsResp?.data?.events ?? []
  const sliceLimit = limit && limit > 0 ? limit : events.length
  const parsed: IddaaMatch[] = events.slice(0, sliceLimit).map((event: any) => {
    const epochSec = typeof event.d === 'number' ? event.d : 0
    const { date, time } =
      epochSec > 0 ? formatKickoffIstanbul(epochSec) : { date: today, time: '' }
    const leagueRaw = competitions.get(Number(event.ci)) || 'Unknown'
    const league = normalizeLeagueName(leagueRaw)
    const home = event.hn || ''
    const away = event.an || ''
    const seed = `${date}-${time}-${league}-${home}-${away}-${event.i}`

    return {
      match_id: toId(seed),
      date,
      time,
      kickoff_ts: epochSec > 0 ? epochSec : undefined,
      league,
      home_team: home,
      away_team: away,
      odds: extractOdds(event.m || []),
      score: '',
      status: event.s === 0 ? 'UPCOMING' : event.s === 1 ? 'LIVE' : 'FINISHED',
      source: 'iddaa'
    }
  })

  return parsed.filter((m) => m.home_team && m.away_team)
}
