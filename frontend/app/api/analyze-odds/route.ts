import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// JSON dosyalarını yükle
const loadAnalysisData = () => {
  try {
    // Vercel'de çalışması için hem public/data hem de fallback olarak root/data kontrol et
    const publicGroupedPath = path.join(process.cwd(), 'public', 'data', 'league_odds_analysis_grouped_filtered.json')
    const publicDetailedPath = path.join(process.cwd(), 'public', 'data', 'league_odds_analysis_filtered.json')
    
    // Önce public/data'yı kontrol et
    let groupedPath = publicGroupedPath
    let detailedPath = publicDetailedPath
    
    if (!fs.existsSync(publicGroupedPath)) {
      // Fallback: root/data klasörünü kontrol et
      const rootGroupedPath = path.join(process.cwd(), '..', 'data', 'league_odds_analysis_grouped_filtered.json')
      const rootDetailedPath = path.join(process.cwd(), '..', 'data', 'league_odds_analysis_filtered.json')
      
      if (fs.existsSync(rootGroupedPath)) {
        groupedPath = rootGroupedPath
        detailedPath = rootDetailedPath
      }
    }
    
    if (!fs.existsSync(groupedPath) || !fs.existsSync(detailedPath)) {
      console.error('Analysis JSON files not found:', { groupedPath, detailedPath })
      return { groupedData: null, detailedData: null }
    }
    
    const groupedData = JSON.parse(fs.readFileSync(groupedPath, 'utf-8'))
    const detailedData = JSON.parse(fs.readFileSync(detailedPath, 'utf-8'))
    
    return { groupedData, detailedData }
  } catch (error) {
    console.error('Error loading analysis data:', error)
    return { groupedData: null, detailedData: null }
  }
}

// Lig ismini normalize et
const normalizeLeagueName = (leagueName: string): string => {
  const nameMap: Record<string, string> = {
    'Süper Lig': 'Super Lig',
    'Super Lig': 'Super Lig',
    'Premiership': 'Scottish Premiership',
    'Serie A Betano': 'Serie A',
    'Serie A': 'Serie A',
    'Russia Premier League': 'Russia Premier League',
    'Brazil Serie A': 'Brazil Serie A',
    'Premier League': 'Premier League',
    'LaLiga': 'LaLiga',
    'Bundesliga': 'Bundesliga',
    'Ligue 1': 'Ligue 1',
    'Eredivisie': 'Eredivisie',
    'Liga Portugal': 'Liga Portugal',
    'Champions League': 'Champions League',
    'UEFA Champions League': 'Champions League',
    'Scottish Premiership': 'Scottish Premiership',
    'MLS': 'MLS',
    'A-League': 'A-League'
  }
  
  // Eğer tam eşleşme yoksa, kısmi eşleşme dene
  if (nameMap[leagueName]) {
    return nameMap[leagueName]
  }
  
  // Kısmi eşleşme
  const lower = leagueName.toLowerCase()
  if (lower.includes('super lig') || lower.includes('süper lig')) return 'Super Lig'
  if (lower.includes('premier league') && !lower.includes('scotland') && !lower.includes('russia')) return 'Premier League'
  if (lower.includes('serie a') && !lower.includes('brazil')) return 'Serie A'
  if (lower.includes('laliga') || lower.includes('la liga')) return 'LaLiga'
  if (lower.includes('bundesliga')) return 'Bundesliga'
  if (lower.includes('ligue 1') || lower.includes('ligue1')) return 'Ligue 1'
  if (lower.includes('eredivisie')) return 'Eredivisie'
  if (lower.includes('portugal')) return 'Liga Portugal'
  if (lower.includes('champions league')) return 'Champions League'
  if (lower.includes('scotland') || lower.includes('premiership')) return 'Scottish Premiership'
  if (lower.includes('mls')) return 'MLS'
  if (lower.includes('a-league')) return 'A-League'
  if (lower.includes('brazil') && lower.includes('serie')) return 'Brazil Serie A'
  if (lower.includes('russia')) return 'Russia Premier League'
  
  return leagueName
}

