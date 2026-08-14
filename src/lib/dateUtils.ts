/**
 * Date and Timezone Utilities for mfit
 * Pure Date-First Architecture:
 * - Uses client device timezone (via Intl) to determine local calendar boundaries.
 * - Stores pure YYYY-MM-DD log_date for target day selection (zero timezone spillage).
 */

export const getLocalISODate = (val: string | Date | undefined | null): string => {
  if (!val) return ''
  const d = typeof val === 'string' ? new Date(val) : val
  if (isNaN(d.getTime())) return ''
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const getTodayDateString = (): string => {
  return getLocalISODate(new Date())
}

export const getUserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}
