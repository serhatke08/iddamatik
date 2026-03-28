import { NextResponse } from 'next/server'
import { csvService } from '@/lib/csv-data'
import { getGeneralAnalysis } from '@/lib/analyze-odds-stats'

/** Tek CSV okuma + toplu havuz analizi; maç başına ayrı HTTP yok. */
const MAX_ITEMS = 200

type BatchItem = {
  match_id: string
  odds: Record<string, number>
}

function extractMs(odds: Record<string, number>) {
  const ms1 = typeof odds.H === 'number' ? odds.H : (typeof odds.ms1 === 'number' ? odds.ms1 : null)
  const msx = typeof odds.D === 'number' ? odds.D : (typeof odds.msx === 'number' ? odds.msx : null)
  const ms2 = typeof odds.A === 'number' ? odds.A : (typeof odds.ms2 === 'number' ? odds.ms2 : null)
  return { ms1, msx, ms2 }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const items = body.items as BatchItem[] | undefined
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'items dizisi gerekli' }, { status: 400 })
    }

    const slice = items.slice(0, MAX_ITEMS)
    const allMatches = csvService.loadAll()

    const results = slice.map((item) => {
      const { ms1, msx, ms2 } = extractMs(item.odds || {})
      if (ms1 === null || msx === null || ms2 === null || !ms1 || !msx || !ms2) {
        return { match_id: item.match_id, ok: false as const, error: 'missing_ms' }
      }
      const generalAnalysis = getGeneralAnalysis(ms1, msx, ms2, allMatches)
      return { match_id: item.match_id, ok: true as const, generalAnalysis }
    })

    return NextResponse.json({
      results,
      truncated: items.length > MAX_ITEMS,
      maxItems: MAX_ITEMS,
      analyzed: results.length
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Batch analiz hatası'
    console.error('[analyze-coupon-batch]', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