// Oranı aralığa çevir (gruplanmış analiz için)
const getOddRange = (odd: number): string => {
  if (odd < 1.0) {
    const lower = Math.floor(odd * 100) / 100
    const upper = lower + 0.009
    return `${lower.toFixed(2)}-${upper.toFixed(2)}`
  } else if (odd < 2.0) {
    const lower = Math.floor(odd * 10) / 10
    const upper = lower + 0.09
    return `${lower.toFixed(1)}-${upper.toFixed(1)}`
  } else if (odd < 5.0) {
    const lower = Math.floor(odd * 10) / 10
    const upper = lower + 0.09
    return `${lower.toFixed(1)}-${upper.toFixed(1)}`
  } else if (odd < 10.0) {
    const lower = Math.floor(odd * 2) / 2
    const upper = lower + 0.49
    return `${lower.toFixed(1)}-${upper.toFixed(1)}`
  } else {
    const lower = Math.floor(odd)
    const upper = lower + 0.99
    return `${lower.toFixed(0)}-${upper.toFixed(0)}`
  }
}

// En yakın oranı bul
const findClosestOdd = (targetOdd: number, odds: Record<string, any>): { odd: string; data: any } | null => {
  // TS'in Object.entries + daraltma kombinasyonunda "never" hatası vermemesi için
  // burada bilinçli olarak `any` kullanıyoruz; runtime mantık zaten güvenli.
  let closest: any = null
  
  Object.entries(odds).forEach(([oddStr, data]) => {
    // Aralık formatından ortalama değeri çıkar
    let oddValue: number
    if (oddStr.includes('-')) {
      const [lower, upper] = oddStr.split('-').map(Number)
      oddValue = (lower + upper) / 2
    } else {
      oddValue = parseFloat(oddStr)
    }
    
    if (!isNaN(oddValue)) {
      const diff = Math.abs(targetOdd - oddValue)
      if (!closest || diff < closest.diff) {
        closest = { odd: oddStr, data, diff }
      }
    }
  })
  
  return closest ? { odd: closest.odd, data: closest.data } : null
}

// Tüm liglerden toplu veri topla (gruplanmış)
const aggregateGroupedData = (groupedData: any, betType: string, oddRange: string) => {
  let total = 0
  let hit = 0
  
  if (!groupedData?.hierarchical) return null
  
  Object.values(groupedData.hierarchical).forEach((league: any) => {
    const bet = league?.[betType]
    const oddData = bet?.odds?.[oddRange]
    if (oddData) {
      total += oddData.total || 0
      hit += oddData.hit || 0
    }
  })
  
  if (total === 0) return null
  
  return {
    total,
    hit,
    rate: (hit / total) * 100
  }
}

// Belirli bir oran için ±0.01 toleransla veri topla (örn: 2.13 → 2.12, 2.13, 2.14)
// Detaylı JSON dosyasını kullanarak tam oranları bul
const aggregateDataWithTolerance = (detailedData: any, betType: string, targetOdd: number) => {
  let total = 0
  let hit = 0
  
  if (!detailedData?.hierarchical) return null
  
  // ±0.01 tolerans: targetOdd-0.01, targetOdd, targetOdd+0.01
  const oddVariants = [
    (targetOdd - 0.01).toFixed(2),
    targetOdd.toFixed(2),
    (targetOdd + 0.01).toFixed(2)
  ]
  
  Object.values(detailedData.hierarchical).forEach((league: any) => {
    const bet = league?.[betType]
    if (!bet?.odds) return
    
    // Detaylı JSON'da oranlar tam sayı formatında (örn: "2.13") veya aralık formatında olabilir
    oddVariants.forEach(oddStr => {
      // Tam eşleşme ara
      const exactMatch = bet.odds[oddStr]
      if (exactMatch) {
        total += exactMatch.total || 0
        hit += exactMatch.hit || 0
      }
      
      // Aralık formatında da ara (örn: "2.1-2.2" içinde 2.13 varsa)
      Object.keys(bet.odds).forEach(rangeKey => {
        if (rangeKey.includes('-')) {
          const [lower, upper] = rangeKey.split('-').map(Number)
          const oddValue = parseFloat(oddStr)
          if (oddValue >= lower && oddValue <= upper) {
            const rangeData = bet.odds[rangeKey]
            if (rangeData) {
              total += rangeData.total || 0
              hit += rangeData.hit || 0
            }
          }
        }
      })
    })
  })
  
  if (total === 0) return null
  
  return {
    total,
    hit,
    rate: (hit / total) * 100
  }
}

