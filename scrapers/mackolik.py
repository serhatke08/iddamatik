"""
Mackolik.com'dan veri çekme modülü
"""
import requests
import json
import re
from datetime import datetime
from typing import Dict, List, Optional
import time
from fake_useragent import UserAgent
from bs4 import BeautifulSoup

ua = UserAgent()


class MackolikScraper:
    """Mackolik.com'dan maç ve oran verilerini çeker"""
    
    def __init__(self, delay: float = 2.0):
        self.base_url = "https://www.mackolik.com"
        self.api_url = "https://goapi.mackolik.com/livedata"
        self.delay = delay
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Referer': 'https://www.mackolik.com/'
        })
    
    def get_matches_by_date(self, date: str) -> List[Dict]:
        """
        Belirli bir tarihteki maçları getirir
        
        Args:
            date: Tarih formatı DD/MM/YYYY (örn: "01/01/2024")
        
        Returns:
            Maç listesi
        """
        # Önce API endpoint'ini dene
        url = f"{self.api_url}?date={date}"
        
        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            matches = []
            
            if isinstance(data, list):
                for match in data:
                    if isinstance(match, list) and len(match) > 0:
                        match_info = self._parse_match_data(match)
                        if match_info:
                            matches.append(match_info)
            
            time.sleep(self.delay)
            return matches
            
        except requests.exceptions.RequestException as e:
            print(f"Mackolik API hatası: {e}")
            print("Alternatif yöntem deneniyor...")
            
            # Alternatif: Web scraping ile ana siteden çek
            return self._scrape_from_website(date)
    
    def _parse_match_data(self, match_data: List) -> Optional[Dict]:
        """Ham maç verisini parse eder"""
        try:
            # Mackolik API formatına göre parse
            # Format değişebilir, bu yüzden esnek bir yapı kullanıyoruz
            if len(match_data) < 5:
                return None
            
            match_id = match_data[0] if len(match_data) > 0 else None
            league_id = match_data[1] if len(match_data) > 1 else None
            home_team = match_data[2] if len(match_data) > 2 else None
            away_team = match_data[4] if len(match_data) > 4 else None
            
            # Tarih ve saat bilgileri (format değişebilir)
            date = match_data[5] if len(match_data) > 5 else datetime.now().strftime("%d/%m/%Y")
            time_str = match_data[6] if len(match_data) > 6 else "00:00"
            
            # Lig bilgisi
            league = match_data[3] if len(match_data) > 3 else "Lig"
            
            # Skor bilgisi - farklı pozisyonlarda olabilir
            score = None
            home_score = None
            away_score = None
            
            # Skor için tüm elemanları kontrol et
            for item in match_data:
                if isinstance(item, str) and '-' in item:
                    # Skor formatı: "2-1" veya "2 - 1"
                    score_match = re.search(r'(\d+)\s*[-–]\s*(\d+)', item)
                    if score_match:
                        home_score = int(score_match.group(1))
                        away_score = int(score_match.group(2))
                        score = f"{home_score}-{away_score}"
                        break
                elif isinstance(item, (int, float)) and item > 0 and item < 20:
                    # Skor sayıları ayrı ayrı olabilir
                    if home_score is None:
                        home_score = int(item)
                    elif away_score is None:
                        away_score = int(item)
                        score = f"{home_score}-{away_score}"
                        break
            
            # Oranları çek (eğer match_id varsa)
            odds = {}
            if match_id:
                odds_data = self.get_match_odds(match_id)
                if odds_data and isinstance(odds_data, dict):
                    odds = odds_data.get('odds', {})
            
            match_info = {
                'match_id': match_id,
                'league_id': league_id,
                'score': score,
                'home_score': home_score,
                'away_score': away_score,
                'home_team': home_team,
                'away_team': away_team,
                'league': league,
                'date': date,
                'time': time_str,
                'odds': odds,
                'source': 'mackolik'
            }
            
            return match_info
            
        except Exception as e:
            print(f"Parse hatası: {e}")
            return None
    
    def get_match_odds(self, match_id: int) -> Optional[Dict]:
        """
        Belirli bir maçın tüm oranlarını getirir
        
        Args:
            match_id: Maç ID'si
        
        Returns:
            Oran verileri dict'i
        """
        url = f"https://www.mackolik.com/Mac/{match_id}"
        
        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            odds = {}
            
            # Maç Sonucu (MS1, MSX, MS2)
            ms_odds = self._extract_ms_odds(soup)
            if ms_odds:
                odds.update(ms_odds)
            
            # Alt/Üst oranları
            alt_ust_odds = self._extract_alt_ust_odds(soup)
            if alt_ust_odds:
                odds.update(alt_ust_odds)
            
            # Karşılıklı Gol (KG Var/Yok)
            kg_odds = self._extract_kg_odds(soup)
            if kg_odds:
                odds.update(kg_odds)
            
            # Handikap oranları
            handikap_odds = self._extract_handikap_odds(soup)
            if handikap_odds:
                odds.update(handikap_odds)
            
            # İlk Yarı oranları
            iy_odds = self._extract_iy_odds(soup)
            if iy_odds:
                odds.update(iy_odds)
            
            time.sleep(self.delay)
            return {
                'match_id': match_id,
                'odds': odds,
                'status': 'success'
            }
            
        except requests.exceptions.RequestException as e:
            print(f"Oran çekme hatası: {e}")
            return None
    
    def _extract_ms_odds(self, soup: BeautifulSoup) -> Dict:
        """Maç Sonucu oranlarını çıkarır (MS1, MSX, MS2)"""
        odds = {}
        try:
            # 1) Öncelik: İddaa satırını bul (kullanıcının gördüğü ana oran satırı)
            iddaa_row = None
            for row in soup.find_all(['tr', 'div', 'li']):
                text = row.get_text(separator=' ', strip=True).lower()
                if 'iddaa' in text:  # satırda İddaa kelimesi geçiyorsa
                    iddaa_row = row
                    break

            if iddaa_row:
                # Satır içindeki tüm sayıları topla (1.81, 3.25, 2.10 gibi)
                import re as _re
                numbers: list[float] = []
                for element in iddaa_row.find_all(text=True):
                    s = element.strip().replace(',', '.')
                    m = _re.findall(r'\d+\.\d+', s)
                    for num in m:
                        try:
                            numbers.append(float(num))
                        except ValueError:
                            continue

                # En az 3 oran varsa sırasıyla MS1, MSX, MS2 kabul et
                if len(numbers) >= 3:
                    odds['ms1'] = numbers[0]
                    odds['msx'] = numbers[1]
                    odds['ms2'] = numbers[2]
                    return odds

            # 2) Fallback: data-odd-type / data-market attribute’ları ile eski yöntem
            ms1_elem = soup.find(attrs={'data-odd-type': 'ms1'}) or soup.find(attrs={'data-market': 'ms1'})
            msx_elem = soup.find(attrs={'data-odd-type': 'msx'}) or soup.find(attrs={'data-market': 'msx'})
            ms2_elem = soup.find(attrs={'data-odd-type': 'ms2'}) or soup.find(attrs={'data-market': 'ms2'})

            if ms1_elem:
                try:
                    odds['ms1'] = float(ms1_elem.get_text(strip=True).replace(',', '.'))
                except Exception:
                    pass

            if msx_elem:
                try:
                    odds['msx'] = float(msx_elem.get_text(strip=True).replace(',', '.'))
                except Exception:
                    pass

            if ms2_elem:
                try:
                    odds['ms2'] = float(ms2_elem.get_text(strip=True).replace(',', '.'))
                except Exception:
                    pass
        except Exception as e:
            print(f"MS oran parse hatası: {e}")
        
        return odds
    
    def _extract_alt_ust_odds(self, soup: BeautifulSoup) -> Dict:
        """Alt/Üst oranlarını çıkarır"""
        odds = {}
        try:
            # Alt/Üst 1.5, 2.5, 3.5 için
            for threshold in [1.5, 2.5, 3.5]:
                alt_key = f'alt_{threshold}'.replace('.', '_')
                ust_key = f'ust_{threshold}'.replace('.', '_')
                
                # Alt oranı
                alt_elem = soup.find(attrs={'data-odd-type': f'alt_{threshold}'}) or \
                          soup.find(attrs={'data-market': f'alt_{threshold}'})
                if alt_elem:
                    try:
                        odds[alt_key] = float(alt_elem.get_text(strip=True).replace(',', '.'))
                    except:
                        pass
                
                # Üst oranı
                ust_elem = soup.find(attrs={'data-odd-type': f'ust_{threshold}'}) or \
                          soup.find(attrs={'data-market': f'ust_{threshold}'})
                if ust_elem:
                    try:
                        odds[ust_key] = float(ust_elem.get_text(strip=True).replace(',', '.'))
                    except:
                        pass
        except Exception as e:
            print(f"Alt/Üst oran parse hatası: {e}")
        
        return odds
    
    def _extract_kg_odds(self, soup: BeautifulSoup) -> Dict:
        """Karşılıklı Gol oranlarını çıkarır (KG Var/Yok)"""
        odds = {}
        try:
            kg_var_elem = soup.find(attrs={'data-odd-type': 'kg_var'}) or \
                         soup.find(attrs={'data-market': 'kg_var'}) or \
                         soup.find(string=lambda x: x and 'kg var' in x.lower())
            
            kg_yok_elem = soup.find(attrs={'data-odd-type': 'kg_yok'}) or \
                         soup.find(attrs={'data-market': 'kg_yok'}) or \
                         soup.find(string=lambda x: x and 'kg yok' in x.lower())
            
            if kg_var_elem:
                try:
                    # Parent element'ten oran değerini al
                    parent = kg_var_elem.parent if hasattr(kg_var_elem, 'parent') else kg_var_elem
                    odds['kg_var'] = float(parent.get_text(strip=True).replace(',', '.'))
                except:
                    pass
            
            if kg_yok_elem:
                try:
                    parent = kg_yok_elem.parent if hasattr(kg_yok_elem, 'parent') else kg_yok_elem
                    odds['kg_yok'] = float(parent.get_text(strip=True).replace(',', '.'))
                except:
                    pass
        except Exception as e:
            print(f"KG oran parse hatası: {e}")
        
        return odds
    
    def _extract_handikap_odds(self, soup: BeautifulSoup) -> Dict:
        """Handikap oranlarını çıkarır"""
        odds = {}
        try:
            # Handikap 1, X, 2 için
            for h_type in ['h1', 'hx', 'h2']:
                h_elem = soup.find(attrs={'data-odd-type': h_type}) or \
                        soup.find(attrs={'data-market': h_type})
                if h_elem:
                    try:
                        odds[h_type] = float(h_elem.get_text(strip=True).replace(',', '.'))
                    except:
                        pass
        except Exception as e:
            print(f"Handikap oran parse hatası: {e}")
        
        return odds
    
    def _extract_iy_odds(self, soup: BeautifulSoup) -> Dict:
        """İlk Yarı oranlarını çıkarır (İY1, İYX, İY2)"""
        odds = {}
        try:
            for iy_type in ['iy1', 'iyx', 'iy2']:
                iy_elem = soup.find(attrs={'data-odd-type': iy_type}) or \
                         soup.find(attrs={'data-market': iy_type})
                if iy_elem:
                    try:
                        odds[iy_type] = float(iy_elem.get_text(strip=True).replace(',', '.'))
                    except:
                        pass
        except Exception as e:
            print(f"İlk Yarı oran parse hatası: {e}")
        
        return odds
    
    def get_today_matches(self) -> List[Dict]:
        """Bugünkü maçları getirir"""
        today = datetime.now().strftime("%d/%m/%Y")
        return self.get_matches_by_date(today)
    
    def get_upcoming_matches(self, days: int = 7) -> List[Dict]:
        """
        Gelecek günlerdeki maçları getirir
        
        Args:
            days: Kaç gün ileriye bakılacak
        
        Returns:
            Maç listesi
        """
        all_matches = []
        
        for i in range(days):
            date = datetime.now()
            date = date.replace(day=date.day + i)
            date_str = date.strftime("%d/%m/%Y")
            
            matches = self.get_matches_by_date(date_str)
            all_matches.extend(matches)
            
            time.sleep(self.delay)
        
        return all_matches
    
    def get_upcoming_from_live(self) -> List[Dict]:
        """
        Mackolik canlı sonuçlar sayfasından oynanmamış maçları çeker
        https://www.mackolik.com/canli-sonuclar
        
        Returns:
            Oynanmamış maç listesi
        """
        try:
            url = f"{self.base_url}/canli-sonuclar"
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            matches = []
            
            # Canlı sonuçlar sayfasındaki maç satırlarını bul
            # Mackolik'in yapısına göre maç satırları genellikle tr veya div içinde
            match_rows = soup.find_all(['tr', 'div'], class_=lambda x: x and ('match' in str(x).lower() or 'mac' in str(x).lower()))
            
            # Eğer class ile bulamazsak, data attribute'larına bak
            if not match_rows:
                match_rows = soup.find_all(['tr', 'div'], attrs={'data-match-id': True})
            
            # Hala bulamazsak, link'lere bak
            if not match_rows:
                match_links = soup.find_all('a', href=lambda x: x and '/Mac/' in str(x) if x else False)
                for link in match_links:
                    href = link.get('href', '')
                    match_id_match = re.search(r'/Mac/(\d+)', href, re.IGNORECASE)
                    if match_id_match:
                        match_id = match_id_match.group(1)
                        # Link text'inden takım isimlerini çıkar
                        link_text = link.get_text(strip=True)
                        team_match = re.search(r'([A-Za-z\sİıĞğÜüŞşÖöÇç]+)\s*[-–]\s*([A-Za-z\sİıĞğÜüŞşÖöÇç]+)', link_text)
                        
                        if team_match:
                            home_team = team_match.group(1).strip()
                            away_team = team_match.group(2).strip()
                            
                            # Parent element'ten lig ve saat bilgisi al
                            parent = link.find_parent(['tr', 'div', 'li'])
                            league = "Lig"
                            time_str = "00:00"
                            date_str = datetime.now().strftime("%d/%m/%Y")
                            
                            if parent:
                                # Lig bilgisi
                                league_elem = parent.find_previous(['span', 'div'], 
                                                                  class_=lambda x: x and ('league' in str(x).lower() or 'lig' in str(x).lower()))
                                if league_elem:
                                    league = league_elem.get_text(strip=True)
                                
                                # Saat bilgisi
                                time_elem = parent.find(['span', 'div'], 
                                                       class_=lambda x: x and ('time' in str(x).lower() or 'saat' in str(x).lower()))
                                if time_elem:
                                    time_str = time_elem.get_text(strip=True)
                                
                                # Skor kontrolü - eğer skor varsa maç oynanmış demektir
                                score_elem = parent.find(['span', 'div'], 
                                                       class_=lambda x: x and ('score' in str(x).lower() or 'skor' in str(x).lower()))
                                if score_elem:
                                    score_text = score_elem.get_text(strip=True)
                                    # Skor formatı: "0-0", "1-2" gibi
                                    if re.match(r'\d+[-–]\d+', score_text):
                                        continue  # Oynanmış maç, atla
                            
                            # Oynanmamış maçları ekle
                            match_info = {
                                'match_id': match_id,
                                'home_team': home_team,
                                'away_team': away_team,
                                'league': league,
                                'date': date_str,
                                'time': time_str,
                                'status': 'UPCOMING',
                                'odds': {},
                                'source': 'mackolik'
                            }
                            
                            # Oranları çek
                            try:
                                odds_data = self.get_match_odds(match_id)
                                if odds_data:
                                    match_info['odds'] = odds_data.get('odds', {})
                            except:
                                pass
                            
                            matches.append(match_info)
            
            # Duplicate'leri temizle
            seen_ids = set()
            unique_matches = []
            for match in matches:
                match_id = str(match.get('match_id', ''))
                if match_id and match_id not in seen_ids:
                    seen_ids.add(match_id)
                    unique_matches.append(match)
            
            time.sleep(self.delay)
            return unique_matches
            
        except Exception as e:
            print(f"Mackolik canlı sonuçlar hatası: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def get_team_last_matches(self, team_name: str, limit: int = 5) -> List[Dict]:
        """
        Takımın son maçlarını çeker - Kesin ve net, direkt HTML'den parse eder
        Son 30 günün maçlarını tarar ve o takımın oynanmış maçlarını bulur
        
        Args:
            team_name: Takım adı (örn: "Real Betis")
            limit: Kaç maç getirileceği
        
        Returns:
            Son maçlar listesi [{'result': 'W'|'D'|'L', 'score': '2-1'}, ...]
        """
        try:
            print(f"🔄 Son {limit} maç çekiliyor: {team_name}")
            
            from datetime import datetime, timedelta
            
            team_normalized = team_name.lower().strip()
            team_words = [w for w in team_normalized.split() if len(w) > 2]
            matches = []
            
            # Son 30 günün maçlarını HTML'den çek
            for i in range(30):
                date = datetime.now() - timedelta(days=i)
                date_str = date.strftime("%d/%m/%Y")
                
                try:
                    # API'den çek
                    response = self.session.get(f"{self.api_url}?date={date_str}", timeout=10)
                    if response.status_code != 200:
                        continue
                    
                    data = response.json()
                    if not isinstance(data, list):
                        continue
                    
                    for match_data in data:
                        if not isinstance(match_data, list) or len(match_data) < 5:
                            continue
                        
                        # Takım isimlerini al
                        home_team_raw = str(match_data[2]) if len(match_data) > 2 else ''
                        away_team_raw = str(match_data[4]) if len(match_data) > 4 else ''
                        
                        home_team = home_team_raw.lower().strip()
                        away_team = away_team_raw.lower().strip()
                        
                        # Bu takım bu maçta var mı?
                        team_found = False
                        if team_normalized in home_team or team_normalized in away_team:
                            team_found = True
                        elif any(word in home_team or word in away_team for word in team_words):
                            team_found = True
                        
                        if not team_found:
                            continue
                        
                        # Skor bilgisini bul - tüm elemanları kontrol et
                        score = None
                        home_score = None
                        away_score = None
                        
                        for idx, item in enumerate(match_data):
                            item_str = str(item).strip()
                            
                            # Skor formatı: "2-1" veya "2 - 1"
                            if '-' in item_str and any(c.isdigit() for c in item_str):
                                score_match = re.search(r'(\d+)\s*[-–]\s*(\d+)', item_str)
                                if score_match:
                                    home_score = int(score_match.group(1))
                                    away_score = int(score_match.group(2))
                                    score = f"{home_score}-{away_score}"
                                    break
                        
                        # Skor yoksa oynanmamış maç
                        if not score or home_score is None:
                            continue
                        
                        # Sonuca göre W/D/L
                        is_home = team_normalized in home_team
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
                        
                        matches.append({
                            'result': result,
                            'score': score,
                            'date': date_str
                        })
                        
                        if len(matches) >= limit:
                            break
                    
                    if len(matches) >= limit:
                        break
                        
                except Exception as e:
                    continue
                
                time.sleep(0.2)  # Rate limit
            
            # Tarihe göre sırala (en güncel en başta)
            matches.sort(key=lambda x: x.get('date', ''), reverse=True)
            matches = matches[:limit]
            
            print(f"✓ {len(matches)} maç bulundu: {team_name}")
            return [{'result': m['result'], 'score': m['score']} for m in matches]
            
        except Exception as e:
            print(f"Mackolik son maçlar hatası ({team_name}): {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def get_team_squad(self, team_name: str) -> List[Dict]:
        """
        Takımın kadrosunu çeker
        Yeni Mackolik formatı: https://www.mackolik.com/takim/{slug}/kadro
        
        Args:
            team_name: Takım adı (örn: "Real Betis")
        
        Returns:
            Kadro listesi [{'no': '13', 'name': 'Jan Oblak', 'position': 'K', 'age': 33, ...}, ...]
        """
        try:
            team_slug = self._get_team_slug(team_name)
            print(f"🔍 Kadro çekiliyor: {team_name} (slug: {team_slug})")
            
            # Önce takım arama sayfasına git ve kadro linkini bul
            search_url = f"https://www.mackolik.com/arama?q={team_slug.replace('-', '+')}"
            response = self.session.get(search_url, timeout=30)
            
            squad_url = None
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                # Kadro linkini bul
                squad_link = soup.find('a', href=lambda x: x and '/takim/' in str(x) and '/kadro' in str(x) if x else False)
                if squad_link:
                    squad_url = squad_link.get('href')
                    if not squad_url.startswith('http'):
                        squad_url = f"https://www.mackolik.com{squad_url}"
            
            # Kadro linki bulunamadıysa direkt URL dene
            if not squad_url:
                squad_url = f"https://www.mackolik.com/takim/{team_slug}/kadro"
            
            response = self.session.get(squad_url, timeout=30, allow_redirects=True)
            if response.status_code != 200:
                print(f"⚠ Kadro sayfası bulunamadı (HTTP {response.status_code}): {squad_url}")
                return []
            
            soup = BeautifulSoup(response.content, 'html.parser')
            squad = []
            
            # Kadro tablosunu bul - tüm table'ları kontrol et
            tables = soup.find_all('table')
            
            for table in tables:
                rows = table.find_all('tr')
                
                for row in rows:
                    cells = row.find_all(['td', 'th'])
                    if len(cells) < 2:
                        continue
                    
                    # Header satırını atla
                    first_cell = cells[0].get_text(strip=True).lower()
                    if first_cell in ['no', 'numara', 'ad', 'isim', 'pozisyon', 'yaş', 'yaş', 'poz']:
                        continue
                    
                    try:
                        # Hücre sayısına göre parse et
                        no = cells[0].get_text(strip=True) if len(cells) > 0 else ''
                        name = ''
                        position = ''
                        age = None
                        
                        # Farklı formatları dene
                        if len(cells) >= 2:
                            # Format 1: No, Ad, Pozisyon, Yaş
                            name = cells[1].get_text(strip=True)
                            if len(cells) >= 3:
                                position = cells[2].get_text(strip=True)
                            if len(cells) >= 4:
                                age = cells[3].get_text(strip=True)
                        elif len(cells) == 2:
                            # Format 2: Ad, Pozisyon
                            name = cells[0].get_text(strip=True)
                            position = cells[1].get_text(strip=True)
                        
                        # İsim ve pozisyon varsa ekle
                        if name and len(name) > 1:
                            # Pozisyon yoksa varsayılan
                            if not position:
                                position = '-'
                            
                            squad.append({
                                'no': no if no and (no.isdigit() or no == '-') else '-',
                                'name': name,
                                'position': position,
                                'age': age
                            })
                    except Exception as e:
                        continue
            
            # Eğer tablo bulunamadıysa, div'lerden dene
            if not squad:
                # Alternatif: div veya list formatı
                player_divs = soup.find_all(['div', 'li'], class_=lambda x: x and ('player' in str(x).lower() or 'oyuncu' in str(x).lower()) if x else False)
                for div in player_divs:
                    try:
                        text = div.get_text(strip=True)
                        # Basit parse
                        parts = text.split()
                        if len(parts) >= 2:
                            squad.append({
                                'no': '-',
                                'name': ' '.join(parts[:-1]),
                                'position': parts[-1],
                                'age': None
                            })
                    except:
                        continue
            
            print(f"✓ {len(squad)} oyuncu bulundu: {team_name}")
            time.sleep(self.delay)
            return squad
            
        except Exception as e:
            print(f"Mackolik kadro hatası ({team_name}): {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def _get_team_slug(self, team_name: str) -> Optional[str]:
        """
        Takım isminden slug oluşturur (örn: "Real Betis" -> "real-betis")
        """
        slug = team_name.lower().strip()
        # Türkçe karakterleri düzelt
        replacements = {
            'ı': 'i', 'İ': 'i', 'ğ': 'g', 'Ğ': 'g',
            'ü': 'u', 'Ü': 'u', 'ş': 's', 'Ş': 's',
            'ö': 'o', 'Ö': 'o', 'ç': 'c', 'Ç': 'c'
        }
        for tr, en in replacements.items():
            slug = slug.replace(tr, en)
        # Özel karakterleri temizle
        slug = re.sub(r'[^a-z0-9\s-]', '', slug)
        slug = re.sub(r'\s+', '-', slug)
        return slug
    
    def get_team_fixtures_direct(self, team_name: str) -> List[Dict]:
        """
        Direkt canlı sonuçlar sayfasından fikstür çeker
        """
        try:
            print(f"🔍 Fikstür çekiliyor (direkt): {team_name}")
            
            # Canlı sonuçlar sayfasından tüm maçları çek
            live_url = "https://www.mackolik.com/canli-sonuclar"
            response = self.session.get(live_url, timeout=30)
            
            if response.status_code != 200:
                return []
            
            soup = BeautifulSoup(response.content, 'html.parser')
            fixtures = []
            
            team_normalized = team_name.lower().strip()
            team_words = team_normalized.split()
            
            # Tüm maç linklerini bul
            all_links = soup.find_all('a', href=lambda x: x and '/mac/' in str(x).lower() if x else False)
            
            for link in all_links:
                try:
                    link_text = link.get_text(strip=True)
                    link_lower = link_text.lower()
                    
                    # Bu link'te takım ismi var mı?
                    if not any(word in link_lower for word in team_words if len(word) > 2):
                        continue
                    
                    row = link.find_parent('tr')
                    if not row:
                        row = link.find_parent(['div', 'li', 'td'])
                    
                    if not row:
                        continue
                    
                    row_text = row.get_text(separator=' ', strip=True)
                    
                    # Tarih
                    date_match = re.search(r'(\d{1,2})\.(\d{1,2})(?:\.|\s+)(\d{4})', row_text)
                    if not date_match:
                        continue
                    
                    date_str = f"{date_match.group(1)}.{date_match.group(2)}.{date_match.group(3)}"
                    
                    # Skor
                    score_match = re.search(r'(\d+)\s*[-–]\s*(\d+)', row_text)
                    home_score = None
                    away_score = None
                    if score_match:
                        home_score = int(score_match.group(1))
                        away_score = int(score_match.group(2))
                    
                    # Takım isimleri
                    team_links_in_row = row.find_all('a', href=lambda x: x and '/takim/' in str(x).lower() if x else False)
                    if len(team_links_in_row) >= 2:
                        home_team = team_links_in_row[0].get_text(strip=True)
                        away_team = team_links_in_row[1].get_text(strip=True)
                    else:
                        parts = row_text.split('-')
                        if len(parts) >= 2:
                            home_team = re.sub(r'\d+', '', parts[0]).strip()
                            away_team = re.sub(r'\d+', '', parts[1]).strip()
                        else:
                            continue
                    
                    # Lig bilgisi
                    league = 'Lig'
                    prev_row = row.find_previous('tr')
                    if prev_row:
                        prev_text = prev_row.get_text(strip=True)
                        if 'lig' in prev_text.lower() or 'kupa' in prev_text.lower():
                            league = prev_text
                    
                    is_home = team_normalized in home_team.lower()
                    
                    fixtures.append({
                        'date': date_str,
                        'home_team': home_team,
                        'away_team': away_team,
                        'score': f"{home_score}-{away_score}" if home_score is not None and away_score is not None else None,
                        'league': league,
                        'is_home': is_home
                    })
                except:
                    continue
            
            fixtures.sort(key=lambda x: x['date'])
            print(f"✓ {len(fixtures)} fikstür bulundu: {team_name}")
            return fixtures
            
        except Exception as e:
            print(f"Direkt fikstür hatası: {e}")
            return []
    
    def get_team_fixtures(self, team_name: str) -> List[Dict]:
        """
        Takımın tüm fikstürünü çeker (geçmiş + gelecek maçlar)
        Yeni Mackolik formatı: https://www.mackolik.com/takim/{slug}/maçlar/{id}
        
        Args:
            team_name: Takım adı (örn: "Real Betis", "Atlético Madrid")
        
        Returns:
            Fikstür listesi [{'date': '17.08.2025', 'home_team': '...', 'away_team': '...', 'score': '2-1', 'league': '...'}, ...]
        """
        try:
            # Takım slug'ını oluştur
            team_slug = self._get_team_slug(team_name)
            print(f"🔍 Fikstür çekiliyor: {team_name} (slug: {team_slug})")
            
            # Direkt fikstür URL'ini dene (kullanıcının verdiği format)
            # URL formatı: https://www.mackolik.com/takim/{slug}/maçlar/{id}
            # ID'yi bulmak için önce arama yap veya direkt URL'leri dene
            
            # Önce takım arama sayfasına git
            search_url = f"https://www.mackolik.com/arama?q={team_slug.replace('-', '+')}"
            response = self.session.get(search_url, timeout=30)
            
            team_id = None
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                # Takım linkini bul
                team_link = soup.find('a', href=lambda x: x and '/takim/' in str(x) and '/maclar' in str(x) if x else False)
                if team_link:
                    href = team_link.get('href', '')
                    # ID'yi çıkar: /takim/{slug}/maclar/{id}
                    id_match = re.search(r'/maclar/([a-z0-9]+)', href)
                    if id_match:
                        team_id = id_match.group(1)
            
            # Fikstür URL'ini oluştur
            if team_id:
                fixtures_url = f"https://www.mackolik.com/takim/{team_slug}/maclar/{team_id}"
            else:
                # ID yoksa direkt dene
                fixtures_url = f"https://www.mackolik.com/takim/{team_slug}/maclar"
            
            response = self.session.get(fixtures_url, timeout=30, allow_redirects=True)
            
            if response.status_code != 200:
                print(f"⚠ Fikstür sayfası bulunamadı (HTTP {response.status_code}), direkt yöntem deneniyor...")
                # Fallback: direkt canlı sonuçlar sayfasından çek
                return self.get_team_fixtures_direct(team_name)
            
            soup = BeautifulSoup(response.content, 'html.parser')
            fixtures = []
            
            # Tüm maç linklerini bul
            match_links = soup.find_all('a', href=lambda x: x and '/mac/' in str(x).lower() if x else False)
            
            if not match_links:
                # Alternatif: table içinde maçları ara
                tables = soup.find_all('table')
                for table in tables:
                    rows = table.find_all('tr')
                    for row in rows:
                        # Maç linki var mı?
                        link = row.find('a', href=lambda x: x and '/mac/' in str(x).lower() if x else False)
                        if link:
                            match_links.append(link)
            
            print(f"✓ {len(match_links)} maç linki bulundu")
            
            # Her maç linkinden bilgi çıkar
            for link in match_links:
                try:
                    href = link.get('href', '')
                    # Parent row'u bul
                    row = link.find_parent('tr')
                    if not row:
                        row = link.find_parent(['div', 'li', 'td'])
                    
                    if not row:
                        continue
                    
                    row_text = row.get_text(separator=' ', strip=True)
                    
                    # Tarih formatı: "18.08 2025" veya "18.08.2025"
                    date_match = re.search(r'(\d{1,2})\.(\d{1,2})(?:\.|\s+)(\d{4})', row_text)
                    if not date_match:
                        # Alternatif format: "18.08.2025"
                        date_match = re.search(r'(\d{1,2})\.(\d{1,2})\.(\d{4})', row_text)
                    
                    if not date_match:
                        continue
                    
                    date_str = f"{date_match.group(1)}.{date_match.group(2)}.{date_match.group(3)}"
                    
                    # Skor kontrolü
                    score_match = re.search(r'(\d+)\s*[-–]\s*(\d+)', row_text)
                    home_score = None
                    away_score = None
                    if score_match:
                        home_score = int(score_match.group(1))
                        away_score = int(score_match.group(2))
                    
                    # Takım isimlerini bul - link text'lerinden
                    team_links_in_row = row.find_all('a', href=lambda x: x and '/takim/' in str(x).lower() if x else False)
                    if len(team_links_in_row) >= 2:
                        home_team = team_links_in_row[0].get_text(strip=True)
                        away_team = team_links_in_row[1].get_text(strip=True)
                    else:
                        # Text'ten parse et
                        # Format: "Takım1 - Takım2" veya "Takım1 vs Takım2"
                        team_match = re.search(r'([A-Za-z\sİıĞğÜüŞşÖöÇç\.]+)\s*[-–vs]\s*([A-Za-z\sİıĞğÜüŞşÖöÇç\.]+)', row_text)
                        if team_match:
                            home_team = team_match.group(1).strip()
                            away_team = team_match.group(2).strip()
                        else:
                            continue
                    
                    # Lig bilgisi - row'un üstündeki th veya önceki row'dan
                    league = 'Lig'
                    prev_row = row.find_previous('tr')
                    if prev_row:
                        prev_text = prev_row.get_text(strip=True)
                        if 'lig' in prev_text.lower() or 'kupa' in prev_text.lower() or 'champions' in prev_text.lower():
                            league = prev_text
                    
                    # Bu takım ev sahibi mi deplasman mı?
                    is_home = team_name.lower() in home_team.lower()
                    
                    fixture = {
                        'date': date_str,
                        'home_team': home_team,
                        'away_team': away_team,
                        'score': f"{home_score}-{away_score}" if home_score is not None and away_score is not None else None,
                        'league': league,
                        'is_home': is_home
                    }
                    
                    fixtures.append(fixture)
                except Exception as e:
                    continue
            
            # Tarihe göre sırala (en eski en başta)
            fixtures.sort(key=lambda x: x['date'])
            
            print(f"✓ {len(fixtures)} fikstür bulundu: {team_name}")
            time.sleep(self.delay)
            return fixtures
            
        except Exception as e:
            print(f"Mackolik fikstür hatası ({team_name}): {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def _get_team_fixtures_old_format(self, team_name: str) -> List[Dict]:
        """Eski arşiv formatı (fallback)"""
        try:
            team_id_map = {
                'galatasaray': '1', 'fenerbahce': '2', 'fenerbahçe': '2',
                'besiktas': '3', 'beşiktaş': '3', 'trabzonspor': '4',
                'istanbulspor': '45', 'başakşehir': '5', 'basaksehir': '5',
            }
            
            team_key = team_name.lower().strip()
            team_id = team_id_map.get(team_key, None)
            
            if not team_id:
                return []
            
            archive_url = f"https://arsiv.mackolik.com/Takim/{team_id}/{team_name}"
            response = self.session.get(archive_url, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            fixtures = []
            tables = soup.find_all('table')
            
            for table in tables:
                rows = table.find_all('tr')
                current_league = None
                
                for row in rows:
                    row_text = row.get_text(strip=True)
                    if 'lig' in row_text.lower() or 'kupa' in row_text.lower():
                        current_league = row_text
                        continue
                    
                    date_match = re.search(r'(\d{1,2})[./](\d{1,2})[./](\d{4})', row_text)
                    if not date_match:
                        continue
                    
                    date_str = f"{date_match.group(1)}.{date_match.group(2)}.{date_match.group(3)}"
                    score_match = re.search(r'(\d+)\s*[-–]\s*(\d+)', row_text)
                    
                    home_score = None
                    away_score = None
                    if score_match:
                        home_score = int(score_match.group(1))
                        away_score = int(score_match.group(2))
                    
                    team_match = re.search(r'([A-Za-z\sİıĞğÜüŞşÖöÇç\.]+)\s*[-–vs]\s*([A-Za-z\sİıĞğÜüŞşÖöÇç\.]+)', row_text)
                    if not team_match:
                        continue
                    
                    home_team = team_match.group(1).strip()
                    away_team = team_match.group(2).strip()
                    is_home = team_name.lower() in home_team.lower()
                    
                    fixture = {
                        'date': date_str,
                        'home_team': home_team,
                        'away_team': away_team,
                        'score': f"{home_score}-{away_score}" if home_score is not None and away_score is not None else None,
                        'league': current_league or 'Lig',
                        'is_home': is_home
                    }
                    
                    fixtures.append(fixture)
            
            fixtures.reverse()
            return fixtures
            
        except Exception as e:
            print(f"Eski format fikstür hatası: {e}")
            return []
    
    def _scrape_from_website(self, date: str) -> List[Dict]:
        """
        Web scraping ile ana siteden maç bilgilerini çeker
        (API çalışmadığında alternatif yöntem)
        """
        try:
            # Ana sayfadan bugünkü maçları çek
            url = f"{self.base_url}"
            
            # Daha gerçekçi headers
            headers = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
                'Referer': 'https://www.mackolik.com/',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }
            
            try:
                response = self.session.get(url, timeout=30, headers=headers)
                if response.status_code != 200:
                    print(f"⚠ HTTP {response.status_code} hatası")
                    return []
                soup = BeautifulSoup(response.content, 'html.parser')
            except Exception as e:
                print(f"⚠ Bağlantı hatası: {e}")
                return []
            matches = []
            
            # Mackolik'in güncel HTML yapısına göre maçları bul
            # Önce script tag'lerinden JSON data'yı çıkarmayı dene
            scripts = soup.find_all('script')
            json_data = None
            
            for script in scripts:
                if script.string and ('match' in script.string.lower() or 'mac' in script.string.lower()):
                    try:
                        # JSON data'yı bul
                        import json as json_lib
                        # Script içinde JSON objesi ara
                        text = script.string
                        # Basit pattern matching
                        if 'matches' in text or 'events' in text:
                            # JSON parse etmeyi dene
                            pass
                    except:
                        pass
            
            # Mackolik'te maç linklerini bul
            # Format: /Mac/12345 veya /mac/12345
            match_links = []
            for link in soup.find_all('a', href=True):
                href = link.get('href', '')
                # Maç detay sayfası linklerini bul
                if '/Mac/' in href or '/mac/' in href or '/Match/' in href:
                    # Match ID'yi çıkar
                    match_obj = re.search(r'/Mac/(\d+)', href, re.IGNORECASE)
                    if match_obj:
                        match_id = match_obj.group(1)
                        # Link text'inden takım isimlerini çıkar
                        link_text = link.get_text(strip=True)
                        # Parent element'ten daha fazla bilgi al
                        parent = link.find_parent(['div', 'article', 'tr', 'li', 'td'])
                        
                        match_data = {
                            'match_id': match_id,
                            'link': href if href.startswith('http') else f"{self.base_url}{href}",
                            'link_text': link_text,
                            'parent': parent
                        }
                        match_links.append(match_data)
            
            # Duplicate'leri kaldır
            seen_ids = set()
            unique_links = []
            for match_data in match_links:
                if match_data['match_id'] not in seen_ids:
                    seen_ids.add(match_data['match_id'])
                    unique_links.append(match_data)
            
            if not unique_links:
                print(f"⚠ {date} tarihi için maç linki bulunamadı")
                return []
            
            print(f"✓ {len(unique_links)} maç linki bulundu")
            
            # Her maç için detaylı bilgi çek
            for match_data in unique_links[:20]:  # İlk 20 maç
                try:
                    match_info = self._parse_match_from_link(match_data, date)
                    if match_info and match_info.get('home_team') and match_info.get('away_team'):
                        matches.append(match_info)
                except Exception as e:
                    continue
            
            time.sleep(self.delay)
            return matches
            
        except Exception as e:
            print(f"Web scraping hatası: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def _parse_match_from_link(self, match_data: Dict, date: str) -> Optional[Dict]:
        """Maç linkinden maç bilgilerini parse eder"""
        try:
            match_id = match_data['match_id']
            link_text = match_data['link_text']
            parent = match_data.get('parent')
            
            # Takım isimlerini çıkar
            home_team = None
            away_team = None
            
            # Link text'inden çıkar (örn: "Galatasaray - Fenerbahçe")
            team_match = re.search(r'([A-Za-z\sİıĞğÜüŞşÖöÇç]+)\s*[-–]\s*([A-Za-z\sİıĞğÜüŞşÖöÇç]+)', link_text)
            if team_match:
                home_team = team_match.group(1).strip()
                away_team = team_match.group(2).strip()
            
            # Parent element'ten çıkar
            if (not home_team or not away_team) and parent:
                parent_text = parent.get_text(separator=' ', strip=True)
                team_match = re.search(r'([A-Za-z\sİıĞğÜüŞşÖöÇç]+)\s*[-–]\s*([A-Za-z\sİıĞğÜüŞşÖöÇç]+)', parent_text)
                if team_match:
                    home_team = team_match.group(1).strip()
                    away_team = team_match.group(2).strip()
            
            # Hala bulamazsa, maç detay sayfasına git
            if not home_team or not away_team:
                try:
                    match_url = match_data['link']
                    response = self.session.get(match_url, timeout=15)
                    if response.status_code == 200:
                        match_soup = BeautifulSoup(response.content, 'html.parser')
                        title = match_soup.find('title')
                        if title:
                            title_text = title.get_text()
                            team_match = re.search(r'([A-Za-z\sİıĞğÜüŞşÖöÇç]+)\s*[-–]\s*([A-Za-z\sİıĞğÜüŞşÖöÇç]+)', title_text)
                            if team_match:
                                home_team = team_match.group(1).strip()
                                away_team = team_match.group(2).strip()
                except:
                    pass
            
            if not home_team or not away_team:
                return None
            
            # Lig bilgisi (parent'tan veya link'ten)
            league = "Lig"
            if parent:
                # Lig bilgisi genellikle parent'ın üstünde veya yanında
                league_elem = parent.find_previous(['span', 'div'], 
                                                  class_=lambda x: x and ('league' in str(x).lower() or 'lig' in str(x).lower()))
                if league_elem:
                    league = league_elem.get_text(strip=True)
            
            # Saat bilgisi
            time_str = "00:00"
            if parent:
                time_elem = parent.find(['span', 'div'], 
                                       class_=lambda x: x and ('time' in str(x).lower() or 'saat' in str(x).lower()))
                if time_elem:
                    time_str = time_elem.get_text(strip=True)
            
            return {
                'match_id': match_id,
                'home_team': home_team,
                'away_team': away_team,
                'league': league,
                'date': date,
                'time': time_str,
                'odds': {},  # Oranlar için ayrı bir çağrı gerekir
                'source': 'mackolik'
            }
            
        except Exception as e:
            print(f"Link parse hatası: {e}")
            return None
    
    def _parse_match_element(self, element, date: str) -> Optional[Dict]:
        """HTML elementinden maç bilgilerini parse eder"""
        try:
            # Match ID
            match_id = element.get('data-match-id') or element.get('id')
            
            # Link'ten match ID çıkar
            if not match_id:
                link = element.find('a', href=lambda x: x and '/mac/' in str(x).lower() if x else False)
                if link and link.get('href'):
                    href = link.get('href')
                    # /mac/12345 formatından ID çıkar
                    match_obj = re.search(r'/mac/(\d+)', href)
                    if match_obj:
                        match_id = match_obj.group(1)
            
            if not match_id:
                # ID yoksa hash oluştur
                match_id = abs(hash(str(element)[:100]))
            
            # Takım isimleri - daha esnek arama
            home_team = None
            away_team = None
            
            # Önce class bazlı ara
            team_elements = element.find_all(['span', 'div', 'a', 'td', 'p'], 
                                           class_=lambda x: x and any(
                                               keyword in str(x).lower() 
                                               for keyword in ['team', 'takim', 'home', 'away', 'ev', 'deplasman']
                                           ))
            
            if len(team_elements) >= 2:
                home_team = team_elements[0].get_text(strip=True)
                away_team = team_elements[1].get_text(strip=True)
            else:
                # Text içinde takım isimlerini ara
                text = element.get_text(separator=' ', strip=True)
                
                # Yaygın ayırıcılar: " - ", " vs ", " v ", " VS "
                separators = [r' - ', r' vs ', r' v ', r' VS ', r' – ']
                for sep in separators:
                    if re.search(sep, text):
                        parts = re.split(sep, text, maxsplit=1)
                        if len(parts) == 2:
                            home_team = parts[0].strip()
                            away_team = parts[1].strip()
                            # Takım isimlerinden gereksiz karakterleri temizle
                            home_team = re.sub(r'^\d+\s*', '', home_team).strip()
                            away_team = re.sub(r'^\d+\s*', '', away_team).strip()
                            break
                
                # Hala bulamazsa, link text'inden çıkar
                if not home_team or not away_team:
                    links = element.find_all('a')
                    for link in links:
                        link_text = link.get_text(strip=True)
                        if any(sep in link_text for sep in [' - ', ' vs ']):
                            parts = re.split(r' - | vs ', link_text, maxsplit=1)
                            if len(parts) == 2:
                                home_team = parts[0].strip()
                                away_team = parts[1].strip()
                                break
            
            # Takım isimlerini temizle
            if home_team:
                home_team = re.sub(r'\s+', ' ', home_team).strip()
            if away_team:
                away_team = re.sub(r'\s+', ' ', away_team).strip()
            
            if not home_team or not away_team or len(home_team) < 3 or len(away_team) < 3:
                return None
            
            # Lig bilgisi
            league = "Lig"
            league_elem = element.find(['span', 'div', 'td'], 
                                      class_=lambda x: x and ('league' in str(x).lower() or 'lig' in str(x).lower()))
            if league_elem:
                league = league_elem.get_text(strip=True)
            
            # Saat bilgisi
            time_elem = element.find(['span', 'div', 'td'], 
                                   class_=lambda x: x and ('time' in str(x).lower() or 'saat' in str(x).lower()))
            match_time = time_elem.get_text(strip=True) if time_elem else "00:00"
            
            # Oranları çek (eğer element içinde varsa)
            odds = {}
            odds_elements = element.find_all(['span', 'div', 'button'], 
                                            class_=lambda x: x and ('odd' in str(x).lower() or 'oran' in str(x).lower()))
            
            if len(odds_elements) >= 3:
                try:
                    odds['ms1'] = float(odds_elements[0].get_text(strip=True).replace(',', '.'))
                    odds['msx'] = float(odds_elements[1].get_text(strip=True).replace(',', '.'))
                    odds['ms2'] = float(odds_elements[2].get_text(strip=True).replace(',', '.'))
                except:
                    pass
            
            return {
                'match_id': match_id,
                'home_team': home_team,
                'away_team': away_team,
                'league': league,
                'date': date,
                'time': match_time,
                'odds': odds,
                'source': 'mackolik'
            }
            
        except Exception as e:
            print(f"Element parse hatası: {e}")
            return None


if __name__ == "__main__":
    # Test
    scraper = MackolikScraper()
    
    # Bugünkü maçları çek
    print("Bugünkü maçlar çekiliyor...")
    matches = scraper.get_today_matches()
    print(f"Toplam {len(matches)} maç bulundu")
    
    if matches:
        print("\nİlk 3 maç:")
        for match in matches[:3]:
            print(json.dumps(match, indent=2, ensure_ascii=False))
