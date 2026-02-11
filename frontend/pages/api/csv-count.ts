import type { NextApiRequest, NextApiResponse } from 'next'
import { csvService } from '@/lib/csv-data'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ detail: 'Method not allowed' })
    return
  }

  try {
    const total = csvService.loadAll().length
    res.status(200).json({ total })
  } catch (error) {
    res.status(500).json({ detail: `CSV toplam sayım hatası: ${String(error)}` })
  }
}
