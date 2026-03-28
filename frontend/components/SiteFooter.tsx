import Link from 'next/link'

const siteUrl = 'https://iddamatik.vercel.app'

const rehberLinks = [
  { href: '/rehber/iddaa-analiz', label: 'İddaa analiz' },
  { href: '/rehber/iddaa-oran-analiz', label: 'Oran analizi' },
  { href: '/rehber/iddaa-istatistik', label: 'İstatistik' },
  { href: '/rehber/iddaa-mac-analiz', label: 'Maç analizi' },
  { href: '/rehber/iddaa-analiz-nasil-yapilir', label: 'Analiz nasıl yapılır?' },
  { href: '/rehber/iddaa-analiz-programi', label: 'Analiz programı' },
  { href: '/rehber/iddaa-analiz-sitesi', label: 'Analiz sitesi' },
  { href: '/rehber/iddaa-nedir', label: 'İddaa nedir?' },
  { href: '/rehber/oran-nasil-belirlenir', label: 'Oran nasıl belirlenir?' },
  { href: '/nasil-calisir', label: 'Filtreleme rehberi' },
]

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-topline" aria-hidden />
      <div className="site-footer-inner">
        <div className="site-footer-card site-footer-card--brand">
          <Link href="/" className="site-footer-logo-block">
            <img src="/logo.png" alt="" width={44} height={44} className="site-footer-logo" />
            <div>
              <span className="site-footer-name">İddaamatik</span>
              <span className="site-footer-badge">Veri · analiz</span>
            </div>
          </Link>
          <p className="site-footer-tagline">
            Geçmiş maç ve oran verileriyle analiz odaklı bilgi platformu. Şans oyunlarında sorumlu olun; 18+.
          </p>
        </div>

        <div className="site-footer-card">
          <h2 className="site-footer-card-title">Site</h2>
          <ul className="site-footer-links">
            <li>
              <Link href="/hakkimizda">Hakkımızda</Link>
            </li>
            <li>
              <Link href="/iletisim">İletişim</Link>
            </li>
            <li>
              <Link href="/gizlilik-politikasi">Gizlilik politikası</Link>
            </li>
          </ul>
        </div>

        <div className="site-footer-card site-footer-card--rehber">
          <div className="site-footer-rehber-head">
            <h2 className="site-footer-card-title">Bilgi rehberi</h2>
            <p className="site-footer-card-desc">Oranlar, analiz ve platform kullanımı</p>
          </div>
          <ul className="site-footer-rehber-grid">
            {rehberLinks.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
          <Link href="/rehber" className="site-footer-rehber-all">
            Tüm rehber yazıları
            <span aria-hidden> →</span>
          </Link>
        </div>
      </div>

      <div className="site-footer-bottom">
        <p className="site-footer-copy">© {new Date().getFullYear()} İddaamatik</p>
        <span className="site-footer-dot" aria-hidden />
        <a href={`${siteUrl}/sitemap.xml`} className="site-footer-meta-link">
          Site haritası
        </a>
        <span className="site-footer-dot" aria-hidden />
        <a href="/" className="site-footer-meta-link">
          Ana sayfa
        </a>
      </div>
    </footer>
  )
}
