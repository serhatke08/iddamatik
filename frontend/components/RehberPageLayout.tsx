import type { ReactNode } from 'react'
import Link from 'next/link'
import { SiteHeader } from '@/components/SiteHeader'

type Props = {
  breadcrumbLabel: string
  children: ReactNode
}

export function RehberPageLayout({ breadcrumbLabel, children }: Props) {
  return (
    <div className="container">
      <SiteHeader />
      <article className="search-section" style={{ maxWidth: '860px', margin: '0 auto 32px' }}>
        <nav style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '16px' }} aria-label="Sayfa konumu">
          <Link href="/" style={{ color: '#60a5fa', textDecoration: 'none' }}>
            Ana sayfa
          </Link>
          <span aria-hidden> / </span>
          <Link href="/rehber" style={{ color: '#60a5fa', textDecoration: 'none' }}>
            Rehber
          </Link>
          <span aria-hidden> / </span>
          <span style={{ color: '#e5e7eb' }}>{breadcrumbLabel}</span>
        </nav>
        {children}
      </article>
    </div>
  )
}
