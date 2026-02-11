"""
Takım isimlerini logo dosyalarıyla eşleştirir
"""
import os
from typing import Optional
from pathlib import Path


LOGO_BASE_PATH = "/Users/partridge/Downloads/football-logos-master/logos"


def normalize_team_name(team_name: str) -> str:
    """
    Takım ismini normalize eder (karşılaştırma için)
    """
    if not team_name:
        return ""
    
    # Küçük harfe çevir
    normalized = team_name.lower().strip()
    
    # Türkçe karakterleri düzelt
    replacements = {
        'ı': 'i', 'İ': 'i',
        'ğ': 'g', 'Ğ': 'g',
        'ü': 'u', 'Ü': 'u',
        'ş': 's', 'Ş': 's',
        'ö': 'o', 'Ö': 'o',
        'ç': 'c', 'Ç': 'c'
    }
    
    for tr_char, en_char in replacements.items():
        normalized = normalized.replace(tr_char, en_char)
    
    # Özel karakterleri temizle
    normalized = normalized.replace(' ', '').replace('-', '').replace('.', '')
    
    return normalized


def find_logo_file(team_name: str, league: Optional[str] = None) -> Optional[str]:
    """
    Takım ismine göre logo dosyasını bulur
    
    Args:
        team_name: Takım adı (örn: "Galatasaray", "Galatasaray SK")
        league: Lig adı (opsiyonel, eğer verilirse o lig klasöründe arar)
    
    Returns:
        Logo dosya yolu veya None
    """
    if not team_name:
        return None
    
    # Normalize et
    normalized = normalize_team_name(team_name)
    
    # Önce Türkiye Süper Lig'de ara
    turkey_path = os.path.join(LOGO_BASE_PATH, "Türkiye - Süper Lig")
    if os.path.exists(turkey_path):
        logo_file = _search_in_directory(turkey_path, normalized, team_name)
        if logo_file:
            return logo_file
    
    # Eğer lig belirtilmişse, o lig klasöründe ara
    if league:
        league_path = _get_league_path(league)
        if league_path and os.path.exists(league_path):
            logo_file = _search_in_directory(league_path, normalized, team_name)
            if logo_file:
                return logo_file
    
    # Tüm liglerde ara
    if os.path.exists(LOGO_BASE_PATH):
        for league_dir in os.listdir(LOGO_BASE_PATH):
            league_full_path = os.path.join(LOGO_BASE_PATH, league_dir)
            if os.path.isdir(league_full_path):
                logo_file = _search_in_directory(league_full_path, normalized, team_name)
                if logo_file:
                    return logo_file
    
    return None


def _search_in_directory(directory: str, normalized_name: str, original_name: str) -> Optional[str]:
    """
    Belirli bir dizinde logo dosyası arar
    """
    if not os.path.exists(directory):
        return None
    
    # Önce tam eşleşme ara
    for filename in os.listdir(directory):
        if not filename.endswith('.png'):
            continue
        
        # Dosya adını normalize et
        file_normalized = normalize_team_name(filename.replace('.png', ''))
        
        # Tam eşleşme
        if file_normalized == normalized_name:
            return os.path.join(directory, filename)
        
        # Kısmi eşleşme (takım ismi dosya adında geçiyorsa)
        if normalized_name in file_normalized or file_normalized in normalized_name:
            return os.path.join(directory, filename)
    
    # Özel eşleştirmeler (yaygın takım isimleri)
    special_matches = {
        'galatasaray': ['galatasaray'],
        'fenerbahce': ['fenerbahce', 'fenerbahçe'],
        'besiktas': ['besiktas', 'beşiktaş', 'besiktas jk'],
        'trabzonspor': ['trabzonspor'],
        'basaksehir': ['basaksehir', 'başakşehir', 'basaksehir fk'],
        'istanbulspor': ['istanbulspor', 'istanbul spor'],
        'antalyaspor': ['antalyaspor'],
        'konyaspor': ['konyaspor'],
        'sivasspor': ['sivasspor'],
        'alanyaspor': ['alanyaspor'],
        'kasimpasa': ['kasimpasa', 'kasımpaşa'],
        'gaziantep': ['gaziantep', 'gaziantep fk'],
        'kayserispor': ['kayserispor'],
        'fatihkaragumruk': ['fatih karagumruk', 'fatih karagümrük'],
        'rize': ['caykur rizespor', 'rize', 'çaykur rizespor'],
        'samsunspor': ['samsunspor'],
        'goztepe': ['goztepe', 'göztepe'],
        'eyupspor': ['eyupspor', 'eyüpspor'],
        'kocaelispor': ['kocaelispor'],
        'genclerbirligi': ['genclerbirligi', 'gençlerbirliği'],
    }
    
    for key, variations in special_matches.items():
        if normalized_name in variations or any(v in normalized_name for v in variations):
            for filename in os.listdir(directory):
                if not filename.endswith('.png'):
                    continue
                file_normalized = normalize_team_name(filename.replace('.png', ''))
                if key in file_normalized or file_normalized in key:
                    return os.path.join(directory, filename)
    
    return None


def _get_league_path(league: str) -> Optional[str]:
    """
    Lig adından logo klasör yolunu döndürür
    """
    if not league:
        return None
    
    league_lower = league.lower()
    
    # Lig eşleştirmeleri
    league_map = {
        'türkiye': 'Türkiye - Süper Lig',
        'turkey': 'Türkiye - Süper Lig',
        'super lig': 'Türkiye - Süper Lig',
        'süper lig': 'Türkiye - Süper Lig',
        'premier league': 'England - Premier League',
        'premier': 'England - Premier League',
        'la liga': 'Spain - LaLiga',
        'serie a': 'Italy - Serie A',
        'bundesliga': 'Germany - Bundesliga',
        'ligue 1': 'France - Ligue 1',
        'eredivisie': 'Netherlands - Eredivisie',
        'liga portugal': 'Portugal - Liga Portugal',
        'scottish premiership': 'Scotland - Scottish Premiership',
        'champions league': None,  # Özel durum
        'europa league': None,
    }
    
    for key, folder_name in league_map.items():
        if key in league_lower:
            if folder_name:
                return os.path.join(LOGO_BASE_PATH, folder_name)
            return None
    
    return None


def get_logo_url(team_name: str, league: Optional[str] = None) -> Optional[str]:
    """
    Logo dosya yolunu web URL'ine çevirir (frontend için)
    
    Returns:
        /api/logo/{league}/{filename} formatında URL veya None
    """
    logo_path = find_logo_file(team_name, league)
    
    if not logo_path:
        return None
    
    # Logo base path'ini çıkar
    relative_path = os.path.relpath(logo_path, LOGO_BASE_PATH)
    
    # URL formatına çevir
    # Örnek: "Türkiye - Süper Lig/Galatasaray.png" -> "/api/logo/Türkiye%20-%20Süper%20Lig/Galatasaray.png"
    from urllib.parse import quote
    parts = relative_path.split(os.sep)
    encoded_parts = [quote(part, safe='') for part in parts]
    
    return f"/api/logo/{'/'.join(encoded_parts)}"
