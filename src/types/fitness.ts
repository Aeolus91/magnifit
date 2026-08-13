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
  weight_dg?: number
  weight_kg?: number
  chest_mm?: number
  chest_cm?: number
  waist_mm?: number
  waist_cm?: number
  hips_mm?: number
  hips_cm?: number
  biceps_mm?: number
  biceps_cm?: number
  ts?: string
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

export interface Profile {
  id: string
  username: string
  prefs: number
  micros_opt: number
  height_cm?: number | null
  target_weight_dg?: number | null
  sex?: 'male' | 'female' | 'other' | 'unspecified'
  activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
  birth_year?: number | null
  updated_at?: string
}
