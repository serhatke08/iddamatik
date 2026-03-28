import { NextResponse } from 'next/server'
import { csvService } from '@/lib/csv-data'
import { getGeneralAnalysis } from '@/lib/analyze-odds-stats'

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
