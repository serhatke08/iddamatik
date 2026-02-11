import type { NextApiRequest, NextApiResponse } from 'next'
import { csvService } from '@/lib/csv-data'
import { iddaaService } from '@/lib/iddaa-data'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ detail: 'Method not allowed' })
    return
  }

  const { id } = req.query

  if (!id || typeof id !== 'string') {
    res.status(400).json({ detail: 'Match ID required' })
    return
  }

  try {
    let data = csvService.getOddsStatsForMatch(id)
    
    if (!data) {
      const iddaaMatch = iddaaService.getMatchById(id)
      if (iddaaMatch) {
        data = {
          match: iddaaMatch,
          stats: csvService.getOddsStatsForOdds(iddaaMatch.odds || {})
        }
      }
    }

    if (!data) {
      res.status(404).json({ detail: 'Match not found' })
      return
    }

    res.status(200).json(data)
  } catch (error) {
    res.status(500).json({ detail: `Match API error: ${String(error)}` })
  }
}
