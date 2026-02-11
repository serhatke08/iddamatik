import type { NextApiRequest, NextApiResponse } from 'next'
import { csvService } from '@/lib/csv-data'

type InputMatch = {
  match_id?: string
  id?: string
  odds?: Record<string, number>
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ detail: 'Method not allowed' })
    return
  }

  try {
    const matches: InputMatch[] = Array.isArray(req.body?.matches) ? req.body.matches : []
    const index = csvService.buildOddsRateIndex()

    const getRate = (key: keyof typeof index, odd: number | undefined) => {
      if (odd === undefined || odd === null || Number.isNaN(odd)) return null
      const target = Number(Number(odd).toFixed(2))
      const entry = index[key].get(target)
      if (!entry || entry.total === 0) return null
      return Math.round((entry.hits / entry.total) * 100)
    }

    const results = matches.map((m) => {
      const odds = m.odds || {}
      const rates = [
        getRate('ms1', odds.ms1),
        getRate('msx', odds.msx),
        getRate('ms2', odds.ms2),
        getRate('kg_var', odds.kg_var),
        getRate('u25', odds.u25),
        getRate('o25', odds.o25)
      ].filter((r): r is number => r !== null && r !== undefined)

      const maxRate = rates.length ? Math.max(...rates) : 0
      return {
        id: m.match_id || m.id || '',
        maxRate
      }
    })

    res.status(200).json({ results })
  } catch (error) {
    res.status(500).json({ detail: `Oran istatistik hatası: ${String(error)}` })
  }
}
