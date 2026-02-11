# İddaa Analiz Platformu

Profesyonel futbol maçları ve oranlarını analiz etmek için geliştirilmiş tam kapsamlı platform.

## 🎯 Özellikler

### ✅ Tam Özellikli Sistem

- **Web Scraping**: Python ile otomatik veri çekme (Mackolik, İddaa.com)
- **Firebase Firestore**: Tarihsel veri saklama ve sorgulama
- **FastAPI Backend**: RESTful API, doğal dil arama
- **React/Next.js Frontend**: Modern, responsive web arayüzü
- **Doğal Dil Arama**: "Galatasaray", "KG 3", "Alt 4 Fenerbahçe" gibi sorgular
- **Gerçek Zamanlı Filtreleme**: Anlık arama ve sonuç güncelleme
- **Otomatik Veri Çekme**: Günlük scheduler ile otomatik güncelleme

### 📊 Çekilen Veriler

- **Maç Bilgileri**: Tarih, saat, lig, takımlar
- **Oran Türleri**:
  - Maç Sonucu (MS1, MSX, MS2)
  - Alt/Üst (1.5, 2.5, 3.5)
  - Karşılıklı Gol (KG Var/Yok)
  - Handikap (H1, HX, H2)
  - İlk Yarı (İY1, İYX, İY2)
- **Tarihsel Veriler**: Geçmiş oranlar ve maç sonuçları
- **Durum Takibi**: PAST, TODAY, UPCOMING

## 🏗️ Mimari

```
idaamatik/
├── backend/
│   └── main.py              # FastAPI backend
├── frontend/
│   ├── app/
│   │   ├── page.tsx         # Ana sayfa
│   │   ├── layout.tsx       # Layout
│   │   └── globals.css      # Stiller
│   ├── package.json
│   └── tsconfig.json
├── scrapers/
│   ├── mackolik.py          # Mackolik scraper
│   └── iddaa.py             # İddaa scraper
├── utils/
│   ├── firebase.py          # Firebase entegrasyonu
│   ├── nlp_parser.py        # Doğal dil arama parser
│   └── helpers.py            # Yardımcı fonksiyonlar
├── scheduler/
│   └── scraper_scheduler.py # Otomatik veri çekme
├── requirements.txt
└── README.md
```

## 🚀 Kurulum

### 1. Backend Kurulumu

```bash
# Python virtual environment oluştur
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Bağımlılıkları yükle
pip install -r requirements.txt

# Firebase credentials (opsiyonel)
# GOOGLE_APPLICATION_CREDENTIALS environment variable'ı ayarla
# veya FIREBASE_CREDENTIALS_PATH ile credentials dosyası yolunu belirt
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/firebase-credentials.json"
```

### 2. Frontend Kurulumu

```bash
cd frontend

# Node.js bağımlılıklarını yükle
npm install

# Environment variables
cp .env.local.example .env.local
# .env.local dosyasını düzenle:
# NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Firebase Kurulumu (Opsiyonel)

1. Firebase Console'da yeni bir proje oluştur
2. Firestore Database'i etkinleştir
3. Service Account key indir
4. `GOOGLE_APPLICATION_CREDENTIALS` environment variable'ı ayarla

**Not**: Firebase olmadan da sistem çalışır, ancak veriler kalıcı olarak saklanmaz.

## 💻 Kullanım

### Backend'i Başlat

```bash
# FastAPI backend
cd backend
python main.py

# veya
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

Backend şu adreste çalışır: `http://localhost:8000`

API dokümantasyonu: `http://localhost:8000/docs`

### Frontend'i Başlat

```bash
cd frontend
npm run dev
```

Frontend şu adreste çalışır: `http://localhost:3000`

### Otomatik Veri Çekme

```bash
# Scheduler'ı başlat
python scheduler/scraper_scheduler.py
```

Scheduler şu görevleri çalıştırır:
- Her gün 08:00: Bugünkü maçlar
- Her gün 09:00: Gelecek 7 günün maçları
- Her gün 10:00: Geçmiş 7 günün maçları
- Her 6 saatte bir: Bugünkü maçları kontrol et (oranlar değişebilir)

## 🔍 Doğal Dil Arama

Platform, kullanıcının doğal dilde yazdığı sorguları anlayabilir:

### Örnek Sorgular

- **Takım Adı**: `Galatasaray`, `Fenerbahçe`, `Beşiktaş`
- **Oran Türü + Değer**: `KG 3`, `Alt 4`, `Üst 2.50`
- **Tam Oran**: `KG Var 2.50`, `Alt 2.5 1.85`
- **Kombinasyon**: `Alt 4 Fenerbahçe`, `Üst 2.20 Galatasaray`
- **Lig**: `Süper Lig`, `Premier League`

