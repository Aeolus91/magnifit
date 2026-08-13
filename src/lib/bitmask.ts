/**
 * Bitmask Helper Utility for mfit
 * Minimal byte-level flag manipulation for database egress optimization
 */

export const WorkoutFlags = {
  STRENGTH: 1 << 0,   // 1
  CARDIO: 1 << 1,     // 2
  HIIT: 1 << 2,       // 4
  OUTDOORS: 1 << 3,   // 8
  FLEXIBILITY: 1 << 4 // 16
} as const

export const PrivacyFlags = {
  PRIVATE: 0,
  FRIENDS_ONLY: 1 << 0, // 1
  PUBLIC: 1 << 1       // 2
} as const

/**
 * Checks if a specific flag is set within a bitmask integer
 */
export function hasFlag(mask: number, flag: number): boolean {
  return (mask & flag) === flag
}

/**
 * Toggles or sets a flag on a bitmask integer
 */
export function addFlag(mask: number, flag: number): number {
  return mask | flag
}

/**
 * Removes a flag from a bitmask integer
 */
export function removeFlag(mask: number, flag: number): number {
  return mask & ~flag
}

/**
 * Extracts array of active flag keys from a bitmask integer
 */
export function getActiveFlags(mask: number, flagObj: Record<string, number>): string[] {
  return Object.keys(flagObj).filter(key => hasFlag(mask, flagObj[key]))
}
