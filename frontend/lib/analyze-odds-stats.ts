import { csvService } from '@/lib/csv-data'
import type { MatchRecord } from '@/lib/csv-data'

const getOddRangeWithTolerance = (odd: number, tolerance: number = 0.05): { min: number; max: number } => ({
  min: Number((odd - tolerance).toFixed(2)),
  max: Number((odd + tolerance).toFixed(2))
})

const isInRange = (value: number, min: number, max: number): boolean => value >= min && value <= max

/** Genel havuz analizi. `preloaded` verilirse CSV tek sefer yüklenmiş kabul edilir (toplu kupon). */
export function getGeneralAnalysis(
  ms1: number,
  msx: number,
  ms2: number,
  preloaded?: MatchRecord[]
) {
  const ms1Range = getOddRangeWithTolerance(ms1, 0.05)
  const msxRange = getOddRangeWithTolerance(msx, 0.05)
  const ms2Range = getOddRangeWithTolerance(ms2, 0.05)

  const allMatches = preloaded ?? csvService.loadAll()

  const ms1Matches: MatchRecord[] = []
  const msxMatches: MatchRecord[] = []
  const ms2Matches: MatchRecord[] = []
  const allPoolMatches = new Set<string>()

  allMatches.forEach((match) => {
    const odds = match.odds || {}
    const ms1Odd = odds.ms1
    const msxOdd = odds.msx
    const ms2Odd = odds.ms2

    if (ms1Odd && isInRange(ms1Odd, ms1Range.min, ms1Range.max)) {
      ms1Matches.push(match)
      allPoolMatches.add(match.match_id)
    }

    if (msxOdd && isInRange(msxOdd, msxRange.min, msxRange.max)) {
      msxMatches.push(match)
      allPoolMatches.add(match.match_id)
    }

    if (ms2Odd && isInRange(ms2Odd, ms2Range.min, ms2Range.max)) {
      ms2Matches.push(match)
      allPoolMatches.add(match.match_id)
    }
  })

  let ms1Hit = 0
  let ms1KgVar = 0
  let ms1KgYok = 0
  let ms1IyKgVar = 0
  let ms1IyKgYok = 0

  ms1Matches.forEach((m) => {
    const h = m.fthg
    const a = m.ftag
    if (h !== null && h !== undefined && a !== null && a !== undefined) {
      if (h > a) ms1Hit++
      if (h > 0 && a > 0) ms1KgVar++
      else ms1KgYok++

      const hthg = m.hthg
      const htag = m.htag
      if (hthg !== null && hthg !== undefined && htag !== null && htag !== undefined) {
        if (hthg > 0 && htag > 0) ms1IyKgVar++
        else ms1IyKgYok++
      }
    }
  })

  let msxHit = 0
  let msxKgVar = 0
  let msxKgYok = 0
  let msxIyKgVar = 0
  let msxIyKgYok = 0

  msxMatches.forEach((m) => {
    const h = m.fthg
    const a = m.ftag
    if (h !== null && h !== undefined && a !== null && a !== undefined) {
      if (h === a) msxHit++
      if (h > 0 && a > 0) msxKgVar++
      else msxKgYok++

      const hthg = m.hthg
      const htag = m.htag
      if (hthg !== null && hthg !== undefined && htag !== null && htag !== undefined) {
        if (hthg > 0 && htag > 0) msxIyKgVar++
        else msxIyKgYok++
      }
    }
  })

  let ms2Hit = 0
  let ms2KgVar = 0
  let ms2KgYok = 0
  let ms2IyKgVar = 0
  let ms2IyKgYok = 0

  ms2Matches.forEach((m) => {
    const h = m.fthg
    const a = m.ftag
    if (h !== null && h !== undefined && a !== null && a !== undefined) {
      if (h < a) ms2Hit++
      if (h > 0 && a > 0) ms2KgVar++
      else ms2KgYok++

      const hthg = m.hthg
      const htag = m.htag
      if (hthg !== null && hthg !== undefined && htag !== null && htag !== undefined) {
        if (hthg > 0 && htag > 0) ms2IyKgVar++
        else ms2IyKgYok++
      }
    }
  })

  const ms1Total = ms1Matches.length
  const msxTotal = msxMatches.length
  const ms2Total = ms2Matches.length

  const poolMatchIds = Array.from(allPoolMatches)
  const poolMatches = allMatches.filter((m) => poolMatchIds.includes(m.match_id))

  let poolTotal = poolMatches.length
  let poolMs1Count = 0
  let poolMsxCount = 0
  let poolMs2Count = 0
  let poolKgVar = 0
  let poolKgYok = 0
  let poolIyKgVar = 0
  let poolIyKgYok = 0
  let poolOver15 = 0
  let poolUnder15 = 0
  let poolOver25 = 0
  let poolUnder25 = 0
  let poolOver35 = 0
  let poolUnder35 = 0
  let poolKgVarOver15 = 0
  let poolKgVarOver25 = 0
  let poolKgVarUnder35 = 0
  let poolIyKgVarCount = 0
  let poolIyTotal = 0
  let poolSecondHalfKgVar = 0
  let poolSecondHalfKgYok = 0
  let poolSecondHalfTotal = 0

  poolMatches.forEach((m) => {
    const h = m.fthg
    const a = m.ftag
    if (h !== null && h !== undefined && a !== null && a !== undefined) {
      if (h > a) poolMs1Count++
      else if (h === a) poolMsxCount++
      else if (h < a) poolMs2Count++

      const totalGoals = h + a
      if (totalGoals >= 2) poolOver15++
      else poolUnder15++
      if (totalGoals >= 3) poolOver25++
      else poolUnder25++
      if (totalGoals >= 4) poolOver35++
      else poolUnder35++

      if (h > 0 && a > 0) {
        poolKgVar++
        if (totalGoals >= 2) poolKgVarOver15++
        if (totalGoals >= 3) poolKgVarOver25++
        if (totalGoals < 4) poolKgVarUnder35++
      } else {
        poolKgYok++
      }

      const hthg = m.hthg
      const htag = m.htag
      if (hthg !== null && hthg !== undefined && htag !== null && htag !== undefined) {
        poolIyTotal++
        if (hthg > 0 && htag > 0) {
          poolIyKgVar++
          poolIyKgVarCount++
        } else {
          poolIyKgYok++
        }

        const secondHalfHome = h - hthg
        const secondHalfAway = a - htag
        if (secondHalfHome >= 0 && secondHalfAway >= 0) {
          poolSecondHalfTotal++
          if (secondHalfHome > 0 && secondHalfAway > 0) {
            poolSecondHalfKgVar++
          } else {
            poolSecondHalfKgYok++
          }
        }
      }
    }
  })

  return {
    ms1: {
      range: `${ms1Range.min.toFixed(2)} - ${ms1Range.max.toFixed(2)}`,
      total: ms1Total,
      hit: ms1Hit,
      rate: ms1Total > 0 ? (ms1Hit / ms1Total) * 100 : 0,
      kgVar: ms1Total > 0 ? (ms1KgVar / ms1Total) * 100 : 0,
      kgYok: ms1Total > 0 ? (ms1KgYok / ms1Total) * 100 : 0,
      iyKgVar: ms1Total > 0 ? (ms1IyKgVar / ms1Total) * 100 : 0,
      iyKgYok: ms1Total > 0 ? (ms1IyKgYok / ms1Total) * 100 : 0
    },
    msx: {
      range: `${msxRange.min.toFixed(2)} - ${msxRange.max.toFixed(2)}`,
      total: msxTotal,
      hit: msxHit,
      rate: msxTotal > 0 ? (msxHit / msxTotal) * 100 : 0,
      kgVar: msxTotal > 0 ? (msxKgVar / msxTotal) * 100 : 0,
      kgYok: msxTotal > 0 ? (msxKgYok / msxTotal) * 100 : 0,
      iyKgVar: msxTotal > 0 ? (msxIyKgVar / msxTotal) * 100 : 0,
      iyKgYok: msxTotal > 0 ? (msxIyKgYok / msxTotal) * 100 : 0
    },
    ms2: {
      range: `${ms2Range.min.toFixed(2)} - ${ms2Range.max.toFixed(2)}`,
      total: ms2Total,
      hit: ms2Hit,
      rate: ms2Total > 0 ? (ms2Hit / ms2Total) * 100 : 0,
      kgVar: ms2Total > 0 ? (ms2KgVar / ms2Total) * 100 : 0,
      kgYok: ms2Total > 0 ? (ms2KgYok / ms2Total) * 100 : 0,
      iyKgVar: ms2Total > 0 ? (ms2IyKgVar / ms2Total) * 100 : 0,
      iyKgYok: ms2Total > 0 ? (ms2IyKgYok / ms2Total) * 100 : 0
    },
    pool: {
      total: poolTotal,
      ms1Rate: poolTotal > 0 ? (poolMs1Count / poolTotal) * 100 : 0,
      msxRate: poolTotal > 0 ? (poolMsxCount / poolTotal) * 100 : 0,
      ms2Rate: poolTotal > 0 ? (poolMs2Count / poolTotal) * 100 : 0,
      kgVar: poolTotal > 0 ? (poolKgVar / poolTotal) * 100 : 0,
      kgYok: poolTotal > 0 ? (poolKgYok / poolTotal) * 100 : 0,
      iyKgVar: poolIyTotal > 0 ? (poolIyKgVar / poolIyTotal) * 100 : 0,
      iyKgYok: poolIyTotal > 0 ? (poolIyKgYok / poolIyTotal) * 100 : 0,
      over15: poolTotal > 0 ? (poolOver15 / poolTotal) * 100 : 0,
      under15: poolTotal > 0 ? (poolUnder15 / poolTotal) * 100 : 0,
      over25: poolTotal > 0 ? (poolOver25 / poolTotal) * 100 : 0,
      under25: poolTotal > 0 ? (poolUnder25 / poolTotal) * 100 : 0,
      over35: poolTotal > 0 ? (poolOver35 / poolTotal) * 100 : 0,
      under35: poolTotal > 0 ? (poolUnder35 / poolTotal) * 100 : 0,
      kgVarOver15: poolKgVar > 0 ? (poolKgVarOver15 / poolKgVar) * 100 : 0,
      kgVarOver25: poolKgVar > 0 ? (poolKgVarOver25 / poolKgVar) * 100 : 0,
      kgVarUnder35: poolKgVar > 0 ? (poolKgVarUnder35 / poolKgVar) * 100 : 0,
      secondHalfKgVar: poolSecondHalfTotal > 0 ? (poolSecondHalfKgVar / poolSecondHalfTotal) * 100 : 0,
      secondHalfKgYok: poolSecondHalfTotal > 0 ? (poolSecondHalfKgYok / poolSecondHalfTotal) * 100 : 0
    }
  }
}
