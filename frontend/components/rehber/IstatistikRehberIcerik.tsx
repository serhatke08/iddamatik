export function IstatistikRehberIcerik() {
  return (
    <div className="rehber-prose">
      <p>
        <strong>İddaa istatistik</strong> araştırması yapan kullanıcılar çoğunlukla gol ortalamaları, üst/alt
        yüzdeleri, KG sıklığı ve puan durumu gibi metriklere bakar. Bunlar faydalıdır; fakat istatistik{' '}
        <strong>yanlış örneklem</strong> veya <strong>yanlış bağlam</strong> ile kullanıldığında yanıltıcı olabilir.
      </p>

      <h2>Örneklem büyüklüğü: son 5 maç tuzakları</h2>
      <p>
        <strong>Son 5 maç</strong> kısa vadeli trend gösterir; fakat <strong>şans ve fikstür</strong> (kolay/zor
        rakipler) nedeniyle gürültülüdür. Mümkünse <strong>son 10–15 lig maçı</strong> veya sezonun geniş bir
        dilimine bakın. Avrupa kupası, milli ara ve kupa maçları — lig ile <strong>aynı kadro ve motivasyonu</strong>{' '}
        taşımayabilir; ayrı etiketleyin.
      </p>

      <h2>Ev ve deplasman ayrımı şart</h2>
      <p>
        Birçok ligde <strong>iç saha</strong> ve <strong>dış saha</strong> performansı dramatik şekilde ayrışır.
        “Genel gol ortalaması” yerine <strong>evde attığı / deplasmanda attığı</strong> ve <strong>yenilen
        gol</strong> dağılımlarını ayrı yazın. Maçın hangi takımın evinde oynandığı analizin merkezinde olmalıdır.
      </p>

      <h2>Rakip kalitesi ve güç çarpanı</h2>
      <p>
        Aynı “1.8 gol ortalaması” üst düzey savunmaya karşı mı, küme hattındaki savunmalara karşı mı üretildi?
        Mümkünse <strong>rakip sırası</strong> veya <strong>beklenen gol (xG)</strong> gibi metriklerle destekleyin;
        yoksa en azından <strong>rakibin yaklaşık lig sırası</strong> notu düşün.
      </p>

      <h2>Ortalamaların ötesi</h2>
      <p>
        Gol ortalaması özet bilgidir. Mümkünse <strong>şut sayısı, isabet, büyük şanslar</strong> veya{' '}
        <strong>xG farkı</strong> gibi üretim/yaratıcılık göstergelerine bakın: “Şansla kazanılmış” seriler ile
        “hak edilmiş” üretim farklıdır.
      </p>

      <h2>İddaamatik ile tamamlayıcı bakış</h2>
      <p>
        Klasik istatistik panellerine ek olarak, geçmişte belirli <strong>oran seviyelerinde</strong> hangi sonuçların
        görüldüğünü incelemek farklı bir eksen sunar — <a href="/nasil-calisir" style={{ color: '#60a5fa' }}>
          filtreleme rehberi
        </a>{' '}
        üzerinden platformda deneyebilirsiniz.
      </p>

      <p>
        <a href="/rehber/iddaa-mac-analiz" style={{ color: '#60a5fa' }}>
          Maç analizi
        </a>{' '}
        ·{' '}
        <a href="/rehber/iddaa-analiz-nasil-yapilir" style={{ color: '#60a5fa' }}>
          Analiz nasıl yapılır?
        </a>{' '}
        ·{' '}
        <a href="/rehber/iddaa-oran-analiz" style={{ color: '#60a5fa' }}>
          Oran analizi
        </a>
      </p>
    </div>
  )
}
