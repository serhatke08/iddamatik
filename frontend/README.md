# İddaamatik - Next.js Frontend

## Deployment (Vercel)

Bu proje Next.js ile yapılmıştır ve Vercel'de deploy edilmiştir.

### Önemli Notlar

- **Backend**: Python backend kodu kaldırılmıştır. Tüm backend işlevleri Next.js API Route'ları (`pages/api/` ve `app/api/`) ile sağlanmaktadır.
- **Veri Kaynağı**: Veriler `data/oddss/` ve `data/scores/` klasörlerindeki CSV dosyalarından okunmaktadır.
- **Sitemap**: `/sitemap.xml` otomatik olarak oluşturulur.
- **Robots.txt**: `/robots.txt` public klasöründe mevcuttur.

### Vercel Deployment Ayarları

1. **Root Directory**: `frontend`
2. **Build Command**: `npm run build` (otomatik algılanır)
3. **Output Directory**: `.next` (Next.js default)
4. **Install Command**: `npm install` (otomatik algılanır)

### API Endpoints

Tüm API'ler Next.js API Route'ları olarak çalışır:

- `/api/csv-filter` - Maç filtreleme
- `/api/csv-count` - Toplam maç sayısı
- `/api/csv-leagues` - Lig listesi
- `/api/analyze-odds` - Oran analizi
- `/api/upcoming-odds` - Yaklaşan maçlar

### Çalıştırma

```bash
cd frontend
npm install
npm run dev
```

### Build

```bash
npm run build
npm start
```
