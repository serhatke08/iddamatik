import type { NextApiRequest, NextApiResponse } from 'next'
import { csvService } from '@/lib/csv-data'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ detail: 'Method not allowed' })
    return
  }

  try {
    const count = csvService.loadAll().length
    // Frontend `page.tsx` bu endpointten `count` bekliyor (dbTotalCount = response.data?.count)
    res.status(200).json({ count })
  } catch (error) {
    res.status(500).json({ detail: `CSV toplam sayım hatası: ${String(error)}` })
  }
}
