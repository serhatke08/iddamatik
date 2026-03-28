export function ProgramRehberIcerik() {
  return (
    <div className="rehber-prose">
      <p>
        <strong>İddaa analiz programı</strong> (arama motorlarında sık yazılan <strong>iddaa analiz programi</strong>{' '}
        şekli de aynı ihtiyacı ifade eder) dendiğinde genelde şunlar kastedilir: <strong>Excel şablonları</strong>,{' '}
        <strong>mobil uygulamalar</strong>, <strong>veri çeken scriptler</strong> veya <strong>tarayıcıdan çalışan
        analiz panelleri</strong>. Ortak amaç: form, oran ve geçmiş sonuçları <strong>tek iş akışında</strong>{' '}
        toplamak.
      </p>

      <h2>Tabanlık (spreadsheet) yaklaşımı</h2>
      <p>
        Excel veya benzeri araçlarda kendi tablonuzu kurmak esneklik verir: <strong>ev/deplasman formu</strong>,{' '}
        <strong>gol beklentisi</strong>, <strong>H2H özeti</strong>. Riskler: formül hatası, güncel olmayan veri,
        yanlış kaynak. Veri çekiyorsanız <strong>kullanım şartlarına</strong> ve teliflere dikkat edin.
      </p>

      <h2>Uygulama ve otomasyon</h2>
      <p>
        Mobil uygulamalar hatırlatma ve hızlı skor sunabilir; fakat <strong>şeffaflık</strong> (veri nereden geliyor?)
        ve <strong>abonelik</strong> koşulları okunmalıdır. “%100 tutma” iddialarına mesafeli durun — uzun vadede
        marj ve varyans gerçeği değişmez.
      </p>

      <h2>Web tabanlı: kurulum gerektirmeyen seçenek</h2>
      <p>
        İddaamatik’te <a href="/" style={{ color: '#60a5fa' }}>
          ana sayfadaki filtreler
        </a>{' '}
        ile geçmiş <strong>lig, maç, skor ve oran</strong> kriterlerine göre arama yapabilirsiniz; bu, ayrı bir program
        kurmadan <strong>tarayıcı üzerinden analiz</strong> imkânıdır. Detay için{' '}
        <a href="/nasil-calisir" style={{ color: '#60a5fa' }}>
          filtreleme nasıl çalışır?
        </a>{' '}
        sayfasına bakın.
      </p>

      <h2>Python / API ile ileri seviye</h2>
      <p>
        Programlama bilen kullanıcılar dış API’lerden veri çekip kendi <strong>modellerini</strong> (ör. Poisson,
        Monte Carlo) çalıştırabilir. Bu, disiplin ve istatistik bilgisi ister; yine de <strong>geleceği garanti
        etmez</strong>.
      </p>

      <p>
        <a href="/rehber/iddaa-analiz-nasil-yapilir" style={{ color: '#60a5fa' }}>
          Analiz metodolojisi
        </a>{' '}
        ·{' '}
        <a href="/analysis-robot" style={{ color: '#60a5fa' }}>
          Analiz Robotu
        </a>
      </p>
    </div>
  )
}
