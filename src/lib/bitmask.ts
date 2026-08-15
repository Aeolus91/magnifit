/**
 * Bitmask Helper Utility for mfit
 * Compact 32-bit Workout, Meal, Profile, and Micronutrient Bitmask Mapping
 */

export const ProfilePrefs = {
  IMPERIAL: 1 << 0,             // Bit 0: 0=Metric (kg, cm, ml), 1=Imperial (lbs, in, oz)
  PUBLIC_PROFILE: 1 << 1,       // Bit 1: 0=Private, 1=Public
  DARK_THEME: 1 << 2,           // Bit 2: 0=Auto, 1=Dark
  TRACK_MICROS: 1 << 3,         // Bit 3: 0=Off, 1=On
  ONBOARDING_COMPLETED: 1 << 4  // Bit 4: 0=Pending Onboarding, 1=Completed
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

/** Check if a specific micronutrient column is enabled by user's micros_opt bitmask */
export function isMicroColumnTracked(colName: string, microsOpt: number | undefined | null): boolean {
  // If user has not configured (0 or undefined/null), default to showing all
  if (!microsOpt || microsOpt === 0) return true
  const entry = Object.values(MicroNutrientFlags).find(f => f.col === colName)
  if (!entry) return true
  return (microsOpt & entry.bit) !== 0
}

/** Filter a microLabels record based on user's micros_opt bitmask */
export function filterTrackedMicroLabels<T>(
  labelsMap: Record<string, T>,
  microsOpt: number | undefined | null
): Record<string, T> {
  if (!microsOpt || microsOpt === 0) return labelsMap
  const filtered: Record<string, T> = {}
  Object.entries(labelsMap).forEach(([k, v]) => {
    if (isMicroColumnTracked(k, microsOpt)) {
      filtered[k] = v
    }
  })
  return filtered
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

// ----------------------------------------------------
// Biometrics Categories, Units, Types & Flags
// ----------------------------------------------------

export const BIOMETRIC_CATEGORIES = {
  BODY_COMPOSITION: 1,
  CIRCUMFERENCES: 2,
  VITALS: 3,
  METABOLIC_LABS: 4,
  PERFORMANCE: 5
} as const

export const BIOMETRIC_CATEGORY_LABELS: Record<number, string> = {
  1: 'Body Composition',
  2: 'Circumferences',
  3: 'Vitals & Cardiovascular',
  4: 'Metabolic & Labs',
  5: 'Performance'
}

export const BIOMETRIC_UNITS = {
  DG: 1,            // Decigram (0.1 kg) -> 725 = 72.5 kg
  MM: 2,            // Millimeter (0.1 cm) -> 820 = 82.0 cm
  BPM: 3,           // Beats per minute -> 60
  MMHG: 4,          // Millimeters of mercury -> 120
  PERCENT_CENTI: 5, // 0.01% -> 1450 = 14.5%
  MG_DL: 6,         // mg/dL -> 95
  MS: 7,            // Milliseconds (HRV) -> 65
  CELSIUS_DECI: 8,  // 0.1°C -> 366 = 36.6°C
  MMOL_L_DECI: 9,   // 0.1 mmol/L -> 15 = 1.5 mmol/L
  ML_KG_MIN_DECI: 10 // 0.1 mL/kg/min -> 485 = 48.5
} as const

export const BiometricFlags = {
  UNILATERAL_LEFT: 1 << 0,   // 1 (Left side)
  UNILATERAL_RIGHT: 1 << 1,  // 2 (Right side)
  BILATERAL_AVG: 1 << 2,     // 4 (Average of both)
  FASTED: 1 << 3,            // 8 (Measured Fasted)
  POST_WORKOUT_PUMP: 1 << 4, // 16 (Measured with muscle pump)
  RESTING: 1 << 5            // 32 (Resting state)
} as const

export interface BiometricTypeMeta {
  cat: number
  name: string
  unit: number
  unitLabel: string
  scale: number
  step: number
  isUnilateral?: boolean
  defaultVal: number
}

export const BIOMETRIC_TYPES: Record<number, BiometricTypeMeta> = {
  // Body Composition (1-9)
  1: { cat: 1, name: 'Body Weight', unit: BIOMETRIC_UNITS.DG, unitLabel: 'kg', scale: 10, step: 0.1, defaultVal: 72.5 },
  2: { cat: 1, name: 'Body Fat Percentage', unit: BIOMETRIC_UNITS.PERCENT_CENTI, unitLabel: '%', scale: 100, step: 0.1, defaultVal: 15.0 },
  3: { cat: 1, name: 'Muscle Mass', unit: BIOMETRIC_UNITS.DG, unitLabel: 'kg', scale: 10, step: 0.1, defaultVal: 55.0 },
  4: { cat: 1, name: 'Bone Mass', unit: BIOMETRIC_UNITS.DG, unitLabel: 'kg', scale: 10, step: 0.1, defaultVal: 3.2 },
  5: { cat: 1, name: 'Body Water', unit: BIOMETRIC_UNITS.PERCENT_CENTI, unitLabel: '%', scale: 100, step: 0.1, defaultVal: 58.0 },

  // Circumferences (10-29)
  10: { cat: 2, name: 'Waist', unit: BIOMETRIC_UNITS.MM, unitLabel: 'cm', scale: 10, step: 0.5, defaultVal: 80.0 },
  11: { cat: 2, name: 'Chest', unit: BIOMETRIC_UNITS.MM, unitLabel: 'cm', scale: 10, step: 0.5, defaultVal: 98.0 },
  12: { cat: 2, name: 'Hips', unit: BIOMETRIC_UNITS.MM, unitLabel: 'cm', scale: 10, step: 0.5, defaultVal: 95.0 },
  13: { cat: 2, name: 'Biceps', unit: BIOMETRIC_UNITS.MM, unitLabel: 'cm', scale: 10, step: 0.5, isUnilateral: true, defaultVal: 36.0 },
  14: { cat: 2, name: 'Thighs', unit: BIOMETRIC_UNITS.MM, unitLabel: 'cm', scale: 10, step: 0.5, isUnilateral: true, defaultVal: 56.0 },
  15: { cat: 2, name: 'Neck', unit: BIOMETRIC_UNITS.MM, unitLabel: 'cm', scale: 10, step: 0.5, defaultVal: 38.0 },
  16: { cat: 2, name: 'Calves', unit: BIOMETRIC_UNITS.MM, unitLabel: 'cm', scale: 10, step: 0.5, isUnilateral: true, defaultVal: 37.0 },
  17: { cat: 2, name: 'Forearms', unit: BIOMETRIC_UNITS.MM, unitLabel: 'cm', scale: 10, step: 0.5, isUnilateral: true, defaultVal: 29.0 },

  // Vitals & Cardiovascular (30-49)
  30: { cat: 3, name: 'Resting Heart Rate', unit: BIOMETRIC_UNITS.BPM, unitLabel: 'bpm', scale: 1, step: 1, defaultVal: 62 },
  31: { cat: 3, name: 'Heart Rate Variability (HRV)', unit: BIOMETRIC_UNITS.MS, unitLabel: 'ms', scale: 1, step: 1, defaultVal: 65 },
  32: { cat: 3, name: 'Blood Pressure (Systolic)', unit: BIOMETRIC_UNITS.MMHG, unitLabel: 'mmHg', scale: 1, step: 1, defaultVal: 120 },
  33: { cat: 3, name: 'Blood Pressure (Diastolic)', unit: BIOMETRIC_UNITS.MMHG, unitLabel: 'mmHg', scale: 1, step: 1, defaultVal: 80 },
  34: { cat: 3, name: 'Blood Oxygen (SpO2)', unit: BIOMETRIC_UNITS.PERCENT_CENTI, unitLabel: '%', scale: 100, step: 0.1, defaultVal: 98.5 },
  35: { cat: 3, name: 'Body Temperature', unit: BIOMETRIC_UNITS.CELSIUS_DECI, unitLabel: '°C', scale: 10, step: 0.1, defaultVal: 36.6 },

  // Metabolic & Labs (50-69)
  50: { cat: 4, name: 'Fasting Blood Glucose', unit: BIOMETRIC_UNITS.MG_DL, unitLabel: 'mg/dL', scale: 1, step: 1, defaultVal: 92 },
  51: { cat: 4, name: 'Blood Ketones', unit: BIOMETRIC_UNITS.MMOL_L_DECI, unitLabel: 'mmol/L', scale: 10, step: 0.1, defaultVal: 0.8 },

  // Performance (70-79)
  70: { cat: 5, name: 'VO2 Max', unit: BIOMETRIC_UNITS.ML_KG_MIN_DECI, unitLabel: 'mL/kg/min', scale: 10, step: 0.1, defaultVal: 48.5 }
}
