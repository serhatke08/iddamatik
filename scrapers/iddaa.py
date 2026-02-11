"""
İddaa.com'dan veri çekme modülü
"""
import requests
from bs4 import BeautifulSoup
from datetime import datetime
from typing import Dict, List, Optional
import time
from fake_useragent import UserAgent

ua = UserAgent()


class IddaaScraper:
    """İddaa.com'dan maç ve oran verilerini çeker"""
    
    def __init__(self, delay: float = 2.0):
        self.base_url = "https://www.iddaa.com"
        self.delay = delay
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': ua.random,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
            'Referer': 'https://www.iddaa.com/'
        })
    
    def get_matches_by_date(self, date: str) -> List[Dict]:
        """
        Belirli bir tarihteki maçları getirir
        
        Args:
            date: Tarih formatı DD/MM/YYYY (örn: "01/01/2024")
        
        Returns:
            Maç listesi
        """
        try:
            # Tarih formatını dönüştür
            date_parts = date.split('/')
            if len(date_parts) == 3:
                formatted_date = f"{date_parts[2]}-{date_parts[1]}-{date_parts[0]}"
            else:
                formatted_date = date
            
            # İddaa.com'un futbol maç programı sayfası
            # Kullanıcının istediği birebir bülten: https://www.iddaa.com/program/futbol
            url = f"{self.base_url}/program/futbol"
            
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            matches = []
            
            # İddaa.com'un HTML yapısına göre parse et
            # Bu kısım sitenin güncel yapısına göre güncellenmeli
            match_elements = soup.find_all(['div', 'tr', 'li'], class_=lambda x: x and ('match' in str(x).lower() or 'mac' in str(x).lower() or 'event' in str(x).lower()))
            
            if not match_elements:
                # Alternatif: Tüm maç kartlarını ara
                match_elements = soup.find_all(['div', 'article'], attrs={'data-match-id': True})
            
            for element in match_elements[:20]:  # İlk 20 maçı al
                try:
                    match_info = self._parse_match_element(element, date)
                    if match_info:
                        matches.append(match_info)
                except Exception as e:
                    continue
            
            time.sleep(self.delay)
            return matches
            
        except requests.exceptions.RequestException as e:
            print(f"İddaa.com bağlantı hatası: {e}")
            return []
        except Exception as e:
            print(f"İddaa.com parse hatası: {e}")
            return []
    
    def _parse_match_element(self, element, date: str) -> Optional[Dict]:
        """HTML elementinden maç bilgilerini parse eder"""
        try:
            # Basit bir parse yapısı
            # Gerçek HTML yapısına göre güncellenmeli
            
            # Takım isimlerini bul
            team_elements = element.find_all(['span', 'div', 'a'], class_=lambda x: x and ('team' in str(x).lower() or 'takim' in str(x).lower()))
            
            home_team = "Ev Sahibi"
            away_team = "Deplasman"
            
            if len(team_elements) >= 2:
                home_team = team_elements[0].get_text(strip=True)
                away_team = team_elements[1].get_text(strip=True)
            
            # Oranları bul
            odds_elements = element.find_all(['span', 'div'], class_=lambda x: x and ('odd' in str(x).lower() or 'oran' in str(x).lower()))
            
            odds = {}
            if len(odds_elements) >= 3:
                try:
                    odds['ms1'] = float(odds_elements[0].get_text(strip=True).replace(',', '.'))
                    odds['msx'] = float(odds_elements[1].get_text(strip=True).replace(',', '.'))
                    odds['ms2'] = float(odds_elements[2].get_text(strip=True).replace(',', '.'))
                except:
                    pass
            
            # Lig bilgisi
            league = "Lig"
            league_elem = element.find(['span', 'div'], class_=lambda x: x and ('league' in str(x).lower() or 'lig' in str(x).lower()))
            if league_elem:
                league = league_elem.get_text(strip=True)
            
            # Saat bilgisi
            time_elem = element.find(['span', 'div'], class_=lambda x: x and ('time' in str(x).lower() or 'saat' in str(x).lower()))
            match_time = time_elem.get_text(strip=True) if time_elem else "--:--"
            
            return {
                'match_id': hash(f"{home_team}{away_team}{date}"),
                'home_team': home_team,
                'away_team': away_team,
                'league': league,
                'date': date,
                'time': match_time,
                'odds': odds if odds else {'ms1': 0, 'msx': 0, 'ms2': 0}
            }
            
        except Exception as e:
            return None
    
    def get_today_matches(self) -> List[Dict]:
        """Bugünkü maçları getirir"""
        today = datetime.now().strftime("%d/%m/%Y")
        return self.get_matches_by_date(today)
