"""
Doğal dil arama parser'ı
Kullanıcının girdiği metni analiz eder ve arama kriterlerine çevirir
"""
import re
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass


@dataclass
class SearchCriteria:
    """Arama kriterleri"""
    team_names: List[str]
    market_type: Optional[str] = None
    odds_value: Optional[float] = None
    league: Optional[str] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None


class NLPSearchParser:
    """Doğal dil arama parser'ı"""
    
    # Takım adları (Türkçe ligler için yaygın takımlar)
    COMMON_TEAMS = [
        'galatasaray', 'fenerbahçe', 'beşiktaş', 'trabzonspor',
        'başakşehir', 'sivasspor', 'alanyaspor', 'konyaspor',
        'gaziantep', 'antalyaspor', 'kayserispor', 'adana',
        'kasımpaşa', 'hatayspor', 'giresunspor', 'ümiş',
        'ankaragücü', 'istanbulspor', 'karagümrük', 'pendikspor'
    ]
    
    # Oran türü anahtar kelimeleri
    MARKET_KEYWORDS = {
        'ms': ['ms', 'maç sonucu', 'match result'],
        'ms1': ['1', 'ev sahibi', 'home', 'ms1'],
        'msx': ['x', 'beraberlik', 'draw', 'msx'],
        'ms2': ['2', 'deplasman', 'away', 'ms2'],
        'kg_var': ['kg var', 'kgv', 'karşılıklı gol var', 'btts yes', 'kg'],
        'kg_yok': ['kg yok', 'kgy', 'karşılıklı gol yok', 'btts no'],
        'alt_2_5': ['alt', 'alt 2.5', 'under', 'under 2.5'],
        'ust_2_5': ['üst', 'ust', 'üst 2.5', 'ust 2.5', 'over', 'over 2.5'],
        'alt_1_5': ['alt 1.5', 'under 1.5'],
        'ust_1_5': ['üst 1.5', 'ust 1.5', 'over 1.5'],
        'alt_3_5': ['alt 3.5', 'under 3.5'],
        'ust_3_5': ['üst 3.5', 'ust 3.5', 'over 3.5']
    }
    
    def parse(self, query: str) -> SearchCriteria:
        """
        Kullanıcı sorgusunu parse eder
        
        Args:
            query: Kullanıcının girdiği metin
            
        Returns:
            SearchCriteria objesi
        """
        query_lower = query.lower().strip()
        
        # Boş sorgu
        if not query_lower:
            return SearchCriteria(team_names=[])
        
        # Takım adlarını bul
        team_names = self._extract_team_names(query_lower)
        
        # Oran türünü bul
        market_type = self._extract_market_type(query_lower)
        
        # Oran değerini bul
        odds_value = self._extract_odds_value(query_lower)
        
        # Lig adını bul
        league = self._extract_league(query_lower)
        
        # Tarih bilgilerini bul
        date_from, date_to = self._extract_dates(query_lower)
        
        return SearchCriteria(
            team_names=team_names,
            market_type=market_type,
            odds_value=odds_value,
            league=league,
            date_from=date_from,
            date_to=date_to
        )
    
    def _extract_team_names(self, query: str) -> List[str]:
        """Sorgudan takım adlarını çıkarır"""
        found_teams = []
        
        # Yaygın takım adlarını kontrol et
        for team in self.COMMON_TEAMS:
            if team in query:
                found_teams.append(team)
        
        # Genel pattern: büyük harfle başlayan kelimeler (takım adı olabilir)
        # Ancak bu çok genel, bu yüzden sadece bilinen takımları kullanıyoruz
        
        # Kullanıcı direkt takım adı yazmış olabilir (büyük/küçük harf karışık)
        # Örnek: "Galatasaray", "Fenerbahçe"
        words = query.split()
        for word in words:
            word_clean = word.lower().strip('.,!?;:')
            if word_clean in self.COMMON_TEAMS and word_clean not in found_teams:
                found_teams.append(word_clean)
        
        return found_teams
    
    def _extract_market_type(self, query: str) -> Optional[str]:
        """Sorgudan oran türünü çıkarır"""
        query_lower = query.lower()
        
        # Her oran türü için anahtar kelimeleri kontrol et
        for market_type, keywords in self.MARKET_KEYWORDS.items():
            for keyword in keywords:
                if keyword in query_lower:
                    return market_type
        
        return None
    
    def _extract_odds_value(self, query: str) -> Optional[float]:
        """Sorgudan oran değerini çıkarır"""
        # Pattern: sayı (nokta veya virgül ile ondalık)
        # Örnek: "3.00", "3,00", "3", "2.50", "4.25"
        
        # Oran değerleri genellikle 1.0 - 10.0 arası
        patterns = [
            r'\b(\d+[.,]\d{1,2})\b',  # 3.00, 2.50, 4.25
            r'\b([1-9]\d*)\b'  # 3, 4, 5 (tam sayı)
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, query)
            for match in matches:
                try:
                    # Virgülü noktaya çevir
                    value_str = match.replace(',', '.')
                    value = float(value_str)
                    
                    # Oran aralığı kontrolü (1.0 - 50.0 arası makul)
                    if 1.0 <= value <= 50.0:
                        return value
                except ValueError:
                    continue
        
        return None
    
    def _extract_league(self, query: str) -> Optional[str]:
        """Sorgudan lig adını çıkarır"""
        # Yaygın lig isimleri
        leagues = [
            'süper lig', 'super lig', 'premier league', 'la liga',
            'bundesliga', 'serie a', 'ligue 1', 'champions league',
            'europa league', 'conference league'
        ]
        
        query_lower = query.lower()
        for league in leagues:
            if league in query_lower:
                return league
        
        return None
    
    def _extract_dates(self, query: str) -> Tuple[Optional[str], Optional[str]]:
        """Sorgudan tarih bilgilerini çıkarır"""
        # Tarih formatları: DD/MM/YYYY, YYYY-MM-DD, "bugün", "yarın", "geçen hafta"
        
        # Bugün, yarın gibi ifadeler
        if 'bugün' in query.lower() or 'today' in query.lower():
            from datetime import datetime
            today = datetime.now().strftime('%d/%m/%Y')
            return today, today
        
        if 'yarın' in query.lower() or 'tomorrow' in query.lower():
            from datetime import datetime, timedelta
            tomorrow = (datetime.now() + timedelta(days=1)).strftime('%d/%m/%Y')
            return tomorrow, tomorrow
        
        # Tarih pattern'leri
        date_patterns = [
            r'\b(\d{1,2}/\d{1,2}/\d{4})\b',  # DD/MM/YYYY
            r'\b(\d{4}-\d{2}-\d{2})\b'  # YYYY-MM-DD
        ]
        
        dates = []
        for pattern in date_patterns:
            matches = re.findall(pattern, query)
            dates.extend(matches)
        
        if len(dates) >= 2:
            return dates[0], dates[1]
        elif len(dates) == 1:
            return dates[0], None
        
        return None, None