// Tüm liglerden toplu veri topla (detaylı)
const aggregateDetailedData = (detailedData: any, betType: string, targetOdd: number) => {
  const allOdds: Record<string, any> = {}
  
  if (!detailedData?.hierarchical) return null
  
  Object.values(detailedData.hierarchical).forEach((league: any) => {
    const bet = league?.[betType]
    if (bet?.odds) {
      Object.entries(bet.odds).forEach(([oddStr, data]: [string, any]) => {
        if (!allOdds[oddStr]) {
          allOdds[oddStr] = { total: 0, hit: 0, rate: 0 }
        }
        allOdds[oddStr].total += data.total || 0
        allOdds[oddStr].hit += data.hit || 0
      })
    }
  })
  
  // Rate hesapla
  Object.keys(allOdds).forEach(oddStr => {
    const data = allOdds[oddStr]
    if (data.total > 0) {
      data.rate = (data.hit / data.total) * 100
    }
  })
  
  if (Object.keys(allOdds).length === 0) return null
  
  return findClosestOdd(targetOdd, allOdds)
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

    const { groupedData, detailedData } = loadAnalysisData()
    
    if (!groupedData || !detailedData) {
      return NextResponse.json(
        { error: 'Analysis data not found' },
        { status: 500 }
      )
    }
    
    // Bahis türleri mapping
    const betTypeMap: Record<string, string> = {
      'H': 'MS1',
      'D': 'MSX',
      'A': 'MS2',
      'BTTSY': 'KG VAR',
      'BTTSN': 'KG YOK',
      'O05': 'ÜST 0.5',
      'U05': 'ALT 0.5',
      'O15': 'ÜST 1.5',
      'U15': 'ALT 1.5',
      'O25': 'ÜST 2.5',
      'U25': 'ALT 2.5',
      'O35': 'ÜST 3.5',
      'U35': 'ALT 3.5',
      'O45': 'ÜST 4.5',
      'U45': 'ALT 4.5'
    }

    const analysis: any[] = []
    let totalSuperficial = 0
    let totalDeep = 0
    let count = 0

    // MS1, MSX, MS2 için özel birleşik hesaplama
    const msOdds: { key: string; betType: string; odd: number }[] = []
    if (odds.H && typeof odds.H === 'number') msOdds.push({ key: 'H', betType: 'MS1', odd: odds.H })
    if (odds.D && typeof odds.D === 'number') msOdds.push({ key: 'D', betType: 'MSX', odd: odds.D })
    if (odds.A && typeof odds.A === 'number') msOdds.push({ key: 'A', betType: 'MS2', odd: odds.A })

    // MS1, MSX, MS2 birleşik hesaplama
    if (msOdds.length > 0) {
      let msTotal = 0
      let msHit = 0
      const msOddsList: string[] = []

      msOdds.forEach(({ betType, odd }) => {
        // ±0.01 toleransla veri topla (detaylı JSON'dan)
        const result = aggregateDataWithTolerance(detailedData, betType, odd)
        if (result) {
          msTotal += result.total
          msHit += result.hit
          msOddsList.push(`${betType} ${odd.toFixed(2)}`)
        }
      })

      if (msTotal > 0) {
        const msCombinedRate = (msHit / msTotal) * 100
        analysis.push({
          betType: 'MS1/MSX/MS2',
          betKey: 'MS_COMBINED',
          odd: msOdds.map(m => m.odd).join('/'),
          oddRange: msOdds.map(m => `${(m.odd - 0.01).toFixed(2)}-${(m.odd + 0.01).toFixed(2)}`).join(', '),
          superficial: {
            total: msTotal,
            hit: msHit,
            rate: msCombinedRate
          },
          deep: null,
          explanation: `MS1, MSX, MS2 birleşik analizi:\n\n📊 Toplam maç: ${msTotal.toLocaleString()}\n   • Tutmuş: ${msHit.toLocaleString()} maç (${msCombinedRate.toFixed(2)}%)\n   • Yatmış: ${(msTotal - msHit).toLocaleString()} maç (${(100 - msCombinedRate).toFixed(2)}%)\n\n💡 Bu analiz, MS1 (${msOdds.find(m => m.betType === 'MS1')?.odd.toFixed(2) || 'N/A'}), MSX (${msOdds.find(m => m.betType === 'MSX')?.odd.toFixed(2) || 'N/A'}), MS2 (${msOdds.find(m => m.betType === 'MS2')?.odd.toFixed(2) || 'N/A'}) oranlarının ±0.01 toleransla birleşik istatistiğidir.`
        })
        totalSuperficial += msCombinedRate
        count++
      }
    }

    // Diğer bahis türleri için normal analiz (KG, ÜST/ALT, vs.)
    Object.entries(odds).forEach(([betKey, oddValue]) => {
      // MS1, MSX, MS2'yi atla, çünkü yukarıda birleşik hesapladık
      if (betKey === 'H' || betKey === 'D' || betKey === 'A') return
      
      if (typeof oddValue !== 'number' || isNaN(oddValue)) return

      const betType = betTypeMap[betKey]
      if (!betType) {
        return
      }

      // Gruplanmış analiz (Yüzeysel) - TÜM LİGLERDEN
      const groupedOddRange = getOddRange(oddValue)
      const groupedResult = aggregateGroupedData(groupedData, betType, groupedOddRange)

      // Detaylı analiz (Derinlemesine) - TÜM LİGLERDEN
      const detailedResult = aggregateDetailedData(detailedData, betType, oddValue)

      // Her zaman ekle, veri yoksa 0 göster
      const superficialRate = groupedResult?.rate || 0
      const deepRate = detailedResult?.data?.rate || 0

      totalSuperficial += superficialRate
      totalDeep += deepRate
      count++

        analysis.push({
          betType,
          betKey,
          odd: oddValue,
          oddRange: groupedOddRange,
          superficial: {
            total: groupedResult?.total || 0,
            hit: groupedResult?.hit || 0,
            rate: superficialRate
          },
          deep: detailedResult ? {
            odd: detailedResult.odd,
            total: detailedResult.data.total || 0,
            hit: detailedResult.data.hit || 0,
            rate: deepRate
          } : null,
          explanation: getExplanation(
            betType,
            oddValue,
            groupedResult?.total || 0,
            groupedResult?.hit || 0,
            superficialRate,
            detailedResult?.data.total || null,
            detailedResult?.data.hit || null,
            deepRate
          )
        })
    })

    const avgSuperficial = count > 0 ? totalSuperficial / count : 0
    const avgDeep = count > 0 ? totalDeep / count : 0

    return NextResponse.json({
      analysis,
      summary: {
        superficialRate: avgSuperficial,
        deepRate: avgDeep,
        totalBets: count
      }
    })
  } catch (error: any) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: error.message || 'Analysis error' },
      { status: 500 }
    )
  }
}

