import type { NextApiRequest, NextApiResponse } from 'next'
import { csvService } from '@/lib/csv-data'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ detail: 'Method not allowed' })
    return
  }

  try {
    const matches = csvService.loadAll()
    const leagues = new Set<string>()
    
    for (const match of matches) {
      if (match.league && match.league.trim()) {
        leagues.add(match.league.trim())
      }
    }
    
    const sortedLeagues = Array.from(leagues).sort((a, b) => 
      a.localeCompare(b, 'tr', { sensitivity: 'base' })
    )
    
    res.status(200).json(sortedLeagues)
  } catch (error) {
    res.status(500).json({ detail: `Lig listesi hatası: ${String(error)}` })
  }
}
