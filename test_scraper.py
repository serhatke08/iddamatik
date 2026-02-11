"""
Test scripti - Scraper'ları test etmek için
"""
import sys
from scrapers.mackolik import MackolikScraper
from datetime import datetime, timedelta

def test_mackolik():
    """Mackolik scraper'ı test et"""
    print("=" * 50)
    print("Mackolik Scraper Test")
    print("=" * 50)
    
    scraper = MackolikScraper(delay=1.0)
    
    # Farklı tarihlerle test et
    test_dates = [
        datetime.now().strftime("%d/%m/%Y"),
        (datetime.now() - timedelta(days=1)).strftime("%d/%m/%Y"),
        (datetime.now() - timedelta(days=7)).strftime("%d/%m/%Y"),
        "15/01/2024",  # Geçmiş bir tarih
    ]
    
    for date in test_dates:
        print(f"\n📅 Tarih: {date}")
        print("-" * 50)
        matches = scraper.get_matches_by_date(date)
        
        if matches:
            print(f"✅ {len(matches)} maç bulundu!")
            print("\nİlk maç örneği:")
            import json
            print(json.dumps(matches[0], indent=2, ensure_ascii=False))
            break
        else:
            print("❌ Maç bulunamadı")
    
    print("\n" + "=" * 50)
    print("Test tamamlandı!")
    print("\n💡 Not: API endpoint'i değişmiş olabilir.")
    print("   Mackolik'in güncel API yapısını kontrol edin:")
    print("   - https://www.mackolik.com")
    print("   - Browser Developer Tools > Network sekmesi")
    print("=" * 50)

if __name__ == "__main__":
    try:
        test_mackolik()
    except KeyboardInterrupt:
        print("\n\nTest durduruldu.")
        sys.exit(0)
    except Exception as e:
        print(f"\n\nHata: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
