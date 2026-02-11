"""
Otomatik veri çekme scheduler'ı
Günlük olarak maç verilerini çeker ve Firebase'e kaydeder
"""
import schedule
import time
from datetime import datetime, timedelta
import sys
import os

# Proje root'unu path'e ekle
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scrapers.mackolik import MackolikScraper
from scrapers.iddaa import IddaaScraper
from utils.firebase import FirebaseService

# Servisler
mackolik_scraper = MackolikScraper(delay=2.0)
iddaa_scraper = IddaaScraper(delay=2.0)

# Firebase (opsiyonel)
firebase_service = None
try:
    firebase_service = FirebaseService()
    print("✓ Firebase bağlantısı başarılı")
except Exception as e:
    print(f"⚠ Firebase bağlantı hatası: {e}")
    print("⚠ Firebase olmadan da çalışır, ancak veriler kalıcı olarak saklanmaz")


def scrape_today_matches():
    """Bugünkü maçları çeker ve kaydeder"""
    print(f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Bugünkü maçlar çekiliyor...")
    
    today = datetime.now().strftime("%d/%m/%Y")
    matches = mackolik_scraper.get_matches_by_date(today)
    
    print(f"✓ {len(matches)} maç bulundu")
    
    if firebase_service:
        saved_count = 0
        for match in matches:
            try:
                firebase_service.save_match(match)
                saved_count += 1
            except Exception as e:
                print(f"⚠ Maç kayıt hatası: {e}")
        
        print(f"✓ {saved_count} maç Firebase'e kaydedildi")
    else:
        print("⚠ Firebase aktif değil, veriler kaydedilmedi")
    
    return len(matches)


def scrape_upcoming_matches():
    """Gelecek 7 günün maçlarını çeker ve kaydeder"""
    print(f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Gelecek maçlar çekiliyor...")
    
    all_matches = []
    
    for i in range(7):
        date = datetime.now() + timedelta(days=i)
        date_str = date.strftime("%d/%m/%Y")
        
        matches = mackolik_scraper.get_matches_by_date(date_str)
        all_matches.extend(matches)
        
        print(f"  {date_str}: {len(matches)} maç")
    
    print(f"✓ Toplam {len(all_matches)} maç bulundu")
    
    if firebase_service:
        saved_count = 0
        for match in all_matches:
            try:
                firebase_service.save_match(match)
                saved_count += 1
            except Exception as e:
                print(f"⚠ Maç kayıt hatası: {e}")
        
        print(f"✓ {saved_count} maç Firebase'e kaydedildi")
    else:
        print("⚠ Firebase aktif değil, veriler kaydedilmedi")
    
    return len(all_matches)


def scrape_past_matches(days_back: int = 7):
    """Geçmiş maçları çeker ve kaydeder (tarihsel veri için)"""
    print(f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Geçmiş maçlar çekiliyor...")
    
    all_matches = []
    
    for i in range(1, days_back + 1):
        date = datetime.now() - timedelta(days=i)
        date_str = date.strftime("%d/%m/%Y")
        
        matches = mackolik_scraper.get_matches_by_date(date_str)
        all_matches.extend(matches)
        
        print(f"  {date_str}: {len(matches)} maç")
    
    print(f"✓ Toplam {len(all_matches)} geçmiş maç bulundu")
    
    if firebase_service:
        saved_count = 0
        for match in all_matches:
            try:
                firebase_service.save_match(match)
                saved_count += 1
            except Exception as e:
                print(f"⚠ Maç kayıt hatası: {e}")
        
        print(f"✓ {saved_count} maç Firebase'e kaydedildi")
    else:
        print("⚠ Firebase aktif değil, veriler kaydedilmedi")
    
    return len(all_matches)


def main():
    """Scheduler'ı başlatır"""
    print("=" * 60)
    print("İddaa Analiz Platformu - Otomatik Veri Çekme Sistemi")
    print("=" * 60)
    print("\nZamanlanmış görevler:")
    print("  - Her gün 08:00'de bugünkü maçlar")
    print("  - Her gün 09:00'de gelecek 7 günün maçları")
    print("  - Her gün 10:00'de geçmiş 7 günün maçları")
    print("\nÇıkmak için Ctrl+C")
    print("=" * 60)
    
    # İlk çalıştırmada bugünkü maçları çek
    scrape_today_matches()
    
    # Zamanlanmış görevler
    schedule.every().day.at("08:00").do(scrape_today_matches)
    schedule.every().day.at("09:00").do(scrape_upcoming_matches)
    schedule.every().day.at("10:00").do(lambda: scrape_past_matches(7))
    
    # Her 6 saatte bir bugünkü maçları kontrol et (oranlar değişebilir)
    schedule.every(6).hours.do(scrape_today_matches)
    
    # Scheduler döngüsü
    while True:
        schedule.run_pending()
        time.sleep(60)  # Her dakika kontrol et


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nScheduler durduruldu.")
        sys.exit(0)
    except Exception as e:
        print(f"\n\nHata oluştu: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
