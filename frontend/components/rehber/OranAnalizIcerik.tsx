export function OranAnalizIcerik() {
  return (
    <div className="rehber-prose">
      <p>
        <strong>İddaa oran analizi</strong>, bahis oranlarını yalnızca “yüksek/düşük” diye değil;{' '}
        <strong>hangi olasılığı fiyatladıklarını</strong> ve <strong>geçmişte benzer fiyatların yanında hangi
        sonuçların geldiğini</strong> birlikte düşünmektir. Oran, piyasanın görüşüdür; tek başına hakikat değildir.
      </p>

      <h2>Oranı olasılık diline çevirmek</h2>
      <p>
        Ondalık orandan kabaca <strong>çıpalı olasılık</strong> (implied probability) türetilebilir; bu, işletme
        marjı nedeniyle %100’ü aşan bir dağılımdır. Analizde asıl mesele: <strong>Senin maç hikâyen</strong> (form,
        eksikler, H2H) piyasanın fiyatladığı olasılıkla <strong>ne kadar örtüşüyor?</strong> Büyük çelişki, tartışma
        konusu “değer”yi başlatır — fakat küçük örneklemde yanılgı riski yüksektir.
      </p>

      <h2>Geçmiş oran bandı ile okuma</h2>
      <p>
        Belirli bir <strong>MS1, üst/alt veya KG</strong> seviyesinde kapanmış geçmiş maçları incelemek, “bu fiyat
        bandında tarihte ne olmuş?” sorusuna <strong>istatistiksel bir çerçeve</strong> verir. Bu, geleceği
        garanti etmez; lig değişir, kadro değişir, marj değişir. Yine de <strong>tek maçlık içgüdü</strong> ile
        karşılaştırıldığında daha geniş bir örneklem sunar.
      </p>

      <h2>Lig ve sezon tutarlılığı</h2>
      <p>
        Aynı oran <strong>Süper Lig</strong> ile <strong>alt lig</strong>de aynı anlama gelmez; savunma kalitesi,
        tempo ve hakem profili farklıdır. Analiz yaparken veriyi mümkün olduğunca <strong>aynı lig / benzer
        sezon</strong> içinde tutmak hata payını azaltır.
      </p>

      <h2>Yaygın tuzaklar</h2>
      <ul>
        <li>
          <strong>Küçük örneklem:</strong> iki üç maçla “kesin kural” çıkarmak.
        </li>
        <li>
          <strong>Düşük oran = garanti:</strong> düşük oran yüksek olasılık ima eder; sıfır risk değildir.
        </li>
        <li>
          <strong>Oranı bağlamdan koparmak:</strong> sakatlık veya motivasyon haberi orana yansımış olabilir.
        </li>
      </ul>

      <p>
        <a href="/rehber/oran-nasil-belirlenir" style={{ color: '#60a5fa' }}>
          Oranlar nasıl belirlenir?
        </a>{' '}
        ·{' '}
        <a href="/rehber/iddaa-analiz-nasil-yapilir" style={{ color: '#60a5fa' }}>
          Analiz çerçevesi
        </a>{' '}
        ·{' '}
        <a href="/nasil-calisir" style={{ color: '#60a5fa' }}>
          Platformda filtreleme
        </a>
      </p>
    </div>
  )
}
