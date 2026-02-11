"""
Dünkü maçları çek ve kaydet
"""
import sys
import os
from datetime import datetime, timedelta

# Proje root'unu path'e ekle
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scrapers.iddaa_selenium_results import IddaaSeleniumResultsScraper
from utils.data_storage import DataStorage
from utils.firebase import FirebaseService


def fetch_yesterday_matches():
    """Dünkü maçları çeker ve kaydeder"""
    print("=" * 70)
    print("DÜNKÜ MAÇLARI ÇEKME İŞLEMİ")
    print("=" * 70)
    
    scraper = IddaaSeleniumResultsScraper(headless=True, delay=2.0)
    storage = DataStorage()
    
    # Firebase başlat (opsiyonel)
    firebase_service = None
    try:
        firebase_service = FirebaseService()
        if firebase_service.db:
            print("✓ Firebase bağlantısı başarılı")
    except Exception as e:
        print(f"⚠ Firebase başlatılamadı: {e}")
        print("⚠ Veriler sadece JSON dosyasına kaydedilecek")
    
    # Dünkü maçları çek
    yesterday = datetime.now() - timedelta(days=1)
    date_str = yesterday.strftime("%d/%m/%Y")
    
    print(f"\nDünkü tarih: {date_str}")
    print("Maçlar çekiliyor...\n")
    
    matches = scraper.get_matches_by_date(date_str)
    
    if matches:
        print(f"✓ {len(matches)} maç bulundu")
        
        # JSON'a kaydet
        saved = storage.save_matches_batch(matches)
        print(f"✓ {saved} maç JSON'a kaydedildi")
        
        # Firebase'e kaydet
        if firebase_service and firebase_service.db:
            firebase_count = 0
            for match in matches:
                try:
                    firebase_service.save_match(match)
                    firebase_count += 1
                except Exception as e:
                    print(f"  ⚠ Firebase kayıt hatası: {e}")
            if firebase_count > 0:
                print(f"✓ {firebase_count} maç Firebase'e kaydedildi")
        
        # İlk 5 maçı göster
        print("\nİlk 5 maç:")
        for i, match in enumerate(matches[:5], 1):
            result = match.get('result', 'N/A')
            print(f"  {i}. {match['home_team']} vs {match['away_team']} - {result} ({match.get('league', '?')})")
    else:
        print("⚠ Maç bulunamadı")
        print("\nNot: İddaa.com sayfası JS ile render ediliyor.")
        print("     Selenium ile erişim sağlandı ancak veri bulunamadı.")
    
    try:
        scraper.close()
    except Exception:
        pass
    
    print("\n" + "=" * 70)
    print("İŞLEM TAMAMLANDI!")
    print(f"Veri dosyası: {storage.matches_file}")
    print("=" * 70)


if __name__ == "__main__":
    try:
        fetch_yesterday_matches()
    except KeyboardInterrupt:
        print("\n\nİşlem kullanıcı tarafından durduruldu.")
        sys.exit(0)
    except Exception as e:
        print(f"\n\nHata oluştu: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
