import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/SiteHeader'

const siteUrl = 'https://iddamatik.vercel.app'

export const metadata: Metadata = {
  title: 'Filtreleme nasıl çalışır? Lig, skor ve oran filtreleri',
  description:
    'Ana sayfadaki lig, maç, skor ve oran filtrelerinin çalışma mantığı, tolerans ayarları ve örnek kullanımlar.',
  keywords: ['iddaa filtreleme', 'oran toleransı', 'MS1 MSX MS2', 'alt üst filtre', 'İddaamatik rehber'],
  openGraph: {
    title: 'Filtreleme nasıl çalışır? | İddaamatik',
    url: `${siteUrl}/nasil-calisir`,
    type: 'article',
  },
  alternates: { canonical: `${siteUrl}/nasil-calisir` },
}

export default function NasilCalisirPage() {
  return (
    <div className="container">
      <SiteHeader />

      <article
        className="search-section"
        style={{ maxWidth: '900px', margin: '0 auto 40px' }}
      >
        <p style={{ marginBottom: '8px', fontSize: '13px', color: '#9ca3af' }}>
          <Link href="/" style={{ color: '#60a5fa', textDecoration: 'none' }}>
            ← Ana sayfaya dön
          </Link>
        </p>
        <h2 style={{ marginBottom: '12px', fontSize: '1.5rem' }}>Ana sayfa filtreleme rehberi</h2>
        <p style={{ lineHeight: 1.65, color: '#d1d5db', marginBottom: '24px' }}>
          Bu sayfa, ana sayfadaki kutuların ne işe yaradığını, aramanın ne zaman çalıştığını ve örnek senaryoları
          anlatır. Veriler geçmiş (oynanmış) maçlardan oluşur; bir maçın kayıtlı oranı ve skoru ile eşleşme
          kurulur.
        </p>

        <section style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '10px', color: '#f3f4f6' }}>Genel mantık</h3>
          <ul style={{ paddingLeft: '1.25rem', lineHeight: 1.7, color: '#d1d5db' }}>
            <li>
              <strong>En az bir filtre dolu olmalı.</strong> Hiçbir kutuda değer yoksa liste getirilmez; önce bir
              kriter yazın veya seçin.
            </li>
            <li>
              <strong>Otomatik arama (gecikmeli):</strong> Yazmayı bıraktıktan yaklaşık <strong>1 saniye</strong>{' '}
              sonra arama tetiklenir. İsterseniz <strong>Filtrele</strong> ile de anında çalıştırabilirsiniz.
            </li>
            <li>
              <strong>Çoklu filtre = VE (AND):</strong> Örneğin lig + MS1 + Skor birlikte seçildiyse, sonuçta{' '}
              <em>hepsi birden</em> sağlanan maçlar listelenir.
            </li>
            <li>
              Arka planda istek <code style={{ color: '#93c5fd' }}>/api/csv-filter</code> üzerinden yapılır; sonuçlar
              veri setindeki maçlarla eşleştirilir.
            </li>
          </ul>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '10px', color: '#f3f4f6' }}>Üst sıra: Lig, Maç, Skor</h3>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px',
              lineHeight: 1.5,
            }}
          >
            <thead>
              <tr style={{ borderBottom: '1px solid #374151', textAlign: 'left' }}>
                <th style={{ padding: '8px 10px 8px 0', color: '#9ca3af', fontWeight: 600 }}>Alan</th>
                <th style={{ padding: '8px 0', color: '#9ca3af', fontWeight: 600 }}>Ne yazılır?</th>
                <th style={{ padding: '8px 0', color: '#9ca3af', fontWeight: 600 }}>Örnek</th>
              </tr>
            </thead>
            <tbody style={{ color: '#e5e7eb' }}>
              <tr style={{ borderBottom: '1px solid #1f2937' }}>
                <td style={{ padding: '10px 10px 10px 0', verticalAlign: 'top' }}>
                  <strong>Lig</strong>
                </td>
                <td style={{ padding: '10px 0', verticalAlign: 'top' }}>
                  Açılır listeden lig seçilir; &quot;Hepsi&quot; tüm ligler demektir.
                </td>
                <td style={{ padding: '10px 0', verticalAlign: 'top', color: '#9ca3af' }}>
                  Süper Lig maçlarını daraltmak için <em>Turkey — Super Lig</em>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #1f2937' }}>
                <td style={{ padding: '10px 10px 10px 0', verticalAlign: 'top' }}>
                  <strong>Maç</strong> <span style={{ color: '#6b7280', fontSize: '12px' }}>(Takım adı)</span>
                </td>
                <td style={{ padding: '10px 0', verticalAlign: 'top' }}>
                  Ev veya deplasman takım adının <strong>geçtiği</strong> tüm eşleşmeler. Büyük/küçük harf duyarsız.
                </td>
                <td style={{ padding: '10px 0', verticalAlign: 'top', color: '#9ca3af' }}>
                  <code>Galatasaray</code>, <code>Real</code>, <code>Liverpool</code>
                </td>
              </tr>
              <tr>
                <td style={{ padding: '10px 10px 10px 0', verticalAlign: 'top' }}>
                  <strong>Skor</strong>
                </td>
                <td style={{ padding: '10px 0', verticalAlign: 'top' }}>
                  Maçın kayıtlı skor metni içinde aranır (genelde <code>ev-deplasman</code> formatı).
                </td>
                <td style={{ padding: '10px 0', verticalAlign: 'top', color: '#9ca3af' }}>
                  <code>2-1</code>, <code>0-0</code>, <code>3-2</code>
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '10px', color: '#f3f4f6' }}>
            Maç sonucu ve KG: MS1, MSX, MS2, KG Var, KG Yok
          </h3>
          <p style={{ lineHeight: 1.65, color: '#d1d5db', marginBottom: '12px' }}>
            Bu kutulara <strong>oran değeri</strong> yazarsınız (ör. <code>2.45</code>). Sistem, verideki o bahse ait
            oranın <strong>tam olarak</strong> bu değere eşit olduğu maçları bulur — yani &quot;bu oranla kapanmış
            geçmiş maçlar&quot; analizi yapılır.
          </p>
          <ul style={{ paddingLeft: '1.25rem', lineHeight: 1.7, color: '#d1d5db', marginBottom: '12px' }}>
            <li>
              <strong>MS1:</strong> Ev sahibi galibiyet oranı (ev kazanmış maçlarla ilişkilendirilir).
            </li>
            <li>
              <strong>MSX:</strong> Beraberlik oranı.
            </li>
            <li>
              <strong>MS2:</strong> Deplasman galibiyet oranı.
            </li>
            <li>
              <strong>KG Var:</strong> Karşılıklı gol (her iki takımın da gol attığı) bahsinin oranı.
            </li>
            <li>
              <strong>KG Yok:</strong> Karşılıklı gol olmaması bahsinin oranı.
            </li>
          </ul>
          <p style={{ lineHeight: 1.65, color: '#9ca3af', fontSize: '14px' }}>
            <strong>Örnek:</strong> MS1 kutusuna <code>2.10</code> yazıp Filtrele derseniz, veri setinde MS1 oranı
            tam 2.10 olan maçlar listelenir. İsterseniz aynı anda Lig + Maç ile daraltabilirsiniz.
          </p>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '10px', color: '#f3f4f6' }}>Tolerans (+ / −)</h3>
          <p style={{ lineHeight: 1.65, color: '#d1d5db', marginBottom: '10px' }}>
            MS1, MSX, MS2, KG ve Alt/Üst kutularının altındaki iki küçük listede <strong>üst</strong> ve{' '}
            <strong>alt tolerans</strong> seçilir (0–5). Varsayılan 0 iken sadece <strong>tam eşleşme</strong> (iki
            ondalık) aranır. Tolerans açıldığında hedef oranın etrafında bir <strong>aralık</strong> kabul edilir:
            her bir birim yaklaşık <strong>0.1</strong> puan genişletir (ör. hedef 2.50, üst +2 → en fazla 2.70; alt −1
            → en az 2.40).
          </p>
          <p style={{ lineHeight: 1.65, color: '#9ca3af', fontSize: '14px' }}>
            <strong>Örnek:</strong> O25 için <code>1.90</code> ve üst tolerans +1, alt tolerans 0 → kabaca 1.90–2.00
            bandındaki oranlar eşleşir. Tam sayıları denemek için önce toleransı 0 bırakın; sonuç az çıkarsa kademeli
            açın.
          </p>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '10px', color: '#f3f4f6' }}>
            Alt sıra: ÜST / ALT (0.5 – 4.5 gol çizgileri)
          </h3>
          <p style={{ lineHeight: 1.65, color: '#d1d5db', marginBottom: '10px' }}>
            O05, U05, … O45, U45 kutuları <strong>toplam gol</strong> bahislerinin oranları içindir. Üzerindeki kısa
            açıklamalar (ör. &quot;2+ gol&quot;, &quot;0–2 gol&quot;) o bahsin neyi temsil ettiğini hatırlatır.
            Yine bir <strong>oran</strong> yazılır; mantık MS1 ile aynıdır (gerekirse tolerans ile).
          </p>
          <ul style={{ paddingLeft: '1.25rem', lineHeight: 1.65, color: '#9ca3af', fontSize: '14px' }}>
            <li>
              <strong>Örnek:</strong> U2.5 (listedeki <em>ALT 2.5</em>) için <code>1.75</code> → toplam golün 2.5
              altı bahsinde oranı tam 1.75 olan geçmiş maçlar.
            </li>
            <li>
              <strong>Örnek:</strong> O3.5 için <code>2.20</code> + küçük tolerans → benzer oranlı yüksek skorlu maç
              profillerini genişleterek bakmak için kullanılır.
            </li>
          </ul>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '10px', color: '#f3f4f6' }}>Filtrele ve Temizle</h3>
          <ul style={{ paddingLeft: '1.25rem', lineHeight: 1.7, color: '#d1d5db' }}>
            <li>
              <strong>Filtrele:</strong> O anki tüm kutularla aramayı hemen çalıştırır.
            </li>
            <li>
              <strong>Temizle:</strong> Tüm metinleri, toleransları ve (varsa) sonuç içi lig seçimlerini sıfırlar.
            </li>
          </ul>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '10px', color: '#f3f4f6' }}>Sonuç geldikten sonra: lig filtresi</h3>
          <p style={{ lineHeight: 1.65, color: '#d1d5db' }}>
            Liste oluştuktan sonra, dağılım bölümündeki lig satırlarından belirli ligleri işaretleyerek{' '}
            <strong>sadece o liglerde</strong> kalan maçları görebilirsiniz. Bu adım sunucuya yeni istek göndermez;
            ekrandaki sonuçların içinde süzülür.
          </p>
        </section>

        <section>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '10px', color: '#f3f4f6' }}>Hızlı senaryolar</h3>
          <ol style={{ paddingLeft: '1.25rem', lineHeight: 1.75, color: '#d1d5db' }}>
            <li>
              <strong>Süper Lig + beraberlik oranı:</strong> Lig → Super Lig, MSX → <code>3.40</code> (tolerans 0).
            </li>
            <li>
              <strong>Belirli skor + takım:</strong> Maç → <code>Fener</code>, Skor → <code>2-1</code>.
            </li>
            <li>
              <strong>KG Var yoğun maçlar:</strong> KG Var → <code>1.70</code>, isteğe bağlı O2.5 → <code>1.85</code>{' '}
              ile birlikte.
            </li>
          </ol>
        </section>
      </article>
    </div>
  )
}
