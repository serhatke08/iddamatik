/**
 * İddaa programındaki tarih (gg/AA/yyyy) ve saat (SS:dd) Türkiye saati (TRT, UTC+3) kabul edilir.
 */

export function parseIddaaKickoffMs(dateStr: string, timeStr: string | undefined | null): number | null {
  const d = dateStr?.trim()
  if (!d) return null
  const m = d.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return null
  const dd = parseInt(m[1], 10)
  const mo = parseInt(m[2], 10)
  const yyyy = parseInt(m[3], 10)
  if (!Number.isFinite(dd) || !Number.isFinite(mo) || !Number.isFinite(yyyy)) return null

  const t = (timeStr || '00:00').trim()
  const tp = t.split(':')
  const hh = Math.min(23, Math.max(0, parseInt(tp[0] ?? '0', 10) || 0))
  const mnt = Math.min(59, Math.max(0, parseInt(tp[1] ?? '0', 10) || 0))

  // TRT = UTC+3
  return Date.UTC(yyyy, mo - 1, dd, hh - 3, mnt, 0, 0)
}

/** Şu an başlama anından önce mi? Başlama anı ve sonrası false (oynanmış sayılır). */
export function isMatchUpcomingIddaa(dateStr: string, timeStr: string | undefined | null, nowMs = Date.now()): boolean {
  const k = parseIddaaKickoffMs(dateStr, timeStr)
  if (k === null) return true
  return nowMs < k
}

/** API'den gelen Unix ms (İddaa kickoff) varsa öncelikli kullan; string yuvarlamasından kaynaklı boş liste olmaz. */
export function isMatchUpcomingFromApi(
  kickoffMs: number | undefined | null,
  dateStr: string,
  timeStr: string | undefined | null,
  nowMs = Date.now()
): boolean {
  if (typeof kickoffMs === 'number' && Number.isFinite(kickoffMs)) {
    return nowMs < kickoffMs
  }
  return isMatchUpcomingIddaa(dateStr, timeStr, nowMs)
}
