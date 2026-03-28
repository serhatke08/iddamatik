'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Ana Sayfa' },
  { href: '/odds', label: 'Oranlar' },
  { href: '/analysis-robot', label: 'Analiz Robotu' },
  { href: '/stats', label: 'İstatistik' },
] as const

export function SiteHeader() {
  const pathname = usePathname()

  return (
    <header className="navbar">
      <div className="navbar-content">
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <img
            src="/logo.png"
            alt="İddaamatik logo"
            style={{ height: '32px', width: '32px', objectFit: 'contain' }}
          />
          <span
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#f9fafb',
              background: 'linear-gradient(135deg, #ffffff 0%, #e5e7eb 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            İddaa Analiz Platformu
          </span>
        </Link>
        <nav aria-label="Ana menü">
          {links.map(({ href, label }) => (
            <Link key={href} href={href} className={pathname === href ? 'active' : ''}>
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
