import type { NextApiRequest, NextApiResponse } from 'next'
import { csvService } from '@/lib/csv-data'

const parseNumber = (value: string | string[] | undefined): number | null => {
  if (!value) return null
  const raw = Array.isArray(value) ? value[0] : value
  if (!raw) return null
  const parsed = Number(raw)
  return Number.isNaN(parsed) ? null : parsed
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ detail: 'Method not allowed' })
    return
  }

  try {
    const perLeague = parseNumber(req.query.per_league)
    const limit = parseNumber(req.query.limit) ?? 20

    const allMatches = csvService.loadAll()

    if (perLeague && perLeague > 0) {
      const byLeague: Record<string, typeof allMatches> = {}

      for (const match of allMatches) {
        const league = match.league || 'Unknown'
        if (!byLeague[league]) {
          byLeague[league] = []
        }
        byLeague[league].push(match)
      }

      const selected: typeof allMatches = []
      Object.values(byLeague).forEach((leagueMatches) => {
        selected.push(...leagueMatches.slice(0, perLeague))
      })

      selected.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      res.status(200).json(selected)
      return
    }

    const sorted = [...allMatches].sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    res.status(200).json(sorted.slice(0, limit))
  } catch (error) {
    res.status(500).json({ detail: `CSV varsayılan liste hatası: ${String(error)}` })
  }
}
