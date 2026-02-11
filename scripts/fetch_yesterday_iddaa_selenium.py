"""
Dünkü maçları iddaa.com'dan Selenium ile çek ve kaydet
"""
import sys
import os
from datetime import datetime, timedelta

# Proje root'unu path'e ekle
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scrapers.iddaa_results_selenium import IddaaResultsSeleniumScraper
from utils.data_storage import DataStorage
from utils.firebase import FirebaseService


def fetch_yesterday_matches():
    print("=" * 70)
    print("DÜNKÜ MAÇLARI SELENIUM İLE ÇEKME")
    print("=" * 70)

    scraper = IddaaResultsSeleniumScraper(headless=True, delay=2.0)
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

    yesterday = datetime.now() - timedelta(days=1)
    date_str = yesterday.strftime("%Y-%m-%d")
    print(f"\nTarih: {date_str}")
    print("Maçlar çekiliyor...\n")

    matches = scraper.get_matches_by_date(date_str)

    if matches:
        print(f"✓ {len(matches)} maç bulundu")
        saved = storage.save_matches_batch(matches)
        print(f"✓ {saved} maç JSON'a kaydedildi")

        if firebase_service and firebase_service.db:
            firebase_count = 0
            for match in matches:
                try:
                    firebase_service.save_match(match)
                    firebase_count += 1
                except Exception as e:
                    print(f"  ⚠ Firebase kayıt hatası: {e}")
            print(f"✓ {firebase_count} maç Firebase'e kaydedildi")

        print("\nİlk 5 maç:")
        for i, match in enumerate(matches[:5], 1):
            result = match.get('result', 'N/A')
            print(f"  {i}. {match['home_team']} vs {match['away_team']} - {result} ({match.get('league', '?')})")
    else:
        print("⚠ Maç bulunamadı")

    scraper.close()
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
