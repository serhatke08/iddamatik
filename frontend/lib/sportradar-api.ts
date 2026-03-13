// Sportradar API veya alternatif API için yeni yapı
// Gelecek maçları çekmek için

export interface UpcomingMatch {
  match_id: string
  home_team: string
  away_team: string
  league: string
  country: string
  date: string
  time: string
  status: string
  odds: Record<string, number>
  fixture_id?: number
}

// Alternatif: Football-Data.org API (ücretsiz)
const FOOTBALL_DATA_API_KEY = process.env.FOOTBALL_DATA_API_KEY || ''
const FOOTBALL_DATA_BASE_URL = 'https://api.football-data.org/v4'

export async function fetchUpcomingMatchesFromFootballData(days: number = 7): Promise<UpcomingMatch[]> {
  try {
    const today = new Date()
    const futureDate = new Date(today)
    futureDate.setDate(futureDate.getDate() + days)
    
    const dateFrom = today.toISOString().split('T')[0]
    const dateTo = futureDate.toISOString().split('T')[0]
    
    // Premier League, La Liga, Serie A, Bundesliga, Ligue 1 için maçları çek
    const competitions = [
      { id: 'PL', name: 'Premier League', country: 'England' },
      { id: 'PD', name: 'La Liga', country: 'Spain' },
      { id: 'SA', name: 'Serie A', country: 'Italy' },
      { id: 'BL1', name: 'Bundesliga', country: 'Germany' },
      { id: 'FL1', name: 'Ligue 1', country: 'France' },
      { id: 'CL', name: 'Champions League', country: 'Europe' },
      { id: 'EL', name: 'Europa League', country: 'Europe' }
    ]
    
    const allMatches: UpcomingMatch[] = []
    
    for (const comp of competitions) {
      try {
        const url = `${FOOTBALL_DATA_BASE_URL}/competitions/${comp.id}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`
        const response = await fetch(url, {
          headers: {
            'X-Auth-Token': FOOTBALL_DATA_API_KEY || ''
          }
        })
        
        if (!response.ok) {
          console.warn(`Failed to fetch ${comp.name}: ${response.status}`)
          continue
        }
        
        const data = await response.json()
        
        if (data.matches && Array.isArray(data.matches)) {
          for (const match of data.matches) {
            if (match.status === 'SCHEDULED' || match.status === 'TIMED') {
              const matchDate = new Date(match.utcDate)
              const dateStr = matchDate.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
              const timeStr = matchDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', hour12: false })
              
              allMatches.push({
                match_id: `fd_${match.id}`,
                home_team: match.homeTeam.name,
                away_team: match.awayTeam.name,
                league: comp.name,
                country: comp.country,
                date: dateStr,
                time: timeStr,
                status: match.status === 'SCHEDULED' ? 'UPCOMING' : 'LIVE',
                odds: {
                  H: match.odds?.homeWin || null,
                  D: match.odds?.draw || null,
                  A: match.odds?.awayWin || null
                },
                fixture_id: match.id
              })
            }
          }
        }
      } catch (error) {
        console.error(`Error fetching ${comp.name}:`, error)
        continue
      }
    }
    
    return allMatches
  } catch (error) {
    console.error('Error fetching from Football-Data.org:', error)
    return []
  }
}

// Alternatif: API-Football (RapidAPI) - daha fazla lig desteği
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || ''
const RAPIDAPI_BASE_URL = 'https://api-football-v1.p.rapidapi.com/v3'

