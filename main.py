"""
İddaa Matik - Ana çalıştırma dosyası
"""
import sys
from datetime import datetime, timedelta
from scrapers.mackolik import MackolikScraper
from utils.helpers import save_json, ensure_dir, format_date
import config


def main():
    """Ana fonksiyon"""
    print("=" * 50)
    print("İddaa Matik - Veri Çekme Sistemi")
    print("=" * 50)
    print()
    
    # Dizinleri oluştur
    ensure_dir(config.MATCHES_DIR)
    ensure_dir(config.ODDS_DIR)
    ensure_dir(config.RESULTS_DIR)
    
    # Mackolik scraper'ı başlat
    if config.DATA_SOURCES['mackolik']['enabled']:
        print("Mackolik scraper başlatılıyor...")
        scraper = MackolikScraper(delay=config.SCRAPING_CONFIG['delay_between_requests'])
        
        # Bugünkü maçları çek
        print("\nBugünkü maçlar çekiliyor...")
        today = datetime.now().strftime("%d/%m/%Y")
        print(f"Tarih: {today}")
        matches = scraper.get_matches_by_date(today)
        
        # Eğer bugün için maç yoksa, dün veya geçmiş bir tarihle dene
        if not matches:
            print("\nBugün için maç bulunamadı. Geçmiş bir tarihle deneniyor...")
            # Örnek: 1 hafta önce
            past_date = (datetime.now() - timedelta(days=7)).strftime("%d/%m/%Y")
            print(f"Test tarihi: {past_date}")
            matches = scraper.get_matches_by_date(past_date)
        
        if matches:
            print(f"✓ {len(matches)} maç bulundu")
            
            # Veriyi kaydet
            filename = f"matches_{format_date(today)}.json"
            filepath = f"{config.MATCHES_DIR}/{filename}"
            save_json(matches, filepath)
            print(f"✓ Veriler kaydedildi: {filepath}")
            
            # İlk birkaç maçı göster
            print("\nİlk 3 maç:")
            for i, match in enumerate(matches[:3], 1):
                print(f"\n{i}. Maç:")
                print(f"   ID: {match.get('match_id')}")
                print(f"   Ev Sahibi: {match.get('home_team')}")
                print(f"   Deplasman: {match.get('away_team')}")
        else:
            print("⚠ Bugün için maç bulunamadı")
        
        # Gelecek 7 günün maçlarını çek (opsiyonel)
        print("\n" + "-" * 50)
        # Otomatik olarak sadece bugünkü maçları çek
        # İsterseniz aşağıdaki satırı açıp gelecek günleri de çekebilirsiniz
        fetch_upcoming = False  # True yaparsanız gelecek 7 günü de çeker
        
        if fetch_upcoming:
            print("\nGelecek 7 günün maçları çekiliyor...")
            all_matches = []
            
            for i in range(7):
                date = datetime.now() + timedelta(days=i)
                date_str = date.strftime("%d/%m/%Y")
                print(f"  {date_str} tarihi işleniyor...", end=" ")
                
                matches = scraper.get_matches_by_date(date_str)
                all_matches.extend(matches)
                print(f"✓ {len(matches)} maç")
            
            if all_matches:
                filename = f"matches_upcoming_{datetime.now().strftime('%Y%m%d')}.json"
                filepath = f"{config.MATCHES_DIR}/{filename}"
                save_json(all_matches, filepath)
                print(f"\n✓ Toplam {len(all_matches)} maç kaydedildi: {filepath}")
    
    print("\n" + "=" * 50)
    print("İşlem tamamlandı!")
    print("=" * 50)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nİşlem kullanıcı tarafından durduruldu.")
        sys.exit(0)
    except Exception as e:
        print(f"\n\nHata oluştu: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
