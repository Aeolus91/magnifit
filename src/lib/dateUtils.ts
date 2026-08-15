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

/**
 * Returns suggested MealFlags bitmask based on user's current local hour:
 * - 05:00 - 10:59 -> Breakfast (1)
 * - 11:00 - 15:59 -> Lunch (2)
 * - 16:00 - 21:59 -> Dinner (4)
 * - 22:00 - 04:59 -> Snack (8)
 */
export const getSuggestedMealSlot = (): number => {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 11) {
    return 1 // MealFlags.BREAKFAST
  } else if (hour >= 11 && hour < 16) {
    return 2 // MealFlags.LUNCH
  } else if (hour >= 16 && hour < 22) {
    return 4 // MealFlags.DINNER
  } else {
    return 8 // MealFlags.SNACK
  }
}
