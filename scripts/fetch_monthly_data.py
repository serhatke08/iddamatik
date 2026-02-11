"""
Son 1 aylık verileri çeker ve kaydeder
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


def fetch_monthly_data():
    """Son 1 aylık verileri çeker"""
    print("=" * 60)
    print("Son 1 Aylık Veri Çekme İşlemi")
    print("=" * 60)
    
    storage = DataStorage()
    mackolik_scraper = MackolikScraper(delay=2.0)
    iddaa_scraper = IddaaScraper(delay=2.0)
    
    # Firebase başlat (opsiyonel)
    firebase_service = None
    try:
        firebase_service = FirebaseService()
        print("✓ Firebase bağlantısı başarılı")
    except Exception as e:
        print(f"⚠ Firebase başlatılamadı: {e}")
        print("⚠ Veriler sadece JSON dosyasına kaydedilecek")
    
    all_matches = []
    total_saved = 0
    total_firebase_saved = 0
    
    # Son 30 günü çek
    for days_back in range(30):
        date = datetime.now() - timedelta(days=days_back)
        date_str = date.strftime("%d/%m/%Y")
        
        print(f"\n[{days_back+1}/30] {date_str} tarihi işleniyor...")
        
        # Önce mackolik'i dene
        matches = []
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
    
    print("\n" + "=" * 60)
    print(f"İşlem tamamlandı!")
    print(f"Toplam kaydedilen maç (JSON): {total_saved}")
    if firebase_service and total_firebase_saved > 0:
        print(f"Toplam kaydedilen maç (Firebase): {total_firebase_saved}")
    print(f"Veri dosyası: {storage.matches_file}")
    print("=" * 60)


if __name__ == "__main__":
    try:
        fetch_monthly_data()
    except KeyboardInterrupt:
        print("\n\nİşlem kullanıcı tarafından durduruldu.")
        sys.exit(0)
    except Exception as e:
        print(f"\n\nHata oluştu: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
