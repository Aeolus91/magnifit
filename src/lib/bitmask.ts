/**
 * Bitmask Helper Utility for mfit
 * Compact 32-bit Workout, Meal, Profile, and Micronutrient Bitmask Mapping
 */

export const ProfilePrefs = {
  IMPERIAL: 1 << 0,       // Bit 0: 0=Metric (kg, cm, ml), 1=Imperial (lbs, in, oz)
  PUBLIC_PROFILE: 1 << 1, // Bit 1: 0=Private, 1=Public
  DARK_THEME: 1 << 2,     // Bit 2: 0=Auto, 1=Dark
  TRACK_MICROS: 1 << 3    // Bit 3: 0=Off, 1=On
} as const

export const MicroNutrientFlags: Record<string, { bit: number; col: string }> = {
  SUGAR: { bit: 1 << 0, col: 'sugar_g' },
  ADDED_SUGAR: { bit: 1 << 1, col: 'added_sugar_g' },
  SAT_FAT: { bit: 1 << 2, col: 'sat_fat_g' },
  TRANS_FAT: { bit: 1 << 3, col: 'trans_fat_g' },
  MONO_FAT: { bit: 1 << 4, col: 'mono_fat_g' },
  POLY_FAT: { bit: 1 << 5, col: 'poly_fat_g' },
  OMEGA_3: { bit: 1 << 6, col: 'omega_3_mg' },
  OMEGA_6: { bit: 1 << 7, col: 'omega_6_mg' },
  CAFFEINE: { bit: 1 << 8, col: 'caffeine_mg' },
  SODIUM: { bit: 1 << 9, col: 'sodium_mg' },
  POTASSIUM: { bit: 1 << 10, col: 'potassium_mg' },
  CHOLESTEROL: { bit: 1 << 11, col: 'cholesterol_mg' },
  HDL: { bit: 1 << 12, col: 'hdl_mg' },
  LDL: { bit: 1 << 13, col: 'ldl_mg' },
  IRON: { bit: 1 << 14, col: 'iron_mg' },
  CALCIUM: { bit: 1 << 15, col: 'calcium_mg' },
  MAGNESIUM: { bit: 1 << 16, col: 'magnesium_mg' },
  ZINC: { bit: 1 << 17, col: 'zinc_mg' },
  VIT_A: { bit: 1 << 18, col: 'vit_a_mcg' },
  VIT_C: { bit: 1 << 19, col: 'vit_c_mg' },
  VIT_D: { bit: 1 << 20, col: 'vit_d_mcg' },
  VIT_B12: { bit: 1 << 21, col: 'vit_b12_mcg' }
}

export const MealFlags = {
  BREAKFAST: 1 << 0,  // 1
  LUNCH: 1 << 1,      // 2
  DINNER: 1 << 2,     // 4
  SNACK: 1 << 3,      // 8
  VEGAN: 1 << 4,      // 16
  VEGETARIAN: 1 << 5, // 32
  KETO: 1 << 6,       // 64
  GLUTEN_FREE: 1 << 7 // 128
} as const

