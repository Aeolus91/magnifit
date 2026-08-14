import { computed, type Ref } from 'vue'
import type { Profile, Biometric } from '../types/fitness'

export function useEnergyExpenditure(
  userProfile: Ref<Profile | null>,
  biometrics: Ref<Biometric[]>
) {
  // 1. Extract latest body weight (type: 1 -> decigrams to kg)
  const latestWeightKg = computed<number | null>(() => {
    const record = biometrics.value.find(b => b.type === 1)
    if (record && record.val > 0) {
      return record.val / 10
    }
    return null
  })

  // 2. Extract latest body fat percentage (type: 2 -> centi-percent to %)
  const latestBodyFatPercent = computed<number | null>(() => {
    const record = biometrics.value.find(b => b.type === 2)
    if (record && record.val > 0) {
      return record.val / 100
    }
    return null
  })

  const hasBodyFat = computed<boolean>(() => latestBodyFatPercent.value !== null && latestBodyFatPercent.value > 0)

  // 3. User Demographics
  const heightCm = computed<number>(() => userProfile.value?.height_cm || 175)
  const birthYear = computed<number>(() => userProfile.value?.birth_year || 1995)
  const age = computed<number>(() => {
    const currentYear = new Date().getFullYear()
    return Math.max(15, currentYear - birthYear.value)
  })

  // Sex: 1 = Male (+5), 0 = Female (-161), 2/null = Average (-78)
  const sexOffset = computed<number>(() => {
    const s = userProfile.value?.sex
    if (s === 1 || s === 'male') return 5
    if (s === 0 || s === 'female') return -161
    return -78
  })

  // Activity Level multiplier: 1=Sedentary (1.2), 2=Light (1.375), 3=Moderate (1.55), 4=Active (1.725), 5=Very Active (1.9)
  const activityMultiplier = computed<number>(() => {
    const lvl = Number(userProfile.value?.activity_level)
    switch (lvl) {
      case 1: return 1.2
      case 2: return 1.375
      case 3: return 1.55
      case 4: return 1.725
      case 5: return 1.9
      default: return 1.375
    }
  })

  // Formula determination: Katch-McArdle if body fat is available, otherwise Mifflin-St Jeor
  const formulaUsed = computed<'Katch-McArdle' | 'Mifflin-St Jeor'>(() => {
    return hasBodyFat.value ? 'Katch-McArdle' : 'Mifflin-St Jeor'
  })

  // 4. Basal Metabolic Rate (BMR) calculation
  const bmr = computed<number>(() => {
    const weight = latestWeightKg.value || 70

    if (hasBodyFat.value && latestBodyFatPercent.value !== null) {
      // Katch-McArdle: BMR = 370 + 21.6 * (Weight * (1 - BF/100))
      const leanBodyMassKg = weight * (1 - (latestBodyFatPercent.value / 100))
      return Math.round(370 + (21.6 * leanBodyMassKg))
    }

    // Mifflin-St Jeor: BMR = (10 * Weight) + (6.25 * Height) - (5 * Age) + SexOffset
    const calculated = (10 * weight) + (6.25 * heightCm.value) - (5 * age.value) + sexOffset.value
    return Math.round(Math.max(800, calculated))
  })

  // 5. Total Daily Energy Expenditure (Maintenance TDEE)
  const tdee = computed<number>(() => {
    return Math.round(bmr.value * activityMultiplier.value)
  })

  // 6. Recommended Target Calories based on user target_weight_dg vs current weight
  const recommendedCalories = computed<number>(() => {
    const currentWeight = latestWeightKg.value
    const targetWeight = userProfile.value?.target_weight_dg ? userProfile.value.target_weight_dg / 10 : null

    if (!currentWeight || !targetWeight) {
      return tdee.value
    }

    const diff = targetWeight - currentWeight

    if (diff <= -1.5) {
      // Weight loss deficit (~500 kcal deficit, bounded min 1200)
      return Math.max(1200, tdee.value - 500)
    } else if (diff >= 1.5) {
      // Weight gain surplus (~300 kcal surplus)
      return tdee.value + 300
    }

    // Maintenance
    return tdee.value
  })

  return {
    latestWeightKg,
    latestBodyFatPercent,
    hasBodyFat,
    formulaUsed,
    bmr,
    tdee,
    recommendedCalories
  }
}
