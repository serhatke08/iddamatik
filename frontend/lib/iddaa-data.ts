import fs from 'fs'
import path from 'path'
import { format } from 'date-fns'
import { fetchIddaaProgram, IddaaMatch } from './iddaa-scrape'

const defaultDataRoot = path.resolve(process.cwd(), '..', 'data')
const IDDAA_DIR = path.join(defaultDataRoot, 'iddaa')

const ensureDir = () => {
  if (!fs.existsSync(IDDAA_DIR)) {
    fs.mkdirSync(IDDAA_DIR, { recursive: true })
  }
}

const getTodayFile = () => {
  const stamp = format(new Date(), 'yyyy-MM-dd')
  return path.join(IDDAA_DIR, `iddaa-${stamp}.json`)
}

const readMatches = (filePath: string): IddaaMatch[] => {
  if (!fs.existsSync(filePath)) return []
  try {
    const raw = fs.readFileSync(filePath, 'utf8')
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

const writeMatches = (filePath: string, matches: IddaaMatch[]) => {
  ensureDir()
  fs.writeFileSync(filePath, JSON.stringify(matches, null, 2), 'utf8')
}

export const iddaaService = {
  async syncToday(limit = 200) {
    const filePath = getTodayFile()
    const matches = await fetchIddaaProgram(limit)
    writeMatches(filePath, matches)
    return { filePath, matches }
  },

  async getToday(limit = 0) {
    const filePath = getTodayFile()
    const cached = readMatches(filePath)
    const upcoming = cached.filter((match) => match.status !== 'FINISHED')
    if (upcoming.length > 0) {
      return this.sortUpcoming(upcoming, limit)
    }
    const { matches } = await this.syncToday(limit || 1000)
    return this.sortUpcoming(matches.filter((match) => match.status !== 'FINISHED'), limit)
  },

  getMatchById(matchId: string) {
    if (!matchId) return null
    const filePath = getTodayFile()
    const matches = readMatches(filePath)
    return matches.find((m) => String(m.match_id) === String(matchId)) ?? null
  },

  sortUpcoming(matches: IddaaMatch[], limit = 0) {
    const isTurkeyLeague = (league: string) => {
      const normalized = (league || '').toLowerCase()
      return ['turkey', 'türkiye', 'super lig', 'süper lig'].some((token) => normalized.includes(token))
    }

    const sorted = [...matches].sort((a, b) => {
      const aIsTurkey = isTurkeyLeague(a.league || '')
      const bIsTurkey = isTurkeyLeague(b.league || '')
      if (aIsTurkey !== bIsTurkey) return aIsTurkey ? -1 : 1
      const leagueCompare = (a.league || '').localeCompare(b.league || '', 'tr')
      if (leagueCompare !== 0) return leagueCompare
      const dateCompare = (a.date || '').localeCompare(b.date || '')
      if (dateCompare !== 0) return dateCompare
      return (a.time || '').localeCompare(b.time || '')
    })

    if (limit && limit > 0) return sorted.slice(0, limit)
    return sorted
  }
}