export const WORKOUT_CATEGORIES: Record<number, string> = {
  0: 'General / Custom',
  1: 'Traditional Strength',
  2: 'Functional Strength',
  3: 'Running',
  4: 'Treadmill',
  5: 'Track Running',
  6: 'Trail Running',
  7: 'Outdoor Cycling',
  8: 'Indoor Cycling / Spinning',
  9: 'Mountain Biking',
  10: 'E-Bike Cycling',
  11: 'Pool Swimming',
  12: 'Open Water Swimming',
  13: 'HIIT / Circuit',
  14: 'Cross Training',
  15: 'Walking',
  16: 'Hiking',
  17: 'Yoga',
  18: 'Pilates',
  19: 'Barre',
  20: 'Core Training',
  21: 'Rowing Machine',
  22: 'Water Rowing',
  23: 'Elliptical',
  24: 'Stair Stepper / Climber',
  25: 'Jump Rope',
  26: 'Kickboxing',
  27: 'Boxing',
  28: 'Martial Arts',
  29: 'Wrestling',
  30: 'Cross-Country Skiing',
  31: 'Downhill Skiing',
  32: 'Snowboarding',
  33: 'Snowshoeing',
  34: 'Skating / Ice Hockey',
  35: 'Roller Skating',
  36: 'Surfing',
  37: 'Paddleboarding (SUP)',
  38: 'Kayaking',
  39: 'Canoeing',
  40: 'Sailing',
  41: 'Rock Climbing',
  42: 'Bouldering',
  43: 'Tennis',
  44: 'Pickleball',
  45: 'Badminton',
  46: 'Squash / Racquetball',
  47: 'Padel',
  48: 'Table Tennis',
  49: 'Basketball',
  50: 'Soccer / Football',
  51: 'American Football',
  52: 'Rugby',
  53: 'Volleyball',
  54: 'Beach Volleyball',
  55: 'Baseball / Softball',
  56: 'Golf',
  57: 'Track & Field',
  58: 'Gymnastics',
  59: 'Calisthenics',
  60: 'Dance',
  61: 'Zumba',
  62: 'Mobility / Stretching',
  63: 'Cooldown',
  64: 'Meditation / Mindful Movement',
}

export const AttributeFlags = {
  OUTDOOR: 1 << 16,     // 65536
  GPS_TRACKED: 1 << 17, // 131072
  INTERVALS: 1 << 18    // 262144
} as const

/** Core bitwise operations */
export function hasFlag(mask: number, flag: number): boolean {
  return (mask & flag) === flag
}

export function addFlag(mask: number, flag: number): number {
  return mask | flag
}

export function removeFlag(mask: number, flag: number): number {
  return mask & ~flag
}

/** Converts user's micros_bitmask into a targeted PostgREST select query string */
export function buildMicroSelectQuery(microsMask: number): string {
  const activeCols = ['meal_id']
  for (const key of Object.keys(MicroNutrientFlags)) {
    const item = MicroNutrientFlags[key]
    if (hasFlag(microsMask, item.bit)) {
      activeCols.push(item.col)
    }
  }
  return activeCols.join(', ')
}

/** Decoders */
export function decodeProfilePrefs(mask: number) {
  return {
    isImperial: hasFlag(mask, ProfilePrefs.IMPERIAL),
    isPublic: hasFlag(mask, ProfilePrefs.PUBLIC_PROFILE),
    isDarkTheme: hasFlag(mask, ProfilePrefs.DARK_THEME),
    trackMicros: hasFlag(mask, ProfilePrefs.TRACK_MICROS)
  }
}

export function decodeMealFlags(mask: number) {
  return {
    isBreakfast: hasFlag(mask, MealFlags.BREAKFAST),
    isLunch: hasFlag(mask, MealFlags.LUNCH),
    isDinner: hasFlag(mask, MealFlags.DINNER),
    isSnack: hasFlag(mask, MealFlags.SNACK),
    isVegan: hasFlag(mask, MealFlags.VEGAN),
    isVegetarian: hasFlag(mask, MealFlags.VEGETARIAN),
    isKeto: hasFlag(mask, MealFlags.KETO),
    isGlutenFree: hasFlag(mask, MealFlags.GLUTEN_FREE)
  }
}

export function encodeWorkoutFlags(categoryId: number, options: { outdoor?: boolean; gps?: boolean; intervals?: boolean } = {}): number {
  let mask = categoryId & 0xFF
  if (options.outdoor) mask |= AttributeFlags.OUTDOOR
  if (options.gps) mask |= AttributeFlags.GPS_TRACKED
  if (options.intervals) mask |= AttributeFlags.INTERVALS
  return mask
}

export function decodeWorkoutFlags(mask: number) {
  const categoryId = mask & 0xFF
  return {
    categoryId,
    categoryName: WORKOUT_CATEGORIES[categoryId] || 'Unknown Workout',
    isOutdoor: hasFlag(mask, AttributeFlags.OUTDOOR),
    isGpsTracked: hasFlag(mask, AttributeFlags.GPS_TRACKED),
    isIntervals: hasFlag(mask, AttributeFlags.INTERVALS)
  }
}
