'use client'

import Link from 'next/link'

export function GuideCallout() {
  return (
    <aside className="guide-callout" aria-label="Filtreleme rehberi">
      <div className="guide-callout-glow" aria-hidden />
      <div className="guide-callout-inner">
        <div className="guide-callout-icon" aria-hidden>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="guide-callout-text">
          <p className="guide-callout-kicker">İlk kez mi kullanıyorsunuz?</p>
          <p className="guide-callout-title">Filtreleri doğru kullanmak için kısa rehber</p>
          <p className="guide-callout-desc">
            Hangi kutuya ne yazılır, tolerans (+/−) ne işe yarar ve sonuçlar nasıl süzülür — adım adım anlatıldı.
          </p>
        </div>
        <Link href="/nasil-calisir" className="guide-callout-cta">
          Rehberi aç
          <span className="guide-callout-cta-arrow" aria-hidden>
            →
          </span>
        </Link>
      </div>
    </aside>
  )
}
