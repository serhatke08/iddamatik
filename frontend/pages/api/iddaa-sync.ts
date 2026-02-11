import type { NextApiRequest, NextApiResponse } from 'next'
import { iddaaService } from '@/lib/iddaa-data'

const parseNumber = (value: string | string[] | undefined): number | null => {
  if (!value) return null
  const raw = Array.isArray(value) ? value[0] : value
  if (!raw) return null
  const parsed = Number(raw)
  return Number.isNaN(parsed) ? null : parsed
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ detail: 'Method not allowed' })
    return
  }

  try {
    const limit = parseNumber(req.query.limit) ?? 0
    const { filePath, matches } = await iddaaService.syncToday(limit)
    res.status(200).json({ count: matches.length, filePath })
  } catch (error) {
    res.status(500).json({ detail: `İddaa sync hatası: ${String(error)}` })
  }
}