export async function fetchUpcomingMatchesFromRapidAPI(days: number = 7): Promise<UpcomingMatch[]> {
  try {
    const today = new Date()
    const futureDate = new Date(today)
    futureDate.setDate(futureDate.getDate() + days)
    
    const dateFrom = Math.floor(today.getTime() / 1000)
    const dateTo = Math.floor(futureDate.getTime() / 1000)
    
    // Önemli liglerin ID'leri
    const leagueIds = [
      39, // Premier League
      140, // La Liga
      135, // Serie A
      78, // Bundesliga
      61, // Ligue 1
      2, // Champions League
      3, // Europa League
      203, // Süper Lig (Turkey)
    ]
    
    const allMatches: UpcomingMatch[] = []
    
    for (const leagueId of leagueIds) {
      try {
        const url = `${RAPIDAPI_BASE_URL}/fixtures?league=${leagueId}&from=${dateFrom}&to=${dateTo}`
        const response = await fetch(url, {
          headers: {
            'X-RapidAPI-Key': RAPIDAPI_KEY || '',
            'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
          }
        })
        
        if (!response.ok) {
          console.warn(`Failed to fetch league ${leagueId}: ${response.status}`)
          continue
        }
        
        const data = await response.json()
        
        if (data.response && Array.isArray(data.response)) {
          for (const fixture of data.response) {
            if (fixture.fixture.status.short === 'NS' || fixture.fixture.status.short === 'TBD') {
              const matchDate = new Date(fixture.fixture.date)
              const dateStr = matchDate.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
              const timeStr = matchDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', hour12: false })
              
              allMatches.push({
                match_id: `rapid_${fixture.fixture.id}`,
                home_team: fixture.teams.home.name,
                away_team: fixture.teams.away.name,
                league: fixture.league.name,
                country: fixture.league.country,
                date: dateStr,
                time: timeStr,
                status: 'UPCOMING',
                odds: {
                  H: fixture.bookmakers?.[0]?.bets?.[0]?.values?.find((v: any) => v.value === 'Home')?.odd || null,
                  D: fixture.bookmakers?.[0]?.bets?.[0]?.values?.find((v: any) => v.value === 'Draw')?.odd || null,
                  A: fixture.bookmakers?.[0]?.bets?.[0]?.values?.find((v: any) => v.value === 'Away')?.odd || null
                },
                fixture_id: fixture.fixture.id
              })
            }
          }
        }
      } catch (error) {
        console.error(`Error fetching league ${leagueId}:`, error)
        continue
      }
    }
    
    return allMatches
  } catch (error) {
    console.error('Error fetching from RapidAPI:', error)
    return []
  }
}

// Fallback: Mevcut iddaa API'sini kullan
async function fetchFromIddaaFallback(): Promise<UpcomingMatch[]> {
  try {
    const { fetchIddaaProgram } = await import('./iddaa-scrape')
    const matches = await fetchIddaaProgram(2000)
    
    return matches
      .filter(m => m.status !== 'FINISHED')
      .map(m => ({
        match_id: m.match_id,
        home_team: m.home_team,
        away_team: m.away_team,
        league: m.league,
        country: '',
        date: m.date,
        time: m.time,
        status: m.status || 'UPCOMING',
        odds: Object.fromEntries(
          Object.entries({
            H: m.odds.ms1,
            D: m.odds.msx,
            A: m.odds.ms2,
            BTTSY: m.odds.kg_var,
            BTTSN: m.odds.kg_yok,
            O25: m.odds.o25,
            U25: m.odds.u25
          }).filter(([_, value]) => value != null)
        ) as Record<string, number>
      }))
  } catch (error) {
    console.error('Error fetching from iddaa fallback:', error)
    return []
  }
}

// Ana fonksiyon: Önce RapidAPI dene, yoksa Football-Data.org, son olarak iddaa
export async function fetchUpcomingMatches(days: number = 7): Promise<UpcomingMatch[]> {
  // Önce RapidAPI'yi dene (daha fazla lig)
  if (RAPIDAPI_KEY) {
    const rapidMatches = await fetchUpcomingMatchesFromRapidAPI(days)
    if (rapidMatches.length > 0) {
      console.log(`[sportradar-api] Fetched ${rapidMatches.length} matches from RapidAPI`)
      return rapidMatches
    }
  }
  
  // RapidAPI yoksa veya başarısız olursa Football-Data.org kullan
  if (FOOTBALL_DATA_API_KEY) {
    const fdMatches = await fetchUpcomingMatchesFromFootballData(days)
    if (fdMatches.length > 0) {
      console.log(`[sportradar-api] Fetched ${fdMatches.length} matches from Football-Data.org`)
      return fdMatches
    }
  }
  
  // API key yoksa veya başarısız olursa iddaa fallback kullan
  console.warn('[sportradar-api] No API keys or API failed, using iddaa fallback')
  const iddaaMatches = await fetchFromIddaaFallback()
  console.log(`[sportradar-api] Fetched ${iddaaMatches.length} matches from iddaa fallback`)
  return iddaaMatches
}
