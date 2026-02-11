# Kurulum Rehberi

Bu rehber, İddaa Analiz Platformu'nu (Next.js + API Routes) tek projeyle kurmak için adım adım talimatlar içerir.

## Ön Gereksinimler

- Node.js 18+
- npm veya yarn
- Python 3.8+ (opsiyonel, sadece veri çekme scriptleri için)

## 1. Projeyi İndirin

```bash
git clone <repository-url>
cd idaamatik
```

## 2. CSV Verilerini Hazırlayın

Uygulama CSV dosyalarını doğrudan okur:

- `data/raw/*.csv`
- `data/football-data/*.csv`

CSV'lerin bu dizinlerde olduğundan emin olun.

## 3. Frontend Kurulumu

```bash
cd frontend
npm install
```

## 4. Sistemi Başlatma

```bash
cd frontend
npm run dev
```

Frontend ve API aynı sunucuda çalışır: `http://localhost:3000`

## 5. Test

1. Browser'da `http://localhost:3000` adresine gidin
2. Filtrelerden birine değer girin
3. Sonuçların anında güncellendiğini kontrol edin

## 6. Sorun Giderme

### Frontend Başlamıyor

- Node.js versiyonunu kontrol edin: `node --version`
- Bağımlılıklar yüklü mü kontrol edin: `npm list`

### CSV Okunmuyor

- `data/raw` ve `data/football-data` dizinlerinin var olduğundan emin olun
- CSV dosyalarının başlıklarının doğru olduğundan emin olun

## 7. Production Deployment

### Next.js (Tek Deploy)

```bash
cd frontend
npm run build
npm start
```

## 8. Notlar

- Büyük CSV'ler için ilk istek yavaş olabilir; ardından cache kullanılır.
- CSV'ler statik olduğu sürece ek backend servisine gerek yoktur.
