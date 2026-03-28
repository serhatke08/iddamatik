'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div
      style={{
        padding: '32px 20px',
        maxWidth: 520,
        margin: '0 auto',
        textAlign: 'center',
        color: '#e5e7eb',
      }}
    >
      <h2 style={{ fontSize: '1.25rem', marginBottom: 12, color: '#f9fafb' }}>Sayfa yüklenirken bir hata oluştu</h2>
      <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 20, lineHeight: 1.5 }}>
        {error.message || 'Beklenmeyen bir sorun oluştu.'}
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
          fontSize: 14,
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          color: '#fff',
        }}
      >
        Tekrar dene
      </button>
    </div>
  )
}
