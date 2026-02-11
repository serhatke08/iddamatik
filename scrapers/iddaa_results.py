"""
İddaa.com Biten Maçlar Scraper
Dünkü ve geçmiş maç sonuçlarını çeker
"""
import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import time
import re
from fake_useragent import UserAgent

ua = UserAgent()


class IddaaResultsScraper:
    """İddaa.com'dan biten maç sonuçlarını çeker"""
    
    def __init__(self, delay: float = 2.0):
        self.base_url = "https://www.iddaa.com"
        # Farklı URL'leri dene
        self.results_urls = [
            "https://www.iddaa.com/bitenmaclar",
            "https://www.iddaa.com/bitenmaclar/index.htm",
            "https://www.iddaa.com/sonuclar",
            "https://www.iddaa.com",
        ]
        self.delay = delay
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Referer': 'https://www.iddaa.com/'
        })
    
    def get_yesterday_matches(self) -> List[Dict]:
        """
        Dünkü biten maçları getirir
        
        Returns:
            Maç listesi
        """
        yesterday = datetime.now() - timedelta(days=1)
        return self.get_matches_by_date(yesterday.strftime("%d/%m/%Y"))
    
    def get_matches_by_date(self, date: str) -> List[Dict]:
        """
        Belirli bir tarihteki biten maçları getirir
        
        Args:
            date: Tarih formatı DD/MM/YYYY (örn: "21/01/2026")
        
        Returns:
            Maç listesi
        """
        matches = []
        
        try:
            # Farklı URL'leri dene
            soup = None
            for url in self.results_urls:
                try:
                    response = self.session.get(url, timeout=30)
                    if response.status_code == 200:
                        soup = BeautifulSoup(response.content, 'html.parser')
                        print(f"  ✓ Sayfa yüklendi: {url}")
                        break
                except:
                    continue
            
            if not soup:
                print("  ✗ Hiçbir URL çalışmadı")
                return []
            
            # Maç elementlerini bul
            # İddaa.com'un HTML yapısına göre parse et
            match_elements = self._find_match_elements(soup, date)
            
            for element in match_elements:
                match_data = self._parse_match_element(element, date)
                if match_data:
                    matches.append(match_data)
            
            time.sleep(self.delay)
            
        except requests.exceptions.RequestException as e:
            print(f"İddaa.com biten maçlar hatası: {e}")
        except Exception as e:
            print(f"Parse hatası: {e}")
        
        return matches
    
    def _find_match_elements(self, soup: BeautifulSoup, target_date: str) -> List:
        """Maç elementlerini bulur"""
        match_elements = []
        
        # Çeşitli selector'lar dene
        selectors = [
            ('tr', {'class': lambda x: x and 'match' in str(x).lower()}),
            ('div', {'class': lambda x: x and 'match' in str(x).lower()}),
            ('li', {'class': lambda x: x and 'match' in str(x).lower()}),
            ('div', {'data-match-id': True}),
            ('tr', {'data-date': True}),
        ]
        
        for tag, attrs in selectors:
            elements = soup.find_all(tag, attrs)
            if elements:
                # Tarih filtresi uygula
                for elem in elements:
                    elem_date = self._extract_date_from_element(elem)
                    if elem_date == target_date or not target_date:
                        match_elements.append(elem)
                if match_elements:
                    break
        
        # Eğer hiç element bulunamadıysa, tüm tablo satırlarını kontrol et
        if not match_elements:
            all_rows = soup.find_all('tr')
            for row in all_rows:
                text = row.get_text()
                # Takım isimleri ve skor içeren satırları bul
                if re.search(r'\d+\s*[-–]\s*\d+', text) and len(text) > 20:
                    match_elements.append(row)
        
        return match_elements[:100]  # İlk 100 maç
    
    def _extract_date_from_element(self, element) -> Optional[str]:
        """Element'ten tarih bilgisini çıkarır"""
        # data-date attribute'u
        date_attr = element.get('data-date', '')
        if date_attr:
            try:
                # Farklı formatları dene
                if '/' in date_attr:
                    return date_attr
                elif '-' in date_attr:
                    # YYYY-MM-DD -> DD/MM/YYYY
                    parts = date_attr.split('-')
                    if len(parts) == 3:
                        return f"{parts[2]}/{parts[1]}/{parts[0]}"
            except:
                pass
        
        # Parent'larda ara
        parent = element.parent
        for _ in range(3):  # Max 3 seviye yukarı
            if parent:
                date_attr = parent.get('data-date', '')
                if date_attr:
                    return date_attr
                parent = parent.parent
        
        return None
    
    def _parse_match_element(self, element, date: str) -> Optional[Dict]:
        """Maç elementini parse eder"""
        try:
            text = element.get_text(separator=' ', strip=True)
            
            # Match ID bul
            match_id = None
            href = element.find('a', href=True)
            if href:
                href_val = href.get('href', '')
                match_obj = re.search(r'/(\d+)', href_val)
                if match_obj:
                    match_id = match_obj.group(1)
            
            if not match_id:
                # data-match-id attribute'u
                match_id = element.get('data-match-id', '')
                if not match_id:
                    # Hash ile oluştur
                    match_id = str(abs(hash(f"{text}{date}")))[:10]
            
            # Takım isimlerini bul
            home_team = None
            away_team = None
            
            # Pattern: "Takım1 - Takım2" veya "Takım1 vs Takım2"
            team_patterns = [
                r'([A-ZÇĞİÖŞÜ][a-zçğıöşüA-ZÇĞİÖŞÜ\s]+?)\s*[-–]\s*([A-ZÇĞİÖŞÜ][a-zçğıöşüA-ZÇĞİÖŞÜ\s]+?)(?:\s+\d+|\s*$)',
                r'([A-ZÇĞİÖŞÜ][a-zçğıöşüA-ZÇĞİÖŞÜ\s]+?)\s+vs\s+([A-ZÇĞİÖŞÜ][a-zçğıöşüA-ZÇĞİÖŞÜ\s]+?)(?:\s+\d+|\s*$)',
            ]
            
            for pattern in team_patterns:
                match = re.search(pattern, text)
                if match:
                    home_team = match.group(1).strip()
                    away_team = match.group(2).strip()
                    break
            
            if not home_team or not away_team:
                return None
            
            # Skor bul
            score_match = re.search(r'(\d+)\s*[-–]\s*(\d+)', text)
            home_score = None
            away_score = None
            if score_match:
                home_score = int(score_match.group(1))
                away_score = int(score_match.group(2))
            
            # Saat bul
            time_str = "00:00"
            time_match = re.search(r'(\d{1,2}):(\d{2})', text)
            if time_match:
                time_str = f"{time_match.group(1).zfill(2)}:{time_match.group(2)}"
            
            # Lig bul
            league = "Lig"
            # Parent'larda lig bilgisi ara
            parent = element.parent
            for _ in range(5):
                if parent:
                    parent_text = parent.get_text()
                    # Lig isimleri pattern'i
                    league_match = re.search(r'(Süper Lig|Premier League|La Liga|Bundesliga|Serie A|Ligue 1|Champions League|Europa League)', parent_text, re.IGNORECASE)
                    if league_match:
                        league = league_match.group(1)
                        break
                    parent = parent.parent
            
            # Oranlar - biten maçlarda genelde yok, ama varsa çek
            odds = {}
            odds_elements = element.find_all(['span', 'div'], class_=lambda x: x and ('odd' in str(x).lower() or 'oran' in str(x).lower()))
            for odd_elem in odds_elements:
                odd_text = odd_elem.get_text(strip=True)
                try:
                    odd_value = float(odd_text.replace(',', '.'))
                    # Oran tipini belirle (basit bir yaklaşım)
                    if 'ms1' in str(odd_elem.get('class', [])).lower() or '1' in odd_text:
                        odds['ms1'] = odd_value
                    elif 'msx' in str(odd_elem.get('class', [])).lower() or 'x' in odd_text.lower():
                        odds['msx'] = odd_value
                    elif 'ms2' in str(odd_elem.get('class', [])).lower() or '2' in odd_text:
                        odds['ms2'] = odd_value
                except:
                    pass
            
            return {
                'match_id': match_id,
                'home_team': home_team,
                'away_team': away_team,
                'league': league,
                'date': date,
                'time': time_str,
                'status': 'PAST',
                'odds': odds,
                'source': 'iddaa',
                'home_score': home_score,
                'away_score': away_score,
                'result': f"{home_score}-{away_score}" if home_score is not None and away_score is not None else None
            }
            
        except Exception as e:
            print(f"Parse hatası: {e}")
            return None
    
    def get_all_past_matches(self, days: int = 30) -> List[Dict]:
        """
        Son N günün biten maçlarını getirir
        
        Args:
            days: Kaç gün geriye gidilecek
        
        Returns:
            Tüm maçların listesi
        """
        all_matches = []
        
        for i in range(days):
            date = datetime.now() - timedelta(days=i)
            date_str = date.strftime("%d/%m/%Y")
            print(f"[{i+1}/{days}] {date_str} tarihi çekiliyor...")
            
            matches = self.get_matches_by_date(date_str)
            if matches:
                print(f"  ✓ {len(matches)} maç bulundu")
                all_matches.extend(matches)
            
            time.sleep(self.delay)
        
        return all_matches
