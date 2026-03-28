'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="tr">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          background: '#0b0f1a',
          color: '#e5e7eb',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <h1 style={{ fontSize: '1.35rem', marginBottom: 12 }}>Uygulama yüklenemedi</h1>
          <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 20, lineHeight: 1.5 }}>
            {error.message || 'Önbellek veya ağ sorunu olabilir.'}
          </p>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
            Terminalde <code style={{ color: '#93c5fd' }}>rm -rf .next && npm run dev</code> deneyin.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              padding: '12px 22px',
              borderRadius: 10,
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              background: '#3b82f6',
              color: '#fff',
            }}
          >
            Tekrar dene
          </button>
        </div>
      </body>
    </html>
  )
}
