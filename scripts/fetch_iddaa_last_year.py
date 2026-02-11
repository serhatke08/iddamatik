"""
İddaa.com son 1 yıl sonuçlarını Selenium ile çek ve kaydet
"""
import sys
import os
from datetime import datetime, timedelta

# Proje root'unu path'e ekle
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scrapers.iddaa_selenium_results import IddaaSeleniumResultsScraper
from utils.data_storage import DataStorage
from utils.firebase import FirebaseService


def fetch_last_year(days: int = 365):
    """Son N günün sonuçlarını çeker"""
    print("=" * 70)
    print("IDDAA SONUÇ ÇEKME - SON 1 YIL")
    print("=" * 70)

    scraper = IddaaSeleniumResultsScraper(headless=True, delay=2.0)
    storage = DataStorage()

    firebase_service = None
    try:
        firebase_service = FirebaseService()
        if firebase_service.db:
            print("✓ Firebase bağlantısı başarılı")
    except Exception as e:
        print(f"⚠ Firebase başlatılamadı: {e}")
        print("⚠ Veriler sadece JSON dosyasına kaydedilecek")

    total_saved = 0
    total_firebase = 0

    for i in range(days):
        date = datetime.now() - timedelta(days=i + 1)
        date_str = date.strftime("%d/%m/%Y")
        print(f"[{i+1}/{days}] {date_str} çekiliyor...")

        matches = scraper.get_matches_by_date(date_str)
        if matches:
            saved = storage.save_matches_batch(matches)
            total_saved += saved
            print(f"  ✓ {saved} maç JSON'a kaydedildi")

            if firebase_service and firebase_service.db:
                firebase_count = 0
                for match in matches:
                    try:
                        firebase_service.save_match(match)
                        firebase_count += 1
                    except Exception:
                        pass
                total_firebase += firebase_count
        else:
            print("  ⚠ Maç bulunamadı")

    try:
        scraper.close()
    except Exception:
        pass

    print("\n" + "=" * 70)
    print("İŞLEM TAMAMLANDI!")
    print(f"Toplam kaydedilen maç (JSON): {total_saved}")
    if total_firebase > 0:
        print(f"Toplam kaydedilen maç (Firebase): {total_firebase}")
    print(f"Veri dosyası: {storage.matches_file}")
    print("=" * 70)


if __name__ == "__main__":
    days = 365
    if len(sys.argv) > 1:
        try:
            days = int(sys.argv[1])
        except Exception:
            pass

    fetch_last_year(days=days)
