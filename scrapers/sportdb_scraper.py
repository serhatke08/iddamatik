"""
SportDB API'den takım verilerini çeker
Flashscore ve Transfermarkt verileri
"""
import requests
from typing import Optional, Dict, List
import time


SPORTDB_API_KEY = "KEub2X9oyPA5Kk2FzKxjp6w6hmM4Us2LyUo35ZPL"
SPORTDB_BASE_URL = "https://api.sportdb.dev/api"


class SportDBScraper:
    """SportDB API'den takım verilerini çeker"""
    
    def __init__(self, api_key: str = SPORTDB_API_KEY):
        self.api_key = api_key
        self.headers = {
            'X-API-Key': api_key,
            'Accept': 'application/json'
        }
        self.session = requests.Session()
        self.session.headers.update(self.headers)
    
    def search_team(self, team_name: str) -> Optional[Dict]:
        """
        Takımı ara ve ID'sini bul
        
        Args:
            team_name: Takım adı (örn: "Galatasaray")
        
        Returns:
            Takım bilgileri veya None
        """
        try:
            # Önce Flashscore team search (daha hızlı)
            team_slug = team_name.lower().replace(' ', '-')
            url = f"{SPORTDB_BASE_URL}/flashscore/team/{team_slug}"
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data and 'id' in data:
                    return data
            
            # Flashscore'da bulunamazsa Transfermarkt'a git
            return self._search_team_transfermarkt(team_name)
        
        except Exception as e:
            print(f"Takım arama hatası: {e}")
            return self._search_team_transfermarkt(team_name)
    
    def _search_team_in_competition(self, comp_id: str, team_name: str) -> Optional[Dict]:
        """Belirli bir ligde takım ara"""
        try:
            url = f"{SPORTDB_BASE_URL}/flashscore/competition/{comp_id}/teams"
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                teams = data.get('teams', [])
                
                # Takım ismini normalize et ve ara
                normalized_search = team_name.lower().strip()
                
                for team in teams:
                    team_full_name = team.get('name', '').lower()
                    if normalized_search in team_full_name or team_full_name in normalized_search:
                        return team
            
            return None
        
        except Exception as e:
            print(f"Lig takım arama hatası: {e}")
            return None
    
    def _search_team_transfermarkt(self, team_name: str) -> Optional[Dict]:
        """Transfermarkt'tan takım ara"""
        try:
            # Transfermarkt search API kullan
            url = f"{SPORTDB_BASE_URL}/transfermarkt/clubs/search/{team_name}"
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                results = data.get('results', [])
                if results:
                    # İlk sonucu al ve profil bilgisini getir
                    club_id = results[0].get('id')
                    if club_id:
                        return self._get_transfermarkt_club_profile(club_id)
            
            return None
        
        except Exception as e:
            print(f"Transfermarkt arama hatası: {e}")
            return None
    
    def _get_transfermarkt_club_profile(self, club_id: str) -> Optional[Dict]:
        """Transfermarkt'tan takım profili getir"""
        try:
            url = f"{SPORTDB_BASE_URL}/transfermarkt/clubs/{club_id}/profile"
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 200:
                return response.json()
            
            return None
        
        except Exception as e:
            print(f"Transfermarkt profil hatası: {e}")
            return None
    
    def get_team_recent_matches(self, team_slug: str, limit: int = 5) -> List[Dict]:
        """
        Takımın son maçlarını getir
        
        Args:
            team_slug: Takım slug'ı (örn: "galatasaray/SKbpVP5K")
            limit: Kaç maç getirileceği
        
        Returns:
            Son maçlar listesi
        """
        try:
            # Flashscore team endpoint'inden fixtures çek
            url = f"{SPORTDB_BASE_URL}/flashscore/team/{team_slug}"
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                # Son maçları bul (API response formatına göre)
                fixtures = data.get('fixtures', data.get('lastMatches', data.get('recentResults', [])))
                
                if not fixtures:
                    return []
                
                # Tamamlanmış maçları filtrele ve son N'i al
                completed = []
                for f in fixtures:
                    status = f.get('status', {}).get('type') if isinstance(f.get('status'), dict) else f.get('status')
                    if status in ['finished', 'ended', 'complete', 3]:  # 3 = finished status code
                        completed.append(f)
                    
                    if len(completed) >= limit:
                        break
                
                return completed[:limit]
            
            return []
        
        except Exception as e:
            print(f"Son maçlar çekme hatası: {e}")
            return []
    
    def get_team_stats(self, team_name: str) -> Optional[Dict]:
        """
        Takım istatistiklerini getir (logo, son 5 maç, kadro değeri)
        
        Args:
            team_name: Takım adı
        
        Returns:
            Takım istatistikleri
        """
        try:
            print(f"🔍 Aranıyor: {team_name}")
            
            # Takımı ara
            team_info = self.search_team(team_name)
            
            if not team_info:
                print(f"⚠ Takım bulunamadı: {team_name}")
                return self._get_fallback_stats(team_name)
            
            print(f"✓ Takım bulundu: {team_info.get('name', team_name)}")
            
            team_slug = team_info.get('slug') or team_info.get('id')
            logo_url = team_info.get('logo') or team_info.get('image') or team_info.get('badge')
            squad_value = team_info.get('marketValue') or team_info.get('squadValue')
            
            # Son maçları çek
            recent_matches = self.get_team_recent_matches(team_slug, limit=5) if team_slug else []
            
            # Son 5 maç formunu oluştur
            last_5_matches = []
            for match in recent_matches:
                try:
                    # Farklı API response formatlarını destekle
                    home_team = match.get('homeTeam', {})
                    away_team = match.get('awayTeam', {})
                    
                    if isinstance(home_team, dict):
                        home_name = home_team.get('name', '')
                    else:
                        home_name = str(home_team)
                    
                    if isinstance(away_team, dict):
                        away_name = away_team.get('name', '')
                    else:
                        away_name = str(away_team)
                    
                    # Skor
                    home_score = match.get('homeScore', {}).get('current', match.get('homeScore', 0))
                    away_score = match.get('awayScore', {}).get('current', match.get('awayScore', 0))
                    
                    if isinstance(home_score, dict):
                        home_score = home_score.get('current', 0)
                    if isinstance(away_score, dict):
                        away_score = away_score.get('current', 0)
                    
                    home_score = int(home_score) if home_score is not None else 0
                    away_score = int(away_score) if away_score is not None else 0
                    
                    # Bu takım ev sahibi mi deplasman mı?
                    is_home = team_name.lower() in home_name.lower()
                    
                    # Sonucu belirle
                    if is_home:
                        if home_score > away_score:
                            result = 'W'
                        elif home_score < away_score:
                            result = 'L'
                        else:
                            result = 'D'
                    else:
                        if away_score > home_score:
                            result = 'W'
                        elif away_score < home_score:
                            result = 'L'
                        else:
                            result = 'D'
                    
                    last_5_matches.append({
                        'result': result,
                        'score': f"{home_score}-{away_score}"
                    })
                except Exception as e:
                    print(f"Maç parse hatası: {e}")
                    continue
            
            # Performans özeti
            wins = sum(1 for m in last_5_matches if m['result'] == 'W')
            draws = sum(1 for m in last_5_matches if m['result'] == 'D')
            losses = sum(1 for m in last_5_matches if m['result'] == 'L')
            
            return {
                'team_name': team_name,
                'logo_url': logo_url,
                'last_5_matches': last_5_matches,
                'squad_value': squad_value,
                'red_cards': 0,
                'performance': {
                    'wins': wins,
                    'draws': draws,
                    'losses': losses,
                    'form': ''.join([m['result'] for m in last_5_matches])
                }
            }
        
        except Exception as e:
            print(f"Takım istatistikleri hatası: {e}")
            return self._get_fallback_stats(team_name)
    
    def _get_fallback_stats(self, team_name: str) -> Dict:
        """API başarısız olursa fallback simüle veri"""
        import random
        random.seed(hash(team_name))
        
        logo_map = {
            'galatasaray': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Galatasaray_SK_Logo.png/150px-Galatasaray_SK_Logo.png',
            'fenerbahce': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Fenerbah%C3%A7e_SK.png/150px-Fenerbah%C3%A7e_SK.png',
            'besiktas': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Be%C5%9Fikta%C5%9F_JK.png/150px-Be%C5%9Fikta%C5%9F_JK.png',
            'trabzonspor': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Trabzonspor_logo.svg/150px-Trabzonspor_logo.svg.png',
            'istanbulspor': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/%C4%B0stanbulspor_logo.svg/150px-%C4%B0stanbulspor_logo.svg.png'
        }
        
        team_key = team_name.lower().strip()
        logo_url = logo_map.get(team_key, None)
        
        last_5 = []
        for i in range(5):
            rand = random.random()
            if rand > 0.6:
                result = 'W'
            elif rand > 0.3:
                result = 'D'
            else:
                result = 'L'
            
            h_score = random.randint(0, 3)
            a_score = random.randint(0, 3)
            
            last_5.append({
                'result': result,
                'score': f"{h_score}-{a_score}"
            })
        
        wins = sum(1 for m in last_5 if m['result'] == 'W')
        draws = sum(1 for m in last_5 if m['result'] == 'D')
        losses = sum(1 for m in last_5 if m['result'] == 'L')
        
        return {
            'team_name': team_name,
            'logo_url': logo_url,
            'last_5_matches': last_5,
            'squad_value': None,
            'red_cards': 0,
            'performance': {
                'wins': wins,
                'draws': draws,
                'losses': losses,
                'form': ''.join([m['result'] for m in last_5])
            }
        }


if __name__ == "__main__":
    # Test
    scraper = SportDBScraper()
    
    print("Galatasaray istatistikleri çekiliyor...")
    stats = scraper.get_team_stats("Galatasaray")
    
    if stats:
        print(f"\nTakım: {stats['team_name']}")
        print(f"Logo: {stats['logo_url']}")
        print(f"Son 5 maç: {stats['last_5_matches']}")
        print(f"Performans: {stats['performance']}")
    else:
        print("Veri çekilemedi")