### Desteklenen Oran Türleri

- **MS**: Maç Sonucu (MS1, MSX, MS2)
- **KG**: Karşılıklı Gol (KG Var, KG Yok)
- **Alt/Üst**: Alt 1.5, Alt 2.5, Alt 3.5, Üst 1.5, Üst 2.5, Üst 3.5
- **Handikap**: H1, HX, H2
- **İlk Yarı**: İY1, İYX, İY2

## 📡 API Endpoints

### GET `/api/matches`
Maçları listeler

**Query Parametreleri**:
- `date`: Tarih (DD/MM/YYYY)
- `team`: Takım adı
- `league`: Lig adı
- `status`: PAST, TODAY, UPCOMING
- `limit`: Maksimum sonuç sayısı (varsayılan: 100)

**Örnek**:
```bash
curl "http://localhost:8000/api/matches?date=21/01/2024&team=Galatasaray"
```

### GET `/api/search`
Doğal dil ile arama

**Query Parametreleri**:
- `q`: Arama sorgusu

**Örnek**:
```bash
curl "http://localhost:8000/api/search?q=KG%203"
```

### GET `/api/today`
Bugünkü maçları getirir

### GET `/api/upcoming`
Gelecek maçları getirir

**Query Parametreleri**:
- `days`: Kaç gün ileriye bakılacak (varsayılan: 7)

### POST `/api/scrape`
Veri çekme işlemini başlatır

**Query Parametreleri**:
- `date`: Tarih (DD/MM/YYYY), boşsa bugün
- `source`: mackolik veya iddaa

## 🔧 Yapılandırma

### Environment Variables

**Backend**:
- `GOOGLE_APPLICATION_CREDENTIALS`: Firebase credentials dosyası yolu
- `FIREBASE_CREDENTIALS_PATH`: Alternatif Firebase credentials yolu

**Frontend**:
- `NEXT_PUBLIC_API_URL`: Backend API URL'i (varsayılan: http://localhost:8000)

### Config Dosyası

`config.py` dosyasında scraping ayarları yapılabilir:
- `delay_between_requests`: İstekler arası bekleme süresi
- `timeout`: İstek timeout süresi
- `retry_count`: Hata durumunda tekrar deneme sayısı

## ⚠️ Önemli Notlar

### Yasal Uyarı

- Bu platform **sadece analiz amaçlıdır**
- Bahis oynamak için kullanılamaz
- Web scraping yaparken sitelerin kullanım şartlarına uyun
- Rate limiting (istek sınırlaması) uygulayın
- Robots.txt dosyalarına saygı gösterin
- Sadece kişisel kullanım ve araştırma amaçlı kullanın

### Teknik Notlar

- **HTML Yapısı Değişiklikleri**: Scraper'lar web sitelerinin HTML yapısına bağlıdır. Eğer site yapısı değişirse scraper'ları güncellemeniz gerekebilir.
- **Firebase**: Firebase olmadan da sistem çalışır, ancak veriler kalıcı olarak saklanmaz ve arama özellikleri sınırlıdır.
- **Rate Limiting**: Scraper'lar otomatik olarak rate limiting uygular. Çok sık istek yapmayın.

## 🐛 Sorun Giderme

### Firebase Bağlantı Hatası

```
⚠ Firebase bağlantı hatası: ...
```

**Çözüm**:
1. Firebase credentials dosyasının doğru yolda olduğundan emin olun
2. `GOOGLE_APPLICATION_CREDENTIALS` environment variable'ını kontrol edin
3. Firebase projesinde Firestore'ın etkin olduğundan emin olun

### Scraper Veri Çekemiyor

**Çözüm**:
1. İnternet bağlantınızı kontrol edin
2. Web sitesinin erişilebilir olduğundan emin olun
3. HTML yapısının değişip değişmediğini kontrol edin
4. Scraper'ları güncelleyin

### Frontend API'ye Bağlanamıyor

**Çözüm**:
1. Backend'in çalıştığından emin olun (`http://localhost:8000`)
2. `NEXT_PUBLIC_API_URL` environment variable'ını kontrol edin
3. CORS ayarlarını kontrol edin (backend'de)

## 📝 Lisans

Bu proje eğitim ve araştırma amaçlıdır. Ticari kullanım için gerekli izinleri alın.

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📧 İletişim

Sorularınız için issue açabilirsiniz.

---

**Not**: Bu platform sadece analiz amaçlıdır. Bahis oynamak için kullanılamaz.
