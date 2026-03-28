/**
 * Uzun form rehber gövdesi — SEO ve okunabilirlik için bölümlendirilmiş içerik.
 */
export function AnalizNasilYapilirIcerik() {
  return (
    <div className="rehber-prose">
      <p>
        <strong>İddaa analizinin nasıl yapılması gerektiği</strong> sorusu, tek bir “sihirli liste” ile cevaplanamaz;
        ama profesyonelce yaklaşanlar için <strong>tekrarlanabilir bir kontrol listesi</strong> ve <strong>öncelik
        sırası</strong> vardır. Aşağıdaki çerçeve, duygusal tahmin ile veri odaklı incelemeyi ayırır; hiçbir bölüm
        kesin kazanç vaadi taşımaz — ama <em>ne bilerek karar verdiğinizi</em> netleştirir.
      </p>

      <h2>1. Önce soruyu netleştir: neye bahis oynuyorsun?</h2>
      <p>
        Analiz, “kim kazanır?” diye başlamaz; “<strong>hangi piyasaya</strong> (MS1, MS2, beraberlik, üst/alt, KG
        vb.) ve <strong>hangi zaman dilimine</strong> (90 dakika, özel bahisler) odaklanıyorum?” diye devam eder.
        Farklı piyasalar farklı bilgi gerektirir: üst bahis için <strong>şut hacmi ve tempo</strong> daha kritik
        olabilir; MS1 için <strong>ev sahibi iç saha performansı</strong> ve <strong>rakıp kalitesi</strong> öne çıkar.
        Soru net değilse, veri toplamak da dağınık kalır.
      </p>

      <h2>2. Form: son 5 maç neden yeterli değil (tek başına)?</h2>
      <p>
        Medya ve sosyal ağlarda sık duyduğun <strong>“son 5 maç formu”</strong> hızlı bir özet sunar; fakat{' '}
        <strong>örneklem çok küçük</strong> olduğu için gürültüye (şans, penaltı, kırmızı kart) açıktır. Profesyonel
        yaklaşımda:
      </p>
      <ul>
        <li>
          <strong>Genişlik:</strong> Mümkünse <strong>son 10–15 lig maçı</strong> (veya sezon içi geniş örneklem) ile
          bak; Avrupa kupası, ulusal kupa ve hazırlık maçları ayrı değerlendirilir (kadro ve motivasyon farklı olabilir).
        </li>
        <li>
          <strong>Ev / deplasman ayrımı:</strong> Birçok ligde ev sahibi avantajı istatistiksel olarak güçlüdür. “Genel
          form” yerine <strong>evdeki form</strong> ve <strong>deplasmandaki form</strong> ayrı tablolarda yazılmalı.
        </li>
        <li>
          <strong>Rakip kalitesi:</strong> Son 5 maçın 4’ü lig dibindeki takımlara karşıysa, “5’te 5 galibiyet”
          yanıltıcı olabilir. Karşılaştığınız rakibin <strong>puan sırası ve beklenen gücü</strong> (xG, şut farkı
          gibi ileri metrikler varsa) not edilmelidir.
        </li>
      </ul>

      <h2>3. Karşılıklı maçlar (H2H): “geçmişe” ne kadar güvenilir?</h2>
      <p>
        İki takımın <strong>son 10 yıldaki</strong> her karşılaşmasını aynı ağırlıkta görmek hata olur: kadrolar,
        teknik direktörler, lig seviyesi değişir. Pratik kural:
      </p>
      <ul>
        <li>
          <strong>Son 3–5 karşılaşma</strong> taktik ve kadro benzerliği varsa referans alınır.
        </li>
        <li>
          <strong>Çok eski H2H</strong> (ör. 8–10 yıl önce) sadece “derbi dinamiği”, taraftar baskısı gibi{' '}
          <strong>psikolojik</strong> bağlam için anlatı olarak kullanılır; skor tahminine doğrudan ağırlık vermeyin.
        </li>
        <li>
          <strong>Saha ve ev-deplasman</strong>: H2H’te hangi maçların ev sahibinde oynandığını ayırın; bugünkü maçın
          evi farklıysa bağlam değişir.
        </li>
      </ul>

      <h2>4. Kadro, sakatlık, ceza ve rotasyon</h2>
      <p>
        Analizin <strong>en güncel</strong> parçası burasıdır. Yıldız forvetin yokluğu, kaleci değişimi veya
        orta saha dinamosunun sakatlığı — özellikle dar kadrolu takımlarda — oranlardan önce bile fiyatlanmış olabilir.
        Yapılacaklar:
      </p>
      <ul>
        <li>
          <strong>Resmi kaynaklar</strong> ve mümkünse kulüp açıklamaları; sosyal medya söylentilerine tek başına
          güvenmeyin.
        </li>
        <li>
          <strong>Cezalı</strong> oyuncuların pozisyonu: stoper çifti yerine genç stoper oynaması savunma
          yapısını değiştirir.
        </li>
        <li>
          <strong>Çok maçlı haftalar:</strong> Avrupa + lig sıkışıklığında rotasyon riski; “en iyi 11” garanti değildir.
        </li>
      </ul>

      <h2>5. Maç sıklığı, yorgunluk ve seyahat</h2>
      <p>
        Takımın <strong>kaç gün önce</strong> maç yaptığı, <strong>deplasman mesafesi</strong> ve <strong>önceki
        maçın şiddeti</strong> (uzatma, kırmızı kart) performansı etkiler. Özellikle yoğun fikstürde <strong>bench
        derinliği</strong> zayıf takımlar daha fazla risk taşır. Bu başlık, “son 5 maç formu”ndan bile bazen daha
        önemli olabilir — çünkü <strong>fiziksel tükeniş</strong> istatistiklere gecikmeli yansır.
      </p>

      <h2>6. Motivasyon ve fikstür bağlamı</h2>
      <p>
        <strong>Şampiyonluk</strong>, <strong>Avrupa hattı</strong>, <strong>küme düşme</strong> çizgisi — son 5
        haftada takımların “kazanmak zorunda mı?” sorusu farklıdır. Bazen puan durumu “beraberlik yeter” senaryosu
        üretir; bu da <strong>maç içi temposu</strong> ve gol beklentisini değiştirir. Aynı şekilde, bir takım için
        kupa finalinden önceki lig maçı <strong>görece önceliksiz</strong> olabilir (rotasyon).
      </p>

      <h2>7. İstatistik: gol ortalamasının ötesi</h2>
      <p>
        Sadece “atılan / yenilen gol” ortalaması yetmez; mümkünse şu ayrımlara bakın:
      </p>
      <ul>
        <li>
          <strong>Beklenen gol (xG)</strong> veya benzeri modeller: şu kadar gol atıldı, ama <em>hak edilen</em> gol
          farklı mıydı? (Şanslı galibiyetler veya “hak edilmiş” mağlubiyetler.)
        </li>
        <li>
          <strong>Şut sayısı ve isabet</strong>: üretim var mı, yoksa kontra şansına mı bağlısınız?
        </li>
        <li>
          <strong>Standart durumlar</strong>: duran top gücü dar skorlarda belirleyici olabilir.
        </li>
      </ul>
      <p>
        Bu metrikler her yerde ücretsiz ve doğru olmayabilir; yoksa <strong>gol farkı</strong>, <strong>karşılıklı
        gol</strong> yüzdeleri ve <strong>üst/alt</strong> trendleri gibi klasik istatistiklerle yetin — ama mutlaka{' '}
        <strong>ev/deplasman ayrılmış</strong> örneklemle.
      </p>

      <h2>8. Oranlar: piyasanın fiyatı ve senin tahminin</h2>
      <p>
        Oran <strong>olasılık + marj</strong> içerir. Analizde oranı şöyle kullanırsın:
      </p>
      <ul>
        <li>
          <strong>Bağlamı</strong> (yukarıdaki tüm başlıklar) okuduktan sonra kendi zihninde bir <strong>olasılık
          aralığı</strong> çıkarırsın (ör. “ev %40–%48” gibi kabaca).
        </li>
        <li>
          <strong>Oranın ima ettiği olasılığı</strong> (implikasyon) ile kendi aralığını karşılaştırırsın; büyük
          çelişki “değer” tartışması başlatır — ama bu tartışma <strong>yanılgı</strong> olabilir; küçük
          örneklemde güveni abartma.
        </li>
        <li>
          <strong>Oran hareketi</strong> (açılış → kapanış) bilgi akışını yansıtır; erken oran ile kapanış arasındaki
          fark bazen sakatlık veya para akışıdır.
        </li>
      </ul>

      <h2>9. Örnek kontrol listesi (maç öncesi)</h2>
      <table>
        <thead>
          <tr>
            <th>Başlık</th>
            <th>Ne soruyorsun?</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Form</td>
            <td>Son 10–15 lig maçı; ev/deplasman ayrı; rakip gücü</td>
          </tr>
          <tr>
            <td>H2H</td>
            <td>Son birkaç karşılaşma; saha / kadro benzerliği</td>
          </tr>
          <tr>
            <td>Kadro</td>
            <td>Sakat, ceza, muhtemel 11</td>
          </tr>
          <tr>
            <td>Fikstür</td>
            <td>Yoğunluk, seyahat, rotasyon riski</td>
          </tr>
          <tr>
            <td>Motivasyon</td>
            <td>Puan durumu, hedef maç</td>
          </tr>
          <tr>
            <td>Oran</td>
            <td>Piyasa fiyatı ile kendi hikâyenin uyumu</td>
          </tr>
        </tbody>
      </table>

      <h2>10. Disiplin: not tutma ve bütçe</h2>
      <p>
        Analizin kalitesi, <strong>sonuçtan sonra</strong> güncellenir: tahminini yaz, maç sonrası “neden
        tuttu/tutmadı?” diye bir not düş. Bu, gelecekteki analizlerini kalibre eder. Parasal tarafta:
        <strong>tek maça bütçenin küçük bir yüzdesi</strong>, kayıp telafisi yok, duygusal bahis yok.
      </p>

      <blockquote>
        Özet: İddaa analizi, tek bir “son 5 maç” kutucuğuna sığmaz; <strong>form + H2H + ev/deplasman + kadro +
        fikstür + motivasyon + oran</strong> zincirinde tutarlı bir hikâye kurmaktır. İddaamatik bu zincirin{' '}
        <strong>geçmiş oran ve sonuç</strong> kısmında veri sunar; geri kalanını senin bağlamın doldurur.
      </blockquote>

      <p>
        <a href="/rehber/iddaa-mac-analiz" style={{ color: '#60a5fa' }}>
          Maç analizi rehberi
        </a>{' '}
        ·{' '}
        <a href="/rehber/iddaa-istatistik" style={{ color: '#60a5fa' }}>
          İstatistik
        </a>{' '}
        ·{' '}
        <a href="/rehber/iddaa-oran-analiz" style={{ color: '#60a5fa' }}>
          Oran analizi
        </a>{' '}
        ·{' '}
        <a href="/nasil-calisir" style={{ color: '#60a5fa' }}>
          Platform filtreleri
        </a>
      </p>
    </div>
  )
}
