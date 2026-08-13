export interface Workout {
  id?: string
  user_id?: string
  workout_type: string
  active_calories: number
  total_calories: number
  duration_minutes: number
  date?: string
}

export interface Biometric {
  id?: string
  user_id?: string
  weight_kg: number
  chest_cm?: number
  waist_cm?: number
  hips_cm?: number
  biceps_cm?: number
  date?: string
}

export interface Meal {
  id?: string
  user_id?: string
  meal_name: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  date?: string
}

export interface WaterLog {
  id?: string
  user_id?: string
  amount_ml: number
  date?: string
}
