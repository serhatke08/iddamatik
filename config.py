"""
Yapılandırma dosyası
"""
import os
from dotenv import load_dotenv

load_dotenv()

# Veri kaynakları
DATA_SOURCES = {
    'mackolik': {
        'base_url': 'https://www.mackolik.com',
        'api_url': 'http://goapi.mackolik.com/livedata',
        'enabled': True
    },
    'iddaa': {
        'base_url': 'https://www.iddaa.com',
        'enabled': True
    },
    'tuttur': {
        'base_url': 'https://www.tuttur.com',
        'enabled': False
    }
}

# Scraping ayarları
SCRAPING_CONFIG = {
    'delay_between_requests': 2,  # Saniye cinsinden
    'timeout': 30,
    'retry_count': 3,
    'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

# Veri saklama
DATA_DIR = 'data'
MATCHES_DIR = os.path.join(DATA_DIR, 'matches')
ODDS_DIR = os.path.join(DATA_DIR, 'odds')
RESULTS_DIR = os.path.join(DATA_DIR, 'results')

# Veritabanı (opsiyonel)
DATABASE_CONFIG = {
    'enabled': False,
    'type': 'sqlite',  # sqlite, postgresql, mysql
    'path': 'idaamatik.db'
}
