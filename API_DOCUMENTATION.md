# API Dokümantasyonu - İddaa Matik

## Kullanılabilir Veri Kaynakları

### 1. **Mackolik.com** ⭐ (Önerilen - Ücretsiz)

**URL**: https://www.mackolik.com

**Veri Çekme Yöntemleri**:

#### A) Web Scraping (Ana Yöntem)
- **Endpoint**: `https://www.mackolik.com/Mac-Programi`
- **Parametreler**: `?date=YYYY-MM-DD`
- **Yöntem**: HTML parsing ile maç bilgileri ve oranlar
- **Avantajlar**: 
  - Ücretsiz
  - Türkçe veri
  - Detaylı maç bilgileri
  - Geçmiş maç verileri mevcut

**Çekilebilecek Veriler**:
- Maç tarihi ve saati
- Ev sahibi ve deplasman takımları
- Lig/Şampiyona adı
- İddaa oranları (MS1, MSX, MS2)
- Alt/Üst oranları
- Handikap oranları
- İlk yarı oranları

**Kullanım**:
```python
from scrapers.mackolik import MackolikScraper

scraper = MackolikScraper()
matches = scraper.get_matches_by_date("21/01/2024")
```

#### B) API Endpoint (Eski - Çalışmayabilir)
- **Endpoint**: `http://goapi.mackolik.com/livedata?date=DD/MM/YYYY`
- **Durum**: DNS çözümleme sorunu var, kullanılamıyor
- **Not**: Eğer çalışırsa JSON formatında veri döner

### 2. **İddaa.com** (Resmi Site)

**URL**: https://www.iddaa.com

**Veri Çekme Yöntemi**: Web Scraping
- **Endpoint**: `https://www.iddaa.com/program`
- **Yöntem**: HTML parsing
- **Dikkat**: Anti-bot koruması olabilir

**Çekilebilecek Veriler**:
- Maç programları
- Güncel oranlar
- Maç sonuçları

**Kullanım**:
```python
from scrapers.iddaa import IddaaScraper

scraper = IddaaScraper()
matches = scraper.get_matches_by_date("21/01/2024")
```

### 3. **Ücretli API Servisleri** (Alternatif)

#### A) OddsPapi
- **URL**: https://oddspapi.io
- **Özellikler**: 
  - 300+ bahis sitesi
  - 60+ spor
  - Geçmiş oran verileri
  - Ücretli (ücretsiz plan mevcut)
- **Türkiye İddaa**: Kapsamı sınırlı olabilir

#### B) The Odds API
- **URL**: https://the-odds-api.com
- **Özellikler**:
  - Geçmiş oran snapshot'ları (2020'den itibaren)
  - Gerçek zamanlı oranlar
  - Ücretli (ücretsiz plan mevcut)
- **Türkiye İddaa**: Kapsamı sınırlı olabilir

#### C) Zporsdata.com
- **URL**: https://www.zporsdata.com
- **Özellikler**:
  - İddaa, Bwin, Bet3000, Hititbet, Betradar kaynakları
  - JSON/XML formatında veri
  - 25+ spor dalı
  - Ücretli
- **Türkiye İddaa**: ✅ Özel İddaa verisi mevcut

## Web Uygulaması API Endpoint'leri

### 1. Maçları Getir
```
GET /api/matches?date=DD/MM/YYYY&source=mackolik
```

**Parametreler**:
- `date` (opsiyonel): Tarih formatı DD/MM/YYYY (varsayılan: bugün)
- `source` (opsiyonel): `mackolik` veya `iddaa` (varsayılan: mackolik)

**Örnek**:
```
GET /api/matches?date=21/01/2024&source=mackolik
```

**Yanıt**:
```json
{
  "success": true,
  "date": "21/01/2024",
  "matches": [
    {
      "match_id": 12345,
      "home_team": "Galatasaray",
      "away_team": "Fenerbahçe",
      "league": "Süper Lig",
      "date": "21/01/2024",
      "time": "19:00",
      "odds": {
        "ms1": 2.10,
        "msx": 3.40,
        "ms2": 3.20
      }
    }
  ],
  "count": 1
}
```

