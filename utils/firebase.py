"""
Firebase Firestore entegrasyonu
Maç ve oran verilerini Firebase'de saklar ve sorgular
"""
import os
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import json

try:
    from google.cloud import firestore
    from google.oauth2 import service_account
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False
    print("⚠ Firebase modülleri yüklü değil. Firebase özellikleri devre dışı.")

try:
    import config
except ImportError:
    config = None


class FirebaseService:
    """Firebase Firestore servisi"""
    
    def __init__(self):
        """Firebase bağlantısını başlatır"""
        self.db = None
        self._initialize_firestore()
    
    def _initialize_firestore(self):
        """Firestore bağlantısını başlatır"""
        if not FIREBASE_AVAILABLE:
            raise ImportError("Firebase modülleri yüklü değil. 'pip install google-cloud-firestore google-auth' komutu ile yükleyin.")
        
        try:
            # Firebase credentials dosyası kontrolü
            creds_path = os.getenv('FIREBASE_CREDENTIALS_PATH')
            
            if creds_path and os.path.exists(creds_path):
                # Service account credentials ile bağlan
                credentials = service_account.Credentials.from_service_account_file(creds_path)
                self.db = firestore.Client(credentials=credentials)
            else:
                # Varsayılan credentials (GOOGLE_APPLICATION_CREDENTIALS env var)
                self.db = firestore.Client()
            
            print("✓ Firebase Firestore bağlantısı başarılı")
        except Exception as e:
            print(f"⚠ Firebase bağlantı hatası: {e}")
            print("⚠ Firebase credentials dosyasını kontrol edin")
            raise
    
    def save_match(self, match_data: Dict) -> str:
        """
        Maç verisini Firestore'a kaydeder
        
        Args:
            match_data: Maç verisi dict'i
            
        Returns:
            Document ID
        """
        try:
            # Match ID'yi unique key olarak kullan
            match_id = match_data.get('match_id')
            if not match_id:
                match_id = self._generate_match_id(match_data)
            
            # Tarih ve saat bilgisini datetime'a çevir
            match_datetime = self._parse_match_datetime(match_data)
            
            # Firestore document yapısı
            doc_data = {
                'match_id': match_id,
                'home_team': match_data.get('home_team', ''),
                'away_team': match_data.get('away_team', ''),
                'league': match_data.get('league', ''),
                'date': match_data.get('date', ''),
                'time': match_data.get('time', ''),
                'match_datetime': match_datetime,
                'status': self._determine_match_status(match_datetime),
                'odds': match_data.get('odds', {}),
                'odds_history': [{
                    'timestamp': firestore.SERVER_TIMESTAMP,
                    'odds': match_data.get('odds', {})
                }],
                'source': match_data.get('source', 'mackolik'),
                'created_at': firestore.SERVER_TIMESTAMP,
                'updated_at': firestore.SERVER_TIMESTAMP
            }
            
            # Collection: matches
            # Document ID: match_id
            doc_ref = self.db.collection('matches').document(str(match_id))
            
            # Mevcut dokümanı kontrol et
            existing_doc = doc_ref.get()
            
            if existing_doc.exists:
                # Güncelle - sadece değişen alanları güncelle
                existing_data = existing_doc.to_dict()
                
                # Oranlar değişmişse history'ye ekle
                if existing_data.get('odds') != doc_data['odds']:
                    existing_history = existing_data.get('odds_history', [])
                    existing_history.append({
                        'timestamp': firestore.SERVER_TIMESTAMP,
                        'odds': doc_data['odds']
                    })
                    doc_data['odds_history'] = existing_history
                
                # Mevcut veriyi koru, sadece güncelle
                doc_data['created_at'] = existing_data.get('created_at')
                doc_ref.update(doc_data)
            else:
                # Yeni doküman oluştur
                doc_ref.set(doc_data)
            
            return str(match_id)
            
        except Exception as e:
            print(f"Firebase kayıt hatası: {e}")
            raise
    
    def get_matches(
        self,
        team_name: Optional[str] = None,
        league: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        status: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict]:
        """
        Maçları sorgular
        
        Args:
            team_name: Takım adı (ev sahibi veya deplasman)
            league: Lig adı
            date_from: Başlangıç tarihi
            date_to: Bitiş tarihi
            status: PAST, TODAY, UPCOMING
            limit: Maksimum sonuç sayısı
            
        Returns:
            Maç listesi
        """
        try:
            query = self.db.collection('matches')
            
            # Filtreler
            if team_name:
                # Ev sahibi veya deplasman takımı
                query = query.where('home_team', '==', team_name).limit(limit)
                # Not: Firestore'da OR sorgusu yok, bu yüzden iki ayrı sorgu yapılabilir
                # Şimdilik sadece home_team ile filtreliyoruz
            
            if league:
                query = query.where('league', '==', league)
            
            if date_from:
                query = query.where('match_datetime', '>=', date_from)
            
            if date_to:
                query = query.where('match_datetime', '<=', date_to)
            
            if status:
                query = query.where('status', '==', status)
            
            # Sıralama
            query = query.order_by('match_datetime', direction=firestore.Query.DESCENDING)
            
            # Limit
            query = query.limit(limit)
            
            # Sorguyu çalıştır
            docs = query.stream()
            
            matches = []
            for doc in docs:
                match_data = doc.to_dict()
                match_data['id'] = doc.id
                matches.append(match_data)
            
            return matches
            
        except Exception as e:
            print(f"Firebase sorgu hatası: {e}")
            return []
    
    def search_matches_by_odds(
        self,
        market_type: str,
        odds_value: float,
        tolerance: float = 0.01
    ) -> List[Dict]:
        """
        Oran değerine göre maçları arar
        
        Args:
            market_type: Oran türü (ms1, msx, ms2, kg_var, kg_yok, alt_2_5, ust_2_5, vb.)
            odds_value: Oran değeri
            tolerance: Tolerans (örn: 3.00 için 2.99-3.01 arası)
            
        Returns:
            Maç listesi
        """
        try:
            # Tüm maçları çek (Firestore'da range query yok, bu yüzden client-side filtreleme)
            query = self.db.collection('matches')
            docs = query.stream()
            
            matches = []
            for doc in docs:
                match_data = doc.to_dict()
                odds = match_data.get('odds', {})
                
                # Oran türüne göre kontrol et
                market_key = self._normalize_market_key(market_type)
                if market_key in odds:
                    match_odds_value = odds[market_key]
                    if isinstance(match_odds_value, (int, float)):
                        if abs(match_odds_value - odds_value) <= tolerance:
                            match_data['id'] = doc.id
                            matches.append(match_data)
            
            return matches
            
        except Exception as e:
            print(f"Oran arama hatası: {e}")
            return []
    
    def get_today_matches(self) -> List[Dict]:
        """Bugünkü maçları getirir"""
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        
        return self.get_matches(
            date_from=today_start,
            date_to=today_end,
            status='TODAY'
        )
    
    def get_upcoming_matches(self, days: int = 7) -> List[Dict]:
        """Gelecek maçları getirir"""
        now = datetime.now()
        future_date = now + timedelta(days=days)
        
        return self.get_matches(
            date_from=now,
            date_to=future_date,
            status='UPCOMING'
        )
    
    def _generate_match_id(self, match_data: Dict) -> str:
        """Unique match ID oluşturur"""
        home = match_data.get('home_team', '').lower().strip()
        away = match_data.get('away_team', '').lower().strip()
        date = match_data.get('date', '').replace('/', '')
        time = match_data.get('time', '').replace(':', '')
        
        return f"{home}_{away}_{date}_{time}"
    
    def _parse_match_datetime(self, match_data: Dict) -> datetime:
        """Maç tarih ve saatini datetime'a çevirir"""
        try:
            date_str = match_data.get('date', '')
            time_str = match_data.get('time', '00:00')
            
            # Tarih formatı: DD/MM/YYYY
            if '/' in date_str:
                date_parts = date_str.split('/')
                if len(date_parts) == 3:
                    day, month, year = int(date_parts[0]), int(date_parts[1]), int(date_parts[2])
                    
                    # Saat formatı: HH:MM
                    if ':' in time_str:
                        hour, minute = map(int, time_str.split(':'))
                    else:
                        hour, minute = 0, 0
                    
                    return datetime(year, month, day, hour, minute)
        except Exception as e:
            print(f"Tarih parse hatası: {e}")
        
        # Varsayılan: şu an
        return datetime.now()
    
    def _determine_match_status(self, match_datetime: datetime) -> str:
        """Maç durumunu belirler: PAST, TODAY, UPCOMING"""
        now = datetime.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        
        if match_datetime < now:
            return 'PAST'
        elif today_start <= match_datetime < today_end:
            return 'TODAY'
        else:
            return 'UPCOMING'
    
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
            'ust_2_5': 'ust_2_5',
            'üst': 'ust_2_5',
            'üst_2_5': 'ust_2_5'
        }
        
        market_lower = market_type.lower().strip()
        return market_map.get(market_lower, market_lower)
