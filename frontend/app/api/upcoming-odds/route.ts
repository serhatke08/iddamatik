import { NextResponse } from 'next/server'
import { iddaaService } from '@/lib/iddaa-data'

export async function GET(request: Request) {
  try {
    // İddaa Service'den bugünkü gelecek maçları çek
    const upcomingMatches = await iddaaService.getToday(500) // Son 500 maç
    
    // Formatla
    const formattedMatches = upcomingMatches.map((match) => {
      // Lig ismini normalize et
      let league = match.league || 'Bilinmeyen Lig'

      // Bazı sağlayıcılar "Country — League" veya "Country - League" formatı döndürüyor.
      // Ne gelirse gelsin, son tire/uzun tireden SONRASINI lig adı kabul ediyoruz.
      const separators = ['—', '-', '–']
      let lastIdx = -1
      separators.forEach(sep => {
        const idx = league.lastIndexOf(sep)
        if (idx > lastIdx) lastIdx = idx
      })
      if (lastIdx !== -1 && lastIdx + 1 < league.length) {
        league = league.slice(lastIdx + 1).trim()
      }

      // Ek güvenlik: içinde "super lig" geçiyorsa direkt "Super Lig" yap
      if (league.toLowerCase().includes('super lig')) {
        league = 'Super Lig'
      }

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

      return {
        match_id: match.match_id?.toString() || `${Date.now()}-${Math.random()}`,
        home_team: match.home_team || 'Takım 1',
        away_team: match.away_team || 'Takım 2',
        league: league,
        // Tipte country yok ama bazı kaynaklar gönderiyor olabilir; o yüzden esnek tutuyoruz
        country: (match as any).country || '',
        date: match.date || new Date().toISOString().split('T')[0],
        time: match.time || '',
        status: match.status || 'NS',
        odds,
        fixture_id: match.match_id
      }
    })

    // Saat parse fonksiyonu
    const parseTime = (timeStr: string): number => {
      if (!timeStr) return 9999 // Saat yoksa en sona
      const parts = timeStr.split(':')
      if (parts.length >= 2) {
        const hours = parseInt(parts[0]) || 0
        const minutes = parseInt(parts[1]) || 0
        return hours * 60 + minutes // Dakika cinsinden
      }
      return 9999
    }

    // Lig önceliği
    const leaguePriority: Record<string, number> = {
      'Super Lig': 1,
      'Süper Lig': 1,
      'Premier League': 2,
      'LaLiga': 3,
      'Serie A': 4,
      'Bundesliga': 5,
      'Ligue 1': 6,
      'Champions League': 7,
      'Eredivisie': 8,
      'Liga Portugal': 9,
      'Scottish Premiership': 10,
      'MLS': 11,
      'A-League': 12,
      'Brazil Serie A': 13,
      'Russia Premier League': 14
    }
    
    // Önce saate göre, sonra lig önceliğine göre sırala
    const sortedMatches = formattedMatches.sort((a, b) => {
      const aTime = parseTime(a.time || '')
      const bTime = parseTime(b.time || '')
      
      // Önce saate göre sırala
      if (aTime !== bTime) {
        return aTime - bTime
      }
      
      // Aynı saatteyse lig önceliğine göre
      const aPriority = leaguePriority[a.league] || 999
      const bPriority = leaguePriority[b.league] || 999
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority
      }
      
      // Aynı lig ve saatteyse lig ismine göre
      return a.league.localeCompare(b.league)
    })

    return NextResponse.json({ matches: sortedMatches })
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: error.message || 'API hatası', matches: [] },
      { status: 500 }
    )
  }
}
