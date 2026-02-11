import type { NextApiRequest, NextApiResponse } from 'next'
import { csvService } from '@/lib/csv-data'

const parseNumber = (value: string | string[] | undefined): number | null => {
  if (!value) return null
  const raw = Array.isArray(value) ? value[0] : value
  if (!raw) return null
  const parsed = Number(String(raw).replace(',', '.').trim())
  return Number.isNaN(parsed) ? null : parsed
}

const getQueryValue = (value: string | string[] | undefined): string | null => {
  if (!value) return null
  const raw = Array.isArray(value) ? value[0] : value
  return raw ?? null
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ detail: 'Method not allowed' })
    return
  }

  try {
    const league = getQueryValue(req.query.league)
    const match = getQueryValue(req.query.match)
    const home_team = getQueryValue(req.query.home_team)
    const away_team = getQueryValue(req.query.away_team)
    const score = getQueryValue(req.query.score)
    const kg = getQueryValue(req.query.kg)
    const alt = getQueryValue(req.query.alt)
    const ust = getQueryValue(req.query.ust)
    const iy = getQueryValue(req.query.iy)
    const ms = getQueryValue(req.query.ms)
    const limitParam = getQueryValue(req.query.limit)

    const oddsFilters: Record<string, number> = {}
    const oddsKeys = ['ms1', 'msx', 'ms2', 'o05', 'u05', 'o15', 'u15', 'o25', 'u25', 'o35', 'u35', 'o45', 'u45', 'kg_var', 'kg_yok']

    for (const key of oddsKeys) {
      const val = parseNumber(req.query[key])
      if (val !== null) {
        oddsFilters[key] = val
      }
    }

    const limit = parseNumber(limitParam ?? undefined)
    const effectiveLimit = limit ?? csvService.loadAll().length

    const matches = csvService.filterMatches({
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
      odds_filters: Object.keys(oddsFilters).length ? oddsFilters : null,
      limit: effectiveLimit
    })

    res.status(200).json(matches)
  } catch (error) {
    res.status(500).json({ detail: `CSV filtre hatası: ${String(error)}` })
  }
}
