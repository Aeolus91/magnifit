export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      archive_biometrics: {
        Row: {
          biceps_mm: number | null
          chest_mm: number | null
          hips_mm: number | null
          id: string
          ts: string
          user_id: string
          waist_mm: number | null
          weight_dg: number
        }
        Insert: {
          biceps_mm?: number | null
          chest_mm?: number | null
          hips_mm?: number | null
          id?: string
          ts?: string
          user_id?: string
          waist_mm?: number | null
          weight_dg: number
        }
        Update: {
          biceps_mm?: number | null
          chest_mm?: number | null
          hips_mm?: number | null
          id?: string
          ts?: string
          user_id?: string
          waist_mm?: number | null
          weight_dg?: number
        }
        Relationships: []
      }
      archive_meals: {
        Row: {
          cal: number
          carb_g: number | null
          fat_g: number | null
          fiber_g: number | null
          flags_bitmask: number
          id: string
          name: string
          prot_g: number | null
          ts: string
          user_id: string
        }
        Insert: {
          cal?: number
          carb_g?: number | null
          fat_g?: number | null
          fiber_g?: number | null
          flags_bitmask?: number
          id?: string
          name: string
          prot_g?: number | null
          ts?: string
          user_id?: string
        }
        Update: {
          cal?: number
          carb_g?: number | null
          fat_g?: number | null
          fiber_g?: number | null
          flags_bitmask?: number
          id?: string
          name?: string
          prot_g?: number | null
          ts?: string
          user_id?: string
        }
        Relationships: []
      }
      archive_water_logs: {
        Row: {
          amount_ml: number
          id: string
          ts: string
          user_id: string
        }
        Insert: {
          amount_ml: number
          id?: string
          ts?: string
          user_id?: string
        }
        Update: {
          amount_ml?: number
          id?: string
          ts?: string
          user_id?: string
        }
        Relationships: []
      }
      archive_workouts: {
        Row: {
          active_cal: number
          dur_min: number
          flags_bitmask: number
          id: string
          total_cal: number
          ts: string
          user_id: string
        }
        Insert: {
          active_cal?: number
          dur_min?: number
          flags_bitmask?: number
          id?: string
          total_cal?: number
          ts?: string
          user_id?: string
        }
        Update: {
          active_cal?: number
          dur_min?: number
          flags_bitmask?: number
          id?: string
          total_cal?: number
          ts?: string
          user_id?: string
        }
        Relationships: []
      }
      biometrics: {
        Row: {
          cat: number
          flags: number
          id: string
          log_date: string
          ts: string
          type: number
          unit: number
          user_id: string
          val: number
          val_sec: number | null
        }
        Insert: {
          cat?: number
          flags?: number
          id?: string
          log_date?: string
          ts?: string
          type?: number
          unit?: number
          user_id?: string
          val?: number
          val_sec?: number | null
        }
        Update: {
          cat?: number
          flags?: number
          id?: string
          log_date?: string
          ts?: string
          type?: number
          unit?: number
          user_id?: string
          val?: number
          val_sec?: number | null
        }
        Relationships: []
      }
      daily_summaries: {
        Row: {
          active_cal: number
          carb_g: number
          consumed_cal: number
          fat_g: number
          latest_weight_dg: number | null
          log_date: string
          prot_g: number
          total_cal: number
          user_id: string
          water_ml: number
        }
        Insert: {
          active_cal?: number
          carb_g?: number
          consumed_cal?: number
          fat_g?: number
          latest_weight_dg?: number | null
          log_date: string
          prot_g?: number
          total_cal?: number
          user_id: string
          water_ml?: number
        }
        Update: {
          active_cal?: number
          carb_g?: number
          consumed_cal?: number
          fat_g?: number
          latest_weight_dg?: number | null
          log_date?: string
          prot_g?: number
          total_cal?: number
          user_id?: string
          water_ml?: number
        }
        Relationships: []
      }
      meal_micros: {
        Row: {
          added_sugar_g: number | null
          caffeine_mg: number | null
          calcium_mg: number | null
          cholesterol_mg: number | null
          hdl_mg: number | null
          iron_mg: number | null
          ldl_mg: number | null
          magnesium_mg: number | null
          meal_id: string
          mono_fat_g: number | null
          omega_3_mg: number | null
          omega_6_mg: number | null
          poly_fat_g: number | null
          potassium_mg: number | null
          sat_fat_g: number | null
          sodium_mg: number | null
          sugar_g: number | null
          trans_fat_g: number | null
          user_id: string
          vit_a_mcg: number | null
          vit_b12_mcg: number | null
          vit_c_mg: number | null
          vit_d_mcg: number | null
          zinc_mg: number | null
        }
        Insert: {
          added_sugar_g?: number | null
          caffeine_mg?: number | null
          calcium_mg?: number | null
          cholesterol_mg?: number | null
          hdl_mg?: number | null
          iron_mg?: number | null
          ldl_mg?: number | null
          magnesium_mg?: number | null
          meal_id: string
          mono_fat_g?: number | null
          omega_3_mg?: number | null
          omega_6_mg?: number | null
          poly_fat_g?: number | null
          potassium_mg?: number | null
          sat_fat_g?: number | null
          sodium_mg?: number | null
          sugar_g?: number | null
          trans_fat_g?: number | null
          user_id?: string
          vit_a_mcg?: number | null
          vit_b12_mcg?: number | null
          vit_c_mg?: number | null
          vit_d_mcg?: number | null
          zinc_mg?: number | null
        }
        Update: {
          added_sugar_g?: number | null
          caffeine_mg?: number | null
          calcium_mg?: number | null
          cholesterol_mg?: number | null
          hdl_mg?: number | null
          iron_mg?: number | null
          ldl_mg?: number | null
          magnesium_mg?: number | null
          meal_id?: string
          mono_fat_g?: number | null
          omega_3_mg?: number | null
          omega_6_mg?: number | null
          poly_fat_g?: number | null
          potassium_mg?: number | null
          sat_fat_g?: number | null
          sodium_mg?: number | null
          sugar_g?: number | null
          trans_fat_g?: number | null
          user_id?: string
          vit_a_mcg?: number | null
          vit_b12_mcg?: number | null
          vit_c_mg?: number | null
          vit_d_mcg?: number | null
          zinc_mg?: number | null
        }
        Relationships: []
      }
      meal_templates: {
        Row: {
          cal: number
          carb_g: number
          created_at: string
          description: string | null
          fat_g: number
          flags: number
          id: string
          ingredients: Json | null
          name: string
          prot_g: number
          servings: number
          updated_at: string
          user_id: string
        }
        Insert: {
          cal: number
          carb_g: number
          created_at?: string
          description?: string | null
          fat_g: number
          flags?: number
          id?: string
          ingredients?: Json | null
          name: string
          prot_g: number
          servings?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          cal?: number
          carb_g?: number
          created_at?: string
          description?: string | null
          fat_g?: number
          flags?: number
          id?: string
          ingredients?: Json | null
          name?: string
          prot_g?: number
          servings?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      meals: {
        Row: {
          cal: number
          carb_g: number
          fat_g: number
          flags: number
          id: string
          log_date: string
          meal_name: string
          prot_g: number
          ts: string
          user_id: string
        }
        Insert: {
          cal: number
          carb_g: number
          fat_g: number
          flags?: number
          id?: string
          log_date?: string
          meal_name: string
          prot_g: number
          ts?: string
          user_id?: string
        }
        Update: {
          cal?: number
          carb_g?: number
          fat_g?: number
          flags?: number
          id?: string
          log_date?: string
          meal_name?: string
          prot_g?: number
          ts?: string
          user_id?: string
        }
        Relationships: []
      }
      micronutrients: {
        Row: {
          added_sugar_g: number | null
          caffeine_mg: number | null
          calcium_mg: number | null
          cholesterol_mg: number | null
          hdl_mg: number | null
          iron_mg: number | null
          ldl_mg: number | null
          magnesium_mg: number | null
          meal_id: string
          mono_fat_g: number | null
          omega_3_mg: number | null
          omega_6_mg: number | null
          poly_fat_g: number | null
          potassium_mg: number | null
          sat_fat_g: number | null
          sodium_mg: number | null
          sugar_g: number | null
          trans_fat_g: number | null
          vit_a_mcg: number | null
          vit_b12_mcg: number | null
          vit_c_mg: number | null
          vit_d_mcg: number | null
          zinc_mg: number | null
        }
        Insert: {
          added_sugar_g?: number | null
          caffeine_mg?: number | null
          calcium_mg?: number | null
          cholesterol_mg?: number | null
          hdl_mg?: number | null
          iron_mg?: number | null
          ldl_mg?: number | null
          magnesium_mg?: number | null
          meal_id: string
          mono_fat_g?: number | null
          omega_3_mg?: number | null
          omega_6_mg?: number | null
          poly_fat_g?: number | null
          potassium_mg?: number | null
          sat_fat_g?: number | null
          sodium_mg?: number | null
          sugar_g?: number | null
          trans_fat_g?: number | null
          vit_a_mcg?: number | null
          vit_b12_mcg?: number | null
          vit_c_mg?: number | null
          vit_d_mcg?: number | null
          zinc_mg?: number | null
        }
        Update: {
          added_sugar_g?: number | null
          caffeine_mg?: number | null
          calcium_mg?: number | null
          cholesterol_mg?: number | null
          hdl_mg?: number | null
          iron_mg?: number | null
          ldl_mg?: number | null
          magnesium_mg?: number | null
          meal_id?: string
          mono_fat_g?: number | null
          omega_3_mg?: number | null
          omega_6_mg?: number | null
          poly_fat_g?: number | null
          potassium_mg?: number | null
          sat_fat_g?: number | null
          sodium_mg?: number | null
          sugar_g?: number | null
          trans_fat_g?: number | null
          vit_a_mcg?: number | null
          vit_b12_mcg?: number | null
          vit_c_mg?: number | null
          vit_d_mcg?: number | null
          zinc_mg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "micronutrients_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: true
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "micronutrients_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: true
            referencedRelation: "v_my_meals"
            referencedColumns: ["id"]
          },
        ]
      }
      nonces: {
        Row: {
          consumed_at: string | null
          created_at: string
          id: string
          nonce: string
          status: string
          user_id: string
        }
        Insert: {
          consumed_at?: string | null
          created_at?: string
          id?: string
          nonce?: string
          status?: string
          user_id: string
        }
        Update: {
          consumed_at?: string | null
          created_at?: string
          id?: string
          nonce?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activity_level: number | null
          avatar_url: string | null
          bio: string | null
          birth_year: number | null
          created_at: string
          display_name: string | null
          height_cm: number | null
          id: string
          micros_opt: number
          prefs: number
          sex: number | null
          target_cal: number
          target_water_ml: number
          target_weight_dg: number | null
          tz: string
          updated_at: string
          username: string
        }
        Insert: {
          activity_level?: number | null
          avatar_url?: string | null
          bio?: string | null
          birth_year?: number | null
          created_at?: string
          display_name?: string | null
          height_cm?: number | null
          id: string
          micros_opt?: number
          prefs?: number
          sex?: number | null
          target_cal?: number
          target_water_ml?: number
          target_weight_dg?: number | null
          tz?: string
          updated_at?: string
          username: string
        }
        Update: {
          activity_level?: number | null
          avatar_url?: string | null
          bio?: string | null
          birth_year?: number | null
          created_at?: string
          display_name?: string | null
          height_cm?: number | null
          id?: string
          micros_opt?: number
          prefs?: number
          sex?: number | null
          target_cal?: number
          target_water_ml?: number
          target_weight_dg?: number | null
          tz?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      recipe_items: {
        Row: {
          amount: number
          cal: number
          carb_g: number
          fat_g: number
          id: string
          item_name: string
          prot_g: number
          recipe_id: string
          unit: string
        }
        Insert: {
          amount: number
          cal?: number
          carb_g?: number
          fat_g?: number
          id?: string
          item_name: string
          prot_g?: number
          recipe_id: string
          unit: string
        }
        Update: {
          amount?: number
          cal?: number
          carb_g?: number
          fat_g?: number
          id?: string
          item_name?: string
          prot_g?: number
          recipe_id?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_micronutrients: {
        Row: {
          added_sugar_g: number | null
          caffeine_mg: number | null
          calcium_mg: number | null
          cholesterol_mg: number | null
          hdl_mg: number | null
          iron_mg: number | null
          ldl_mg: number | null
          magnesium_mg: number | null
          mono_fat_g: number | null
          omega_3_mg: number | null
          omega_6_mg: number | null
          poly_fat_g: number | null
          potassium_mg: number | null
          recipe_id: string
          sat_fat_g: number | null
          sodium_mg: number | null
          sugar_g: number | null
          trans_fat_g: number | null
          vit_a_mcg: number | null
          vit_b12_mcg: number | null
          vit_c_mg: number | null
          vit_d_mcg: number | null
          zinc_mg: number | null
        }
        Insert: {
          added_sugar_g?: number | null
          caffeine_mg?: number | null
          calcium_mg?: number | null
          cholesterol_mg?: number | null
          hdl_mg?: number | null
          iron_mg?: number | null
          ldl_mg?: number | null
          magnesium_mg?: number | null
          mono_fat_g?: number | null
          omega_3_mg?: number | null
          omega_6_mg?: number | null
          poly_fat_g?: number | null
          potassium_mg?: number | null
          recipe_id: string
          sat_fat_g?: number | null
          sodium_mg?: number | null
          sugar_g?: number | null
          trans_fat_g?: number | null
          vit_a_mcg?: number | null
          vit_b12_mcg?: number | null
          vit_c_mg?: number | null
          vit_d_mcg?: number | null
          zinc_mg?: number | null
        }
        Update: {
          added_sugar_g?: number | null
          caffeine_mg?: number | null
          calcium_mg?: number | null
          cholesterol_mg?: number | null
          hdl_mg?: number | null
          iron_mg?: number | null
          ldl_mg?: number | null
          magnesium_mg?: number | null
          mono_fat_g?: number | null
          omega_3_mg?: number | null
          omega_6_mg?: number | null
          poly_fat_g?: number | null
          potassium_mg?: number | null
          recipe_id?: string
          sat_fat_g?: number | null
          sodium_mg?: number | null
          sugar_g?: number | null
          trans_fat_g?: number | null
          vit_a_mcg?: number | null
          vit_b12_mcg?: number | null
          vit_c_mg?: number | null
          vit_d_mcg?: number | null
          zinc_mg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_micronutrients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: true
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_shares: {
        Row: {
          created_at: string
          id: string
          recipe_id: string
          recipient_id: string
          sender_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          recipe_id: string
          recipient_id: string
          sender_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          recipe_id?: string
          recipient_id?: string
          sender_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      recipes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          name: string
          servings: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name: string
          servings?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name?: string
          servings?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shared_recipes: {
        Row: {
          created_at: string
          id: string
          recipe_id: string
          share_token: string
          shared_by: string
        }
        Insert: {
          created_at?: string
          id?: string
          recipe_id: string
          share_token?: string
          shared_by: string
        }
        Update: {
          created_at?: string
          id?: string
          recipe_id?: string
          share_token?: string
          shared_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_recipes_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_tokens: {
        Row: {
          client_id: string
          last_seq: number
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          last_seq?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          last_seq?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      water_logs: {
        Row: {
          amount_ml: number
          id: string
          log_date: string
          ts: string
          user_id: string
        }
        Insert: {
          amount_ml: number
          id?: string
          log_date?: string
          ts?: string
          user_id?: string
        }
        Update: {
          amount_ml?: number
          id?: string
          log_date?: string
          ts?: string
          user_id?: string
        }
        Relationships: []
      }
      workouts: {
        Row: {
          active_cal: number
          avg_hr: number | null
          duration_sec: number
          effort: number | null
          id: string
          log_date: string
          total_cal: number
          ts: string
          user_id: string
          workout_type: string
        }
        Insert: {
          active_cal: number
          avg_hr?: number | null
          duration_sec: number
          effort?: number | null
          id?: string
          log_date?: string
          total_cal: number
          ts?: string
          user_id?: string
          workout_type: string
        }
        Update: {
          active_cal?: number
          avg_hr?: number | null
          duration_sec?: number
          effort?: number | null
          id?: string
          log_date?: string
          total_cal?: number
          ts?: string
          user_id?: string
          workout_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_my_biometrics: {
        Row: {
          cat: number | null
          flags: number | null
          id: string | null
          log_date: string | null
          ts: string | null
          type: number | null
          unit: number | null
          val: number | null
          val_sec: number | null
        }
        Insert: {
          cat?: number | null
          flags?: number | null
          id?: string | null
          log_date?: string | null
          ts?: string | null
          type?: number | null
          unit?: number | null
          val?: number | null
          val_sec?: number | null
        }
        Update: {
          cat?: number | null
          flags?: number | null
          id?: string | null
          log_date?: string | null
          ts?: string | null
          type?: number | null
          unit?: number | null
          val?: number | null
          val_sec?: number | null
        }
        Relationships: []
      }
      v_my_daily_summary: {
        Row: {
          active_cal: number | null
          carb_g: number | null
          consumed_cal: number | null
          fat_g: number | null
          latest_weight_dg: number | null
          log_date: string | null
          prot_g: number | null
          total_cal: number | null
          water_ml: number | null
        }
        Insert: {
          active_cal?: number | null
          carb_g?: number | null
          consumed_cal?: number | null
          fat_g?: number | null
          latest_weight_dg?: number | null
          log_date?: string | null
          prot_g?: number | null
          total_cal?: number | null
          water_ml?: number | null
        }
        Update: {
          active_cal?: number | null
          carb_g?: number | null
          consumed_cal?: number | null
          fat_g?: number | null
          latest_weight_dg?: number | null
          log_date?: string | null
          prot_g?: number | null
          total_cal?: number | null
          water_ml?: number | null
        }
        Relationships: []
      }
      v_my_meal_micros: {
        Row: {
          added_sugar_g: number | null
          caffeine_mg: number | null
          calcium_mg: number | null
          cholesterol_mg: number | null
          hdl_mg: number | null
          iron_mg: number | null
          ldl_mg: number | null
          magnesium_mg: number | null
          meal_id: string | null
          mono_fat_g: number | null
          omega_3_mg: number | null
          omega_6_mg: number | null
          poly_fat_g: number | null
          potassium_mg: number | null
          sat_fat_g: number | null
          sodium_mg: number | null
          sugar_g: number | null
          trans_fat_g: number | null
          vit_a_mcg: number | null
          vit_b12_mcg: number | null
          vit_c_mg: number | null
          vit_d_mcg: number | null
          zinc_mg: number | null
        }
        Insert: {
          added_sugar_g?: number | null
          caffeine_mg?: number | null
          calcium_mg?: number | null
          cholesterol_mg?: number | null
          hdl_mg?: number | null
          iron_mg?: number | null
          ldl_mg?: number | null
          magnesium_mg?: number | null
          meal_id?: string | null
          mono_fat_g?: number | null
          omega_3_mg?: number | null
          omega_6_mg?: number | null
          poly_fat_g?: number | null
          potassium_mg?: number | null
          sat_fat_g?: number | null
          sodium_mg?: number | null
          sugar_g?: number | null
          trans_fat_g?: number | null
          vit_a_mcg?: number | null
          vit_b12_mcg?: number | null
          vit_c_mg?: number | null
          vit_d_mcg?: number | null
          zinc_mg?: number | null
        }
        Update: {
          added_sugar_g?: number | null
          caffeine_mg?: number | null
          calcium_mg?: number | null
          cholesterol_mg?: number | null
          hdl_mg?: number | null
          iron_mg?: number | null
          ldl_mg?: number | null
          magnesium_mg?: number | null
          meal_id?: string | null
          mono_fat_g?: number | null
          omega_3_mg?: number | null
          omega_6_mg?: number | null
          poly_fat_g?: number | null
          potassium_mg?: number | null
          sat_fat_g?: number | null
          sodium_mg?: number | null
          sugar_g?: number | null
          trans_fat_g?: number | null
          vit_a_mcg?: number | null
          vit_b12_mcg?: number | null
          vit_c_mg?: number | null
          vit_d_mcg?: number | null
          zinc_mg?: number | null
        }
        Relationships: []
      }
      v_my_meals: {
        Row: {
          cal: number | null
          carb_g: number | null
          fat_g: number | null
          flags: number | null
          id: string | null
          log_date: string | null
          meal_name: string | null
          prot_g: number | null
          ts: string | null
        }
        Insert: {
          cal?: number | null
          carb_g?: number | null
          fat_g?: number | null
          flags?: number | null
          id?: string | null
          log_date?: string | null
          meal_name?: string | null
          prot_g?: number | null
          ts?: string | null
        }
        Update: {
          cal?: number | null
          carb_g?: number | null
          fat_g?: number | null
          flags?: number | null
          id?: string | null
          log_date?: string | null
          meal_name?: string | null
          prot_g?: number | null
          ts?: string | null
        }
        Relationships: []
      }
      v_my_water_logs: {
        Row: {
          amount_ml: number | null
          id: string | null
          log_date: string | null
          ts: string | null
        }
        Insert: {
          amount_ml?: number | null
          id?: string | null
          log_date?: string | null
          ts?: string | null
        }
        Update: {
          amount_ml?: number | null
          id?: string | null
          log_date?: string | null
          ts?: string | null
        }
        Relationships: []
      }
      v_my_workouts: {
        Row: {
          active_cal: number | null
          avg_hr: number | null
          duration_sec: number | null
          effort: number | null
          id: string | null
          log_date: string | null
          total_cal: number | null
          ts: string | null
          workout_type: string | null
        }
        Insert: {
          active_cal?: number | null
          avg_hr?: number | null
          duration_sec?: number | null
          effort?: number | null
          id?: string | null
          log_date?: string | null
          total_cal?: number | null
          ts?: string | null
          workout_type?: string | null
        }
        Update: {
          active_cal?: number | null
          avg_hr?: number | null
          duration_sec?: number | null
          effort?: number | null
          id?: string | null
          log_date?: string | null
          total_cal?: number | null
          ts?: string | null
          workout_type?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      archive_old_logs: { Args: never; Returns: undefined }
      delete_user_account: { Args: never; Returns: undefined }
      gen_uuid_v7: { Args: never; Returns: string }
      generate_nonce: { Args: never; Returns: string }
      purge_expired_nonces: { Args: never; Returns: undefined }
      respond_to_recipe_share: {
        Args: { p_accept: boolean; p_share_id: string }
        Returns: undefined
      }
      share_recipe_with_username: {
        Args: { p_recipe_id: string; p_username: string }
        Returns: string
      }
      verify_and_consume_nonce: { Args: { p_nonce: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
