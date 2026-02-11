"""
Takım verilerini cache'leme modülü
API çağrılarını minimize etmek için
"""
import json
import os
from datetime import datetime, timedelta
from typing import Optional, Dict
from pathlib import Path


CACHE_DIR = Path(__file__).parent.parent / 'data' / 'team_cache'
CACHE_DURATION_HOURS = 24  # Cache 24 saat geçerli


def ensure_cache_dir():
    """Cache klasörünü oluştur"""
    CACHE_DIR.mkdir(parents=True, exist_ok=True)


def get_cache_key(team_name: str, match_date: str) -> str:
    """
    Cache key oluştur
    team_name: Takım adı
    match_date: Maç tarihi (DD/MM/YYYY)
    """
    # Tarihi normalize et
    normalized_name = team_name.lower().strip().replace(' ', '_')
    normalized_date = match_date.replace('/', '_')
    return f"{normalized_name}_{normalized_date}"


def get_cached_team_data(team_name: str, match_date: str) -> Optional[Dict]:
    """
    Cache'den takım verisini getir
    
    Args:
        team_name: Takım adı
        match_date: Maç tarihi (DD/MM/YYYY)
    
    Returns:
        Cache'den veri veya None
    """
    ensure_cache_dir()
    cache_key = get_cache_key(team_name, match_date)
    cache_file = CACHE_DIR / f"{cache_key}.json"
    
    if not cache_file.exists():
        return None
    
    try:
        with open(cache_file, 'r', encoding='utf-8') as f:
            cached_data = json.load(f)
        
        # Cache süresini kontrol et
        cached_time = datetime.fromisoformat(cached_data.get('cached_at', ''))
        if datetime.now() - cached_time > timedelta(hours=CACHE_DURATION_HOURS):
            # Cache süresi dolmuş
            cache_file.unlink()
            return None
        
        return cached_data.get('data')
    
    except (json.JSONDecodeError, ValueError, KeyError):
        # Bozuk cache dosyasını sil
        if cache_file.exists():
            cache_file.unlink()
        return None


def save_team_data_to_cache(team_name: str, match_date: str, data: Dict):
    """
    Takım verisini cache'e kaydet
    
    Args:
        team_name: Takım adı
        match_date: Maç tarihi (DD/MM/YYYY)
        data: Kaydedilecek veri
    """
    ensure_cache_dir()
    cache_key = get_cache_key(team_name, match_date)
    cache_file = CACHE_DIR / f"{cache_key}.json"
    
    cache_entry = {
        'cached_at': datetime.now().isoformat(),
        'team_name': team_name,
        'match_date': match_date,
        'data': data
    }
    
    try:
        with open(cache_file, 'w', encoding='utf-8') as f:
            json.dump(cache_entry, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Cache kaydetme hatası: {e}")


def clear_old_cache(days: int = 7):
    """
    Eski cache dosyalarını temizle
    
    Args:
        days: Kaç günden eski cache'leri temizle
    """
    ensure_cache_dir()
    cutoff_time = datetime.now() - timedelta(days=days)
    
    for cache_file in CACHE_DIR.glob('*.json'):
        try:
            mtime = datetime.fromtimestamp(cache_file.stat().st_mtime)
            if mtime < cutoff_time:
                cache_file.unlink()
        except Exception:
            continue