// Açıklama oluştur - Sadece istatistikler, tahmin yok
function getExplanation(
  betType: string, 
  odd: number, 
  superficialTotal: number,
  superficialHit: number,
  superficialRate: number,
  deepTotal: number | null,
  deepHit: number | null,
  deepRate: number | null
): string {
  let explanation = `${betType} için ${odd.toFixed(2)} oranı analizi:\n\n`
  
  // Yüzeysel (gruplanmış) veriler
  explanation += `📊 Gruplanmış Veriler:\n`
  explanation += `   • Toplam maç: ${superficialTotal.toLocaleString()}\n`
  explanation += `   • Tutmuş: ${superficialHit.toLocaleString()} maç (${superficialRate.toFixed(2)}%)\n`
  explanation += `   • Yatmış: ${(superficialTotal - superficialHit).toLocaleString()} maç (${(100 - superficialRate).toFixed(2)}%)\n\n`
  
  // Derinlemesine (detaylı) veriler
  if (deepTotal && deepTotal > 0) {
    explanation += `📊 Detaylı Veriler:\n`
    explanation += `   • Toplam maç: ${deepTotal.toLocaleString()}\n`
    explanation += `   • Tutmuş: ${deepHit?.toLocaleString() || 0} maç (${deepRate?.toFixed(2) || 0}%)\n`
    explanation += `   • Yatmış: ${((deepTotal || 0) - (deepHit || 0)).toLocaleString()} maç (${(100 - (deepRate || 0)).toFixed(2)}%)\n\n`
  }
  
  // Oran yorumu
  if (odd < 1.5) {
    explanation += `💡 Bu oran çok düşük (${odd.toFixed(2)}), genellikle favori takımlar için verilir.`
  } else if (odd < 2.0) {
    explanation += `💡 Bu oran düşük (${odd.toFixed(2)}), favori takım için verilmiş.`
  } else if (odd >= 2.0 && odd <= 3.0) {
    explanation += `💡 Bu oran dengeli (${odd.toFixed(2)}), eşit güçte takımlar için verilmiş.`
  } else if (odd > 3.0 && odd <= 5.0) {
    explanation += `💡 Bu oran yüksek (${odd.toFixed(2)}), az favori takım için verilmiş.`
  } else {
    explanation += `💡 Bu oran çok yüksek (${odd.toFixed(2)}), underdog takım için verilmiş.`
  }
  
  return explanation
}
