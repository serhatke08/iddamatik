import { NextResponse } from 'next/server'
import { format } from 'date-fns'
import { isMatchUpcomingIddaa, parseIddaaKickoffMs } from '@/lib/match-datetime'

export async function GET() {
  try {
    // Cache'i tamamen bypass et ve her zaman API'den yeni veri çek
    // Direkt fetchIddaaProgram'ı kullan (cache yok)
    const { fetchIddaaProgram } = await import('@/lib/iddaa-scrape')
    const freshMatches = await fetchIddaaProgram(2000) // Her zaman yeni veri çek
    const upcomingMatches = freshMatches.filter((match) => match.status !== 'FINISHED')

    const now = new Date()
    console.log(
      `[upcoming-odds] Now (UTC): ${now.toISOString()} | Total raw: ${upcomingMatches.length}`
    )

    // Başlama: önce API Unix saniyesi (kickoff_ts), yoksa TR string
    const formattedMatches = upcomingMatches.filter((match) => {
      if (match.status === 'FINISHED') return false
      if (typeof match.kickoff_ts === 'number' && match.kickoff_ts > 0) {
        return match.kickoff_ts * 1000 > Date.now()
      }
      if (!match.date) return true
      return isMatchUpcomingIddaa(match.date, match.time)
    })
    
    console.log(`[upcoming-odds] Filtered matches: ${formattedMatches.length}`)
    
    const processedMatches = formattedMatches.map((match) => {
      // Lig ismini normalize et - iddaa-scrape'den gelen formatı koru
      let league = match.league || 'Bilinmeyen Lig'

      // Eğer lig ismi "Country — League" formatındaysa (uzun tire ile), sonrasını al
      // Ama kısa tire (-) ile ayrılmışsa (örneğin "V-Ligi"), olduğu gibi bırak
      const longDashIndex = league.lastIndexOf('—')
      if (longDashIndex !== -1 && longDashIndex + 1 < league.length) {
        // Uzun tire (—) bulundu, sonrasını al
        league = league.slice(longDashIndex + 1).trim()
      } else {
        // Uzun tire yok, ama normal tire (-) ile ayrılmış olabilir
        // Sadece başta "Country - " formatı varsa (boşluk + tire + boşluk), sonrasını al
        const normalDashMatch = league.match(/^[^-]+ - (.+)$/)
        if (normalDashMatch && normalDashMatch[1]) {
          league = normalDashMatch[1].trim()
        }
        // Aksi halde olduğu gibi bırak (örneğin "V-Ligi", "1.Lig" gibi)
      }

      // Sadece Türkiye Super Lig'i için özel kontrol
      // Eğer lig ismi "Turkey" veya "Türkiye" içeriyorsa ve "Super Lig" veya "Süper Lig" içeriyorsa
      const leagueLower = league.toLowerCase()
      if ((leagueLower.includes('turkey') || leagueLower.includes('türkiye')) && 
          (leagueLower.includes('super lig') || leagueLower.includes('süper lig'))) {
        league = 'Super Lig'
      }
      // Diğer ülkelerin "Super Lig" isimli liglerini olduğu gibi bırak (örn: "Serbia Super Liga")

      // Diğer lig ismi düzeltmeleri
      if (league === 'Premiership') league = 'Scottish Premiership'
      if (league === 'Serie A Betano') league = 'Serie A'
      
      // Oranları formatla (iddaa-scrape formatı: ms1, msx, ms2, kg_var, kg_yok, o25, u25)
      const odds: Record<string, any> = {}
      if (match.odds) {
        // MS1, MSX, MS2
        if (match.odds.ms1) odds['H'] = parseFloat(match.odds.ms1.toString())
        if (match.odds.msx) odds['D'] = parseFloat(match.odds.msx.toString())
        if (match.odds.ms2) odds['A'] = parseFloat(match.odds.ms2.toString())
        
        // KG VAR/YOK
        if (match.odds.kg_var) odds['BTTSY'] = parseFloat(match.odds.kg_var.toString())
        if (match.odds.kg_yok) odds['BTTSN'] = parseFloat(match.odds.kg_yok.toString())
        
        // Gol bahisleri (iddaa-scrape formatı: o25, u25)
        if (match.odds.o25) odds['O25'] = parseFloat(match.odds.o25.toString())
        if (match.odds.u25) odds['U25'] = parseFloat(match.odds.u25.toString())
        // Diğer gol bahisleri varsa
        if (match.odds.o05) odds['O05'] = parseFloat(match.odds.o05.toString())
        if (match.odds.u05) odds['U05'] = parseFloat(match.odds.u05.toString())
        if (match.odds.o15) odds['O15'] = parseFloat(match.odds.o15.toString())
        if (match.odds.u15) odds['U15'] = parseFloat(match.odds.u15.toString())
        if (match.odds.o35) odds['O35'] = parseFloat(match.odds.o35.toString())
        if (match.odds.u35) odds['U35'] = parseFloat(match.odds.u35.toString())
        if (match.odds.o45) odds['O45'] = parseFloat(match.odds.o45.toString())
        if (match.odds.u45) odds['U45'] = parseFloat(match.odds.u45.toString())
      }

      const kickoffMs =
        typeof match.kickoff_ts === 'number' && match.kickoff_ts > 0 ? match.kickoff_ts * 1000 : undefined

      return {
        match_id: match.match_id?.toString() || `${Date.now()}-${Math.random()}`,
        home_team: match.home_team || 'Takım 1',
        away_team: match.away_team || 'Takım 2',
        league: league,
        // Tipte country yok ama bazı kaynaklar gönderiyor olabilir; o yüzden esnek tutuyoruz
        country: (match as any).country || '',
        date: match.date || format(new Date(), 'dd/MM/yyyy'),
        time: match.time || '',
        status: match.status || 'NS',
        odds,
        fixture_id: match.match_id,
        kickoff_ms: kickoffMs
      }
    })

    // Oynanma zamanına göre (önce Unix ms, yoksa TR tarih parse)
    const sortedMatches = processedMatches.sort((a, b) => {
      const ak = typeof a.kickoff_ms === 'number' ? a.kickoff_ms : parseIddaaKickoffMs(a.date, a.time)
      const bk = typeof b.kickoff_ms === 'number' ? b.kickoff_ms : parseIddaaKickoffMs(b.date, b.time)
      if (ak !== null && bk !== null) return ak - bk
      if (ak !== null) return -1
      if (bk !== null) return 1
      return a.league.localeCompare(b.league)
    })

    return NextResponse.json({ matches: sortedMatches, source: 'iddaa' })
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: error.message || 'API hatası', matches: [] },
      { status: 500 }
    )
  }
}