### 2. Geçmiş Maç Arama
```
GET /api/search?team=TAKIM_ADI&league=LIG&date_from=DD/MM/YYYY&date_to=DD/MM/YYYY&source=mackolik
```

**Parametreler**:
- `team` (opsiyonel): Takım adı (kısmi eşleşme)
- `league` (opsiyonel): Lig adı (kısmi eşleşme)
- `date_from` (opsiyonel): Başlangıç tarihi DD/MM/YYYY
- `date_to` (opsiyonel): Bitiş tarihi DD/MM/YYYY
- `source` (opsiyonel): `mackolik` veya `iddaa`

**Örnek**:
```
GET /api/search?team=Galatasaray&date_from=01/01/2024&date_to=31/01/2024
```

**Yanıt**:
```json
{
  "success": true,
  "query": {
    "team": "Galatasaray",
    "date_from": "01/01/2024",
    "date_to": "31/01/2024",
    "league": ""
  },
  "matches": [...],
  "count": 5
}
```

### 3. Maç Oranları
```
GET /api/odds/<match_id>
```

**Örnek**:
```
GET /api/odds/12345
```

**Yanıt**:
```json
{
  "success": true,
  "match_id": 12345,
  "odds": {
    "ms1": 2.10,
    "msx": 3.40,
    "ms2": 3.20
  }
}
```

## Scraper Geliştirme Notları

### Mackolik.com Scraper

**Mevcut Durum**:
- API endpoint çalışmıyor (DNS sorunu)
- Web scraping yöntemi kullanılıyor
- HTML yapısı değişebilir, düzenli güncelleme gerekebilir

**Geliştirme Önerileri**:
1. Mackolik.com'un güncel HTML yapısını analiz edin
2. Browser Developer Tools ile element yapısını inceleyin
3. CSS selector'ları veya XPath kullanarak veri çekin
4. Rate limiting uygulayın (2-3 saniye bekleme)
5. User-Agent rotation kullanın

**Örnek HTML Analizi**:
```python
# Mackolik.com'da maç kartları genellikle şu şekilde:
# <div class="match-card"> veya <tr class="match-row">
# Takım isimleri: <span class="team-name">
# Oranlar: <span class="odd-value">
```

### İddaa.com Scraper

**Mevcut Durum**:
- Web scraping yöntemi kullanılıyor
- Anti-bot koruması olabilir
- Selenium gerekebilir

**Geliştirme Önerileri**:
1. Selenium WebDriver kullanarak JavaScript render'ı bekleyin
2. Headless browser kullanın
3. Proxy rotation düşünün
4. CAPTCHA çözme servisleri gerekebilir

## Yasal ve Etik Notlar

⚠️ **ÖNEMLİ**:
- Web scraping yaparken sitelerin kullanım şartlarına uyun
- Rate limiting uygulayın (istekler arasında 2-3 saniye bekleyin)
- Robots.txt dosyalarına saygı gösterin
- Sadece kişisel kullanım ve araştırma amaçlı kullanın
- Ticari kullanım için gerekli izinleri alın
- Veri kaynağı sitelerinin sunucularını aşırı yüklemeyin

## Sorun Giderme

### API Endpoint Çalışmıyor
- DNS çözümleme sorunu olabilir
- Web scraping yöntemine geçin
- Alternatif endpoint'leri deneyin

### Veri Çekilemiyor
- HTML yapısı değişmiş olabilir
- Site anti-bot koruması eklemiş olabilir
- User-Agent veya header'ları güncelleyin
- Selenium kullanmayı düşünün

### Yavaş Performans
- Rate limiting'i artırın
- Paralel isteklerden kaçının
- Cache mekanizması ekleyin
- Veritabanı kullanarak verileri saklayın
