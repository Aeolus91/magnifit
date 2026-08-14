export interface Workout {
  id?: string
  user_id?: string
  workout_type: string
  active_cal: number
  total_cal?: number | null
  duration_sec: number
  avg_hr?: number | null
  effort?: number | null
  log_date?: string
  ts?: string
}

export interface Biometric {
  id?: string
  user_id?: string
  cat: number
  type: number
  val: number
  val_sec?: number | null
  unit: number
  flags?: number
  log_date?: string
  ts?: string
}

export interface Meal {
  id?: string
  user_id?: string
  meal_name: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  log_date?: string
  ts?: string
}

export interface WaterLog {
  id?: string
  user_id?: string
  amount_ml: number
  log_date?: string
  ts?: string
}

export interface Profile {
  id: string
  username: string
  display_name?: string | null
  avatar_url?: string | null
  bio?: string | null
  prefs: number
  micros_opt: number
  tz?: string
  height_cm?: number | null
  target_weight_dg?: number | null
  target_cal?: number | null
  target_water_ml?: number | null
  sex?: number | string | null
  activity_level?: number | string | null
  birth_year?: number | null
  created_at?: string
  updated_at?: string
}
