import { NextResponse } from 'next/server'
import { fetchUpcomingMatches } from '@/lib/sportradar-api'
import { parse, startOfDay, isBefore, format } from 'date-fns'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')
    
    // API'den gelecek maçları çek
    const allMatches = await fetchUpcomingMatches(days)
    
    // Şu anki tarih ve saat
    const now = new Date()
    const nowTime = now.getHours() * 60 + now.getMinutes()
    
    // Bugün ve gelecek tarihlerdeki maçları filtrele
    const filteredMatches = allMatches.filter((match) => {
      try {
        if (!match.date) return true
        
        const matchDate = parse(match.date, 'dd/MM/yyyy', new Date())
        const today = startOfDay(now)
        const matchDay = startOfDay(matchDate)
        
        // Geçmiş günlerdeki maçları filtrele
        if (isBefore(matchDay, today)) {
          return false
        }
        
        // Bugünkü maçlar için saat kontrolü
        if (matchDay.getTime() === today.getTime() && match.time) {
          const timeParts = match.time.split(':')
          if (timeParts.length >= 2) {
            const matchHours = parseInt(timeParts[0]) || 0
            const matchMinutes = parseInt(timeParts[1]) || 0
            const matchTime = matchHours * 60 + matchMinutes
            
            // Bugünkü maçlar için sadece geçmiş saatlerdeki maçları filtrele (30 dakika tolerans)
            if (matchTime < nowTime - 30) {
              return false
            }
          }
        }
        
        return true
      } catch (error) {
        console.error('Date parse error:', error, match.date)
        return true
      }
    })
    
    // Lig önceliğine göre sırala
    const leaguePriority: Record<string, number> = {
      'Super Lig': 1,
      'Süper Lig': 1,
      'Premier League': 2,
      'La Liga': 3,
      'Serie A': 4,
      'Bundesliga': 5,
      'Ligue 1': 6,
      'Champions League': 7,
      'Europa League': 8,
      'Eredivisie': 9,
      'Liga Portugal': 10,
      'Scottish Premiership': 11,
      'MLS': 12,
      'A-League': 13,
      'Brazil Serie A': 14,
      'Russia Premier League': 15
    }
    
    const parseTime = (timeStr: string): number => {
      if (!timeStr) return 9999
      const parts = timeStr.split(':')
      if (parts.length >= 2) {
        const hours = parseInt(parts[0]) || 0
        const minutes = parseInt(parts[1]) || 0
        return hours * 60 + minutes
      }
      return 9999
    }
    
    const sortedMatches = filteredMatches.sort((a, b) => {
      const aTime = parseTime(a.time || '')
      const bTime = parseTime(b.time || '')
      
      if (aTime !== bTime) {
        return aTime - bTime
      }
      
      const aPriority = leaguePriority[a.league] || 999
      const bPriority = leaguePriority[b.league] || 999
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority
      }
      
      return a.league.localeCompare(b.league)
    })
    
    return NextResponse.json({ 
      matches: sortedMatches,
      count: sortedMatches.length,
      source: 'api-football'
    })
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: error.message || 'API hatası', matches: [] },
      { status: 500 }
    )
  }
}
