"""
Veri depolama modülü
Maç verilerini JSON dosyalarında saklar
"""
import os
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from pathlib import Path


class DataStorage:
    """JSON tabanlı veri depolama"""
    
    def __init__(self, data_dir: str = "data/storage"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.matches_file = self.data_dir / "matches.json"
        self.odds_file = self.data_dir / "odds.json"
    
    def save_match(self, match_data: Dict) -> None:
        """Maç verisini kaydeder"""
        matches = self.load_all_matches()
        
        # Match ID'ye göre kontrol et
        match_id = str(match_data.get('match_id', ''))
        
        # Varsa güncelle, yoksa ekle
        existing_index = None
        for i, match in enumerate(matches):
            if str(match.get('match_id', '')) == match_id:
                existing_index = i
                break
        
        if existing_index is not None:
            # Güncelle - oranlar değişmişse history'ye ekle
            existing_match = matches[existing_index]
            if existing_match.get('odds') != match_data.get('odds'):
                if 'odds_history' not in existing_match:
                    existing_match['odds_history'] = []
                existing_match['odds_history'].append({
                    'timestamp': datetime.now().isoformat(),
                    'odds': match_data.get('odds', {})
                })
            
            # Diğer alanları güncelle
            matches[existing_index].update(match_data)
            matches[existing_index]['updated_at'] = datetime.now().isoformat()
        else:
            # Yeni ekle
            match_data['created_at'] = datetime.now().isoformat()
            match_data['updated_at'] = datetime.now().isoformat()
            matches.append(match_data)
        
        self._save_matches(matches)
    
    def save_matches_batch(self, matches: List[Dict]) -> int:
        """Toplu maç kaydetme"""
        saved_count = 0
        for match in matches:
            try:
                self.save_match(match)
                saved_count += 1
            except Exception as e:
                print(f"Maç kayıt hatası: {e}")
                continue
        return saved_count
    
    def load_all_matches(self) -> List[Dict]:
        """Tüm maçları yükler"""
        if not self.matches_file.exists():
            return []
        
        try:
            with open(self.matches_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Veri yükleme hatası: {e}")
            return []
    
    def search_matches(
        self,
        team_name: Optional[str] = None,
        league: Optional[str] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        market_type: Optional[str] = None,
        odds_value: Optional[float] = None,
        limit: int = 100
    ) -> List[Dict]:
        """Maçları arar"""
        all_matches = self.load_all_matches()
        results = []
        
        for match in all_matches:
            # Takım filtresi
            if team_name:
                home = match.get('home_team', '').lower()
                away = match.get('away_team', '').lower()
                team_lower = team_name.lower()
                if team_lower not in home and team_lower not in away:
                    continue
            
            # Lig filtresi
            if league:
                match_league = match.get('league', '').lower()
                if league.lower() not in match_league:
                    continue
            
            # Tarih filtresi
            match_date = match.get('date', '')
            if date_from or date_to:
                try:
                    match_date_obj = datetime.strptime(match_date, "%d/%m/%Y")
                    if date_from:
                        from_obj = datetime.strptime(date_from, "%d/%m/%Y")
                        if match_date_obj < from_obj:
                            continue
                    if date_to:
                        to_obj = datetime.strptime(date_to, "%d/%m/%Y")
                        if match_date_obj > to_obj:
                            continue
                except:
                    pass
            
            # Oran filtresi
            if market_type and odds_value is not None:
                odds = match.get('odds', {})
                market_key = self._normalize_market_key(market_type)
                if market_key in odds:
                    match_odds = odds[market_key]
                    if isinstance(match_odds, (int, float)):
                        if abs(match_odds - odds_value) > 0.01:
                            continue
                else:
                    continue
            
            results.append(match)
            if len(results) >= limit:
                break
        
        return results

    def search_matches_multi_odds(
        self,
        team_name: Optional[str] = None,
        league: Optional[str] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        odds_filters: Optional[Dict[str, float]] = None,
        tolerance: float = 0.01,
        limit: int = 200
    ) -> List[Dict]:
        """Birden fazla oran kriteri ile maç arar"""
        all_matches = self.load_all_matches()
        results = []

        for match in all_matches:
            # Takım filtresi
            if team_name:
                home = match.get('home_team', '').lower()
                away = match.get('away_team', '').lower()
                team_lower = team_name.lower()
                if team_lower not in home and team_lower not in away:
                    continue

            # Lig filtresi
            if league:
                match_league = match.get('league', '').lower()
                if league.lower() not in match_league:
                    continue

            # Tarih filtresi
            match_date = match.get('date', '')
            if date_from or date_to:
                try:
                    match_date_obj = datetime.strptime(match_date, "%d/%m/%Y")
                    if date_from:
                        from_obj = datetime.strptime(date_from, "%d/%m/%Y")
                        if match_date_obj < from_obj:
                            continue
                    if date_to:
                        to_obj = datetime.strptime(date_to, "%d/%m/%Y")
                        if match_date_obj > to_obj:
                            continue
                except Exception:
                    continue

            # Oran filtreleri (birden fazla)
            if odds_filters:
                odds = match.get('odds', {})
                is_match = True
                for key, value in odds_filters.items():
                    market_key = self._normalize_market_key(key)
                    if market_key not in odds:
                        is_match = False
                        break
                    match_odds = odds.get(market_key)
                    if not isinstance(match_odds, (int, float)):
                        is_match = False
                        break
                    if abs(match_odds - value) > tolerance:
                        is_match = False
                        break

                if not is_match:
                    continue

            results.append(match)
            if len(results) >= limit:
                break

        return results

    def search_matches_advanced(
        self,
        home_team: Optional[str] = None,
        away_team: Optional[str] = None,
        league: Optional[str] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        odds_ranges: Optional[Dict[str, Dict[str, Optional[float]]]] = None,
        limit: int = 500
    ) -> List[Dict]:
        """Oran aralığı ve takım filtreleri ile maç arar"""
        all_matches = self.load_all_matches()
        results = []

        for match in all_matches:
            # Ev sahibi filtre
            if home_team:
                home = match.get('home_team', '').lower()
                if home_team.lower() not in home:
                    continue

            # Deplasman filtre
            if away_team:
                away = match.get('away_team', '').lower()
                if away_team.lower() not in away:
                    continue

            # Lig filtresi
            if league:
                match_league = match.get('league', '').lower()
                if league.lower() not in match_league:
                    continue

            # Tarih filtresi
            match_date = match.get('date', '')
            if date_from or date_to:
                try:
                    match_date_obj = datetime.strptime(match_date, "%d/%m/%Y")
                    if date_from:
                        from_obj = datetime.strptime(date_from, "%d/%m/%Y")
                        if match_date_obj < from_obj:
                            continue
                    if date_to:
                        to_obj = datetime.strptime(date_to, "%d/%m/%Y")
                        if match_date_obj > to_obj:
                            continue
                except Exception:
                    continue

            # Oran aralıkları
            if odds_ranges:
                odds = match.get('odds', {})
                is_match = True
                for key, bounds in odds_ranges.items():
                    market_key = self._normalize_market_key(key)
                    if market_key not in odds:
                        is_match = False
                        break
                    match_odds = odds.get(market_key)
                    if not isinstance(match_odds, (int, float)):
                        is_match = False
                        break
                    min_val = bounds.get("from")
                    max_val = bounds.get("to")
                    if min_val is not None and match_odds < min_val:
                        is_match = False
                        break
                    if max_val is not None and match_odds > max_val:
                        is_match = False
                        break
                if not is_match:
                    continue

            results.append(match)
            if len(results) >= limit:
                break

        return results
    
    def get_today_matches(self) -> List[Dict]:
        """Bugünkü maçları getirir"""
        today = datetime.now().strftime("%d/%m/%Y")
        return self.search_matches(date_from=today, date_to=today)
    
    def get_upcoming_matches(self, days: int = 7) -> List[Dict]:
        """Gelecek maçları getirir"""
        today = datetime.now()
        future_date = today + timedelta(days=days)
        today_str = today.strftime("%d/%m/%Y")
        future_str = future_date.strftime("%d/%m/%Y")
        return self.search_matches(date_from=today_str, date_to=future_str)
    
    def _save_matches(self, matches: List[Dict]) -> None:
        """Maçları dosyaya kaydeder"""
        try:
            with open(self.matches_file, 'w', encoding='utf-8') as f:
                json.dump(matches, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"Veri kaydetme hatası: {e}")
            raise
    
    def _normalize_market_key(self, market_type: str) -> str:
        """Oran türü anahtarını normalize eder"""
        market_map = {
            'ms': 'ms1',
            'ms1': 'ms1',
            '1': 'ms1',
            'msx': 'msx',
            'x': 'msx',
            'ms2': 'ms2',
            '2': 'ms2',
            'kg': 'kg_var',
            'kg_var': 'kg_var',
            'kgv': 'kg_var',
            'kg_yok': 'kg_yok',
            'kgy': 'kg_yok',
            'alt': 'alt_2_5',
            'alt_2_5': 'alt_2_5',
            'ust': 'ust_2_5',
            'üst': 'ust_2_5',
            'ust_2_5': 'ust_2_5',
            'üst_2_5': 'ust_2_5',
            'o05': 'o05',
            'u05': 'u05',
            'o15': 'o15',
            'u15': 'u15',
            'o25': 'o25',
            'u25': 'u25',
            'o35': 'o35',
            'u35': 'u35',
            'o45': 'o45',
            'u45': 'u45'
        }
        return market_map.get(market_type.lower().strip(), market_type.lower().strip())
