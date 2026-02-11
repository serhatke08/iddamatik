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
    const limit = parseNumber(req.query.limit) ?? 20
    const matches = csvService.getTodayUpcoming(limit)
    res.status(200).json(matches)
  } catch (error) {
    res.status(500).json({ detail: `CSV bugün listesi hatası: ${String(error)}` })
  }
}
