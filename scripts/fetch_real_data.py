"""
Gerçek veri çekme scripti - Son 1 aylık tüm liglerden veri çeker
"""
import sys
import os
from datetime import datetime, timedelta

# Proje root'unu path'e ekle
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scrapers.mackolik import MackolikScraper
from scrapers.iddaa import IddaaScraper
from utils.data_storage import DataStorage
from utils.firebase import FirebaseService

# Selenium scraper'ı dene (eğer varsa)
try:
    from scrapers.mackolik_selenium import MackolikSeleniumScraper
    SELENIUM_AVAILABLE = True
except ImportError:
    SELENIUM_AVAILABLE = False
    print("⚠ Selenium scraper mevcut değil, normal scraper kullanılacak")

# Lig listesi
LEAGUES = [
    "Süper Lig",
    "Premier League", 
    "La Liga",
    "Bundesliga",
    "Serie A",
    "Ligue 1",
    "Champions League",
    "Europa League",
    "Conference League"
]


def fetch_real_monthly_data():
    """Son 1 aylık gerçek verileri çeker"""
    print("=" * 70)
    print("GERÇEK VERİ ÇEKME İŞLEMİ - SON 1 AYLIK")
    print("=" * 70)
    print("\nLigler: Süper Lig, Premier League, La Liga, Bundesliga, Serie A,")
    print("        Ligue 1, Champions League, Europa League, Conference League")
    print("=" * 70)
    
    storage = DataStorage()
    
    # Scraper seç - önce Selenium, sonra normal
    mackolik_scraper = None
    if SELENIUM_AVAILABLE:
        try:
            print("Selenium scraper başlatılıyor...")
            mackolik_scraper = MackolikSeleniumScraper(headless=True, delay=2.0)
            print("✓ Selenium scraper hazır")
        except Exception as e:
            print(f"⚠ Selenium başlatılamadı: {e}")
            print("⚠ Normal scraper kullanılacak")
            mackolik_scraper = MackolikScraper(delay=1.5)
    else:
        mackolik_scraper = MackolikScraper(delay=1.5)
    
    iddaa_scraper = IddaaScraper(delay=1.5)
    
    # Firebase başlat (opsiyonel)
    firebase_service = None
    try:
        firebase_service = FirebaseService()
        print("✓ Firebase bağlantısı başarılı")
    except Exception as e:
        print(f"⚠ Firebase başlatılamadı: {e}")
        print("⚠ Veriler sadece JSON dosyasına kaydedilecek")
    
    total_saved = 0
    total_firebase_saved = 0
    total_days = 30
    
    # Son 30 günü çek
    for days_back in range(total_days):
        date = datetime.now() - timedelta(days=days_back)
        date_str = date.strftime("%d/%m/%Y")
        
        print(f"\n[{days_back+1}/{total_days}] {date_str} tarihi işleniyor...")
        
        matches = []
        
        # Önce mackolik'i dene
        try:
            matches = mackolik_scraper.get_matches_by_date(date_str)
            if matches:
                print(f"  ✓ Mackolik: {len(matches)} maç")
        except Exception as e:
            print(f"  ✗ Mackolik hatası: {e}")
        
        # Eğer mackolik başarısız olduysa iddaa'yı dene
        if not matches:
            try:
                matches = iddaa_scraper.get_matches_by_date(date_str)
                if matches:
                    print(f"  ✓ İddaa.com: {len(matches)} maç")
            except Exception as e:
                print(f"  ✗ İddaa.com hatası: {e}")
        
        # Kaydet
        if matches:
            # JSON'a kaydet
            saved = storage.save_matches_batch(matches)
            total_saved += saved
            print(f"  ✓ {saved} maç JSON'a kaydedildi")
            
            # Firebase'e kaydet (eğer varsa)
            if firebase_service:
                firebase_count = 0
                for match in matches:
                    try:
                        firebase_service.save_match(match)
                        firebase_count += 1
                    except Exception as e:
                        pass
                if firebase_count > 0:
                    total_firebase_saved += firebase_count
                    print(f"  ✓ {firebase_count} maç Firebase'e kaydedildi")
        else:
            print(f"  ⚠ Maç bulunamadı")
    
    # Selenium driver'ı kapat
    if mackolik_scraper and hasattr(mackolik_scraper, 'close'):
        try:
            mackolik_scraper.close()
        except:
            pass
    
    print("\n" + "=" * 70)
    print(f"İŞLEM TAMAMLANDI!")
    print(f"Toplam kaydedilen maç (JSON): {total_saved}")
    if firebase_service and total_firebase_saved > 0:
        print(f"Toplam kaydedilen maç (Firebase): {total_firebase_saved}")
    print(f"Veri dosyası: {storage.matches_file}")
    print("=" * 70)


if __name__ == "__main__":
    try:
        fetch_real_monthly_data()
    except KeyboardInterrupt:
        print("\n\nİşlem kullanıcı tarafından durduruldu.")
        sys.exit(0)
    except Exception as e:
        print(f"\n\nHata oluştu: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
