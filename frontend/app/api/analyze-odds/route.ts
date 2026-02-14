import { NextResponse } from 'next/server'
import { csvService } from '@/lib/csv-data'

// ±0.05 toleransla oran aralığı oluştur
const getOddRangeWithTolerance = (odd: number, tolerance: number = 0.05): { min: number; max: number } => {
  return {
    min: Number((odd - tolerance).toFixed(2)),
    max: Number((odd + tolerance).toFixed(2))
  }
}

// Oran aralığında mı kontrol et
const isInRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max
}

// Genel İstatistiksel Analiz (Oran Aralığı Bazlı - ±0.05 tolerans)
const getGeneralAnalysis = (ms1: number, msx: number, ms2: number) => {
  const ms1Range = getOddRangeWithTolerance(ms1, 0.05)
  const msxRange = getOddRangeWithTolerance(msx, 0.05)
  const ms2Range = getOddRangeWithTolerance(ms2, 0.05)

  const allMatches = csvService.loadAll()
  
  // Her oran aralığı için maçları bul
  const ms1Matches: any[] = []
  const msxMatches: any[] = []
  const ms2Matches: any[] = []
  const allPoolMatches = new Set<string>() // Toplam havuz için unique match_id'ler

  allMatches.forEach(match => {
    const odds = match.odds || {}
    const ms1Odd = odds.ms1
    const msxOdd = odds.msx
    const ms2Odd = odds.ms2

    // MS1 aralığında mı?
    if (ms1Odd && isInRange(ms1Odd, ms1Range.min, ms1Range.max)) {
      ms1Matches.push(match)
      allPoolMatches.add(match.match_id)
    }

    // MSX aralığında mı?
    if (msxOdd && isInRange(msxOdd, msxRange.min, msxRange.max)) {
      msxMatches.push(match)
      allPoolMatches.add(match.match_id)
    }

    // MS2 aralığında mı?
    if (ms2Odd && isInRange(ms2Odd, ms2Range.min, ms2Range.max)) {
      ms2Matches.push(match)
      allPoolMatches.add(match.match_id)
    }
  })

  // MS1 başarı analizi
  let ms1Total = ms1Matches.length
  let ms1Hit = 0
  let ms1KgVar = 0
  let ms1KgYok = 0
  let ms1IyKgVar = 0
  let ms1IyKgYok = 0

  ms1Matches.forEach(m => {
    const h = m.fthg
    const a = m.ftag
    if (h !== null && h !== undefined && a !== null && a !== undefined) {
      if (h > a) ms1Hit++ // Ev sahibi kazandı
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

  // MSX başarı analizi
  let msxTotal = msxMatches.length
  let msxHit = 0
  let msxKgVar = 0
  let msxKgYok = 0
  let msxIyKgVar = 0
  let msxIyKgYok = 0

  msxMatches.forEach(m => {
    const h = m.fthg
    const a = m.ftag
    if (h !== null && h !== undefined && a !== null && a !== undefined) {
      if (h === a) msxHit++ // Beraberlik
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

  // MS2 başarı analizi
  let ms2Total = ms2Matches.length
  let ms2Hit = 0
  let ms2KgVar = 0
  let ms2KgYok = 0
  let ms2IyKgVar = 0
  let ms2IyKgYok = 0

  ms2Matches.forEach(m => {
    const h = m.fthg
    const a = m.ftag
    if (h !== null && h !== undefined && a !== null && a !== undefined) {
      if (h < a) ms2Hit++ // Deplasman kazandı
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

  // Toplam havuz analizi (tüm maçlar birleşik)
  const poolMatchIds = Array.from(allPoolMatches)
  const poolMatches = allMatches.filter(m => poolMatchIds.includes(m.match_id))
  
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

  poolMatches.forEach(m => {
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
        
        // 2. yarı KG analizi (maç sonu - ilk yarı)
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

// Derinlemesine Analiz (Net Oranlar - ±0.01 Toleransla Havuz)
// Her oran için ayrı ayrı maçları bul, hepsini birleştir, havuzdaki maçların MS1/MSX/MS2 başarı yüzdelerini hesapla
const getDeepAnalysis = (ms1: number, msx: number, ms2: number) => {
  const allMatches = csvService.loadAll()
  
  // Her oran için ±0.01 toleransla maçları bul
  const ms1Matches = new Set<string>() // match_id'leri tutmak için
  const msxMatches = new Set<string>()
  const ms2Matches = new Set<string>()
  
  allMatches.forEach(m => {
    const odds = m.odds || {}
    const mMs1 = odds.ms1
    const mMsx = odds.msx
    const mMs2 = odds.ms2
    
    // MS1=2.07 (±0.01) olan maçlar
    if (mMs1 && Math.abs(mMs1 - ms1) <= 0.01) {
      ms1Matches.add(m.match_id)
    }
    
    // MSX=2.77 (±0.01) olan maçlar
    if (mMsx && Math.abs(mMsx - msx) <= 0.01) {
      msxMatches.add(m.match_id)
    }
    
    // MS2=3.09 (±0.01) olan maçlar
    if (mMs2 && Math.abs(mMs2 - ms2) <= 0.01) {
      ms2Matches.add(m.match_id)
    }
  })
  
  // Tüm maçları birleştir (havuz)
  const poolMatchIds = new Set<string>()
  ms1Matches.forEach(id => poolMatchIds.add(id))
  msxMatches.forEach(id => poolMatchIds.add(id))
  ms2Matches.forEach(id => poolMatchIds.add(id))
  
  // Havuzdaki maçları al
  const poolMatches = allMatches.filter(m => poolMatchIds.has(m.match_id))
  
  let total = poolMatches.length
  let ms1Hit = 0
  let msxHit = 0
  let ms2Hit = 0
  let kgVar = 0
  let kgYok = 0
  let iyKgVar = 0
  let iyKgYok = 0

  poolMatches.forEach(m => {
    const h = m.fthg
    const a = m.ftag
    if (h !== null && h !== undefined && a !== null && a !== undefined) {
      // Maç sonucuna göre MS1/MSX/MS2 başarısı
      if (h > a) ms1Hit++      // Ev sahibi kazandı
      else if (h === a) msxHit++ // Beraberlik
      else if (h < a) ms2Hit++   // Deplasman kazandı
      
      // KG VAR/YOK
      if (h > 0 && a > 0) kgVar++
      else kgYok++
      
      // İlk Yarı KG VAR/YOK
      const hthg = m.hthg
      const htag = m.htag
      if (hthg !== null && hthg !== undefined && htag !== null && htag !== undefined) {
        if (hthg > 0 && htag > 0) iyKgVar++
        else iyKgYok++
      }
    }
  })

  return {
    total,
    ms1Count: ms1Matches.size,  // MS1=2.07 olan maç sayısı
    msxCount: msxMatches.size,   // MSX=2.77 olan maç sayısı
    ms2Count: ms2Matches.size,   // MS2=3.09 olan maç sayısı
    ms1Rate: total > 0 ? (ms1Hit / total) * 100 : 0,
    msxRate: total > 0 ? (msxHit / total) * 100 : 0,
    ms2Rate: total > 0 ? (ms2Hit / total) * 100 : 0,
    kgVar: total > 0 ? (kgVar / total) * 100 : 0,
    kgYok: total > 0 ? (kgYok / total) * 100 : 0,
    iyKgVar: total > 0 ? (iyKgVar / total) * 100 : 0,
    iyKgYok: total > 0 ? (iyKgYok / total) * 100 : 0
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { odds } = body

    if (!odds) {
      return NextResponse.json(
        { error: 'Odds are required' },
        { status: 400 }
      )
    }

    // MS1, MSX, MS2 oranlarını al
    const ms1 = typeof odds.H === 'number' ? odds.H : (typeof odds.ms1 === 'number' ? odds.ms1 : null)
    const msx = typeof odds.D === 'number' ? odds.D : (typeof odds.msx === 'number' ? odds.msx : null)
    const ms2 = typeof odds.A === 'number' ? odds.A : (typeof odds.ms2 === 'number' ? odds.ms2 : null)

    if (!ms1 || !msx || !ms2) {
      return NextResponse.json(
        { error: 'MS1, MSX, MS2 odds are required' },
        { status: 400 }
      )
    }

    // Genel İstatistiksel Analiz (Oran Aralığı Bazlı - ±0.05)
    const generalAnalysis = getGeneralAnalysis(ms1, msx, ms2)

    // Derinlemesine Analiz (Net Oranlar)
    const deepAnalysis = getDeepAnalysis(ms1, msx, ms2)

    // Yorum & Sonuç - Detaylı Analiz
    const highestRate = Math.max(
      generalAnalysis.ms1.rate,
      generalAnalysis.msx.rate,
      generalAnalysis.ms2.rate
    )
    
    let dominantResult = 'MS1'
    if (generalAnalysis.msx.rate === highestRate) dominantResult = 'MSX'
    else if (generalAnalysis.ms2.rate === highestRate) dominantResult = 'MS2'

    const isKgRisky = generalAnalysis.pool.kgVar < 50
    const isFavored = ms1 < 2.0
    const pool = generalAnalysis.pool

    // Detaylı yorumlar oluştur
    const comments: string[] = []
    
    // İlk yarı KG analizi
    if (pool.iyKgVar > 0) {
      if (pool.iyKgVar < 30) {
        comments.push(`⚽ İlk yarıda KG oranı düşük (%${pool.iyKgVar.toFixed(1)}), genellikle 2. yarıda gol beklenir.`)
      } else if (pool.iyKgVar > 60) {
        comments.push(`⚽ İlk yarıda KG oranı yüksek (%${pool.iyKgVar.toFixed(1)}), erken gol beklentisi güçlü.`)
      } else {
        comments.push(`⚽ İlk yarıda KG oranı dengeli (%${pool.iyKgVar.toFixed(1)}).`)
      }
    }

    // 2. yarı KG analizi
    if (pool.secondHalfKgVar > 0) {
      if (pool.secondHalfKgVar < 30) {
        comments.push(`⚽ 2. yarıda KG oranı düşük (%${pool.secondHalfKgVar.toFixed(1)}), genellikle tek takım gol atar.`)
      } else if (pool.secondHalfKgVar > 60) {
        comments.push(`⚽ 2. yarıda KG oranı yüksek (%${pool.secondHalfKgVar.toFixed(1)}), karşılıklı gol ihtimali güçlü.`)
      }
    }

    // KG VAR + Gol çizgisi kombinasyonları
    if (pool.kgVar > 0) {
      if (pool.kgVarOver15 >= 80) {
        comments.push(`📊 KG VAR olan maçlarda %${pool.kgVarOver15.toFixed(1)} oranında 1.5 ÜST görülmüş.`)
      }
      if (pool.kgVarOver25 >= 60) {
        comments.push(`📊 KG VAR olan maçlarda %${pool.kgVarOver25.toFixed(1)} oranında 2.5 ÜST görülmüş.`)
      }
      if (pool.kgVarUnder35 >= 70) {
        comments.push(`📊 KG VAR olan maçlarda %${pool.kgVarUnder35.toFixed(1)} oranında 3.5 ALT görülmüş (genellikle 2-3 gol).`)
      }
    }

    // Gol çizgisi analizi
    if (pool.over25 >= 60) {
      comments.push(`🎯 2.5 ÜST oranı yüksek (%${pool.over25.toFixed(1)}), gol beklentisi güçlü.`)
    } else if (pool.under25 >= 60) {
      comments.push(`🎯 2.5 ALT oranı yüksek (%${pool.under25.toFixed(1)}), az gol beklenir.`)
    }

    // Genel öneri
    let recommendation = ''
    if (isFavored) {
      if (highestRate > 60) {
        recommendation = 'Güçlü favori, yüksek başarı oranı. Ancak dikkatli olun, sürprizler olabilir.'
      } else if (highestRate > 50) {
        recommendation = 'Favori ama riskli. İstatistiksel avantaj var ama garantili değil.'
      } else {
        recommendation = 'Favori görünse de istatistikler zayıf. Sürprize açık maç.'
      }
    } else {
      if (highestRate > 50) {
        recommendation = 'Dengeli maç, istatistiksel avantaj var. Ancak sonuç belirsiz.'
      } else {
        recommendation = 'Sürprize açık maç. İstatistiksel olarak net bir favori yok.'
      }
    }

    const comment = {
      dominantResult,
      dominantRate: highestRate,
      isKgRisky,
      isFavored,
      recommendation,
      detailedComments: comments,
      stats: {
        iyKgVar: pool.iyKgVar,
        secondHalfKgVar: pool.secondHalfKgVar,
        kgVarOver15: pool.kgVarOver15,
        kgVarOver25: pool.kgVarOver25,
        kgVarUnder35: pool.kgVarUnder35,
        over25: pool.over25,
        under25: pool.under25
      }
    }

    return NextResponse.json({
      generalAnalysis,
      deepAnalysis,
      comment,
      odds: { ms1, msx, ms2 }
    })
  } catch (error: any) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: error.message || 'Analysis error' },
      { status: 500 }
    )
  }
}
