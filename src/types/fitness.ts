export interface Workout {
  id?: string
  user_id?: string
  workout_type: string
  active_cal: number
  total_cal?: number | null
  duration_sec: number
  avg_hr?: number | null
  effort?: number | null
  flags?: number
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
  cal: number
  prot_g: number
  carb_g: number
  fat_g: number
  flags?: number
  log_date?: string
  ts?: string
  serving_size?: number | null
  serving_unit?: string | null
  servings?: number | null
  micros?: Micronutrients
  // Legacy compatibility fields
  calories?: number
  protein_g?: number
  carbs_g?: number
}

export interface RecipeItem {
  id?: string
  recipe_id?: string
  item_name: string
  name?: string
  amount: number
  unit: string
  cal: number
  prot_g: number
  carb_g: number
  fat_g: number
}

export type RecipeIngredient = RecipeItem

export interface Micronutrients {
  sugar_g?: number
  added_sugar_g?: number
  sat_fat_g?: number
  trans_fat_g?: number
  mono_fat_g?: number
  poly_fat_g?: number
  omega_3_mg?: number
  omega_6_mg?: number
  caffeine_mg?: number
  sodium_mg?: number
  potassium_mg?: number
  cholesterol_mg?: number
  hdl_mg?: number
  ldl_mg?: number
  iron_mg?: number
  calcium_mg?: number
  magnesium_mg?: number
  zinc_mg?: number
  vit_a_mcg?: number
  vit_c_mg?: number
  vit_d_mcg?: number
  vit_b12_mcg?: number
}

export interface Recipe {
  id?: string
  user_id?: string
  name: string
  description?: string | null
  cal: number
  prot_g: number
  carb_g: number
  fat_g: number
  servings: number
  flags?: number
  is_public?: boolean
  items?: RecipeItem[]
  micros?: Micronutrients
  share_token?: string
  created_at?: string
  updated_at?: string
}

// Alias MealTemplate to Recipe for backwards compatibility
export type MealTemplate = Recipe

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
