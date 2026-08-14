import { ref, computed, type Ref } from 'vue'
import { supabase } from '../lib/supabaseClient'
import { uuidv7 } from '../lib/uuidv7'
import { getLocalISODate } from '../lib/dateUtils'
import type { Biometric, Profile } from '../types/fitness'

export function useBiometrics(
  userId: Ref<string | undefined>,
  userProfile: Ref<Profile | null>,
  selectedDate: Ref<string>,
  loggedDates: Ref<string[]>
) {
  const biometrics = ref<Biometric[]>([])
  const loading = ref(false)

  // Latest most current weight (type: 1)
  const latestWeight = computed(() => {
    const latestWeightRecord = biometrics.value.find(b => b.type === 1)
    if (!latestWeightRecord) return 0
    return Number((latestWeightRecord.val / 10).toFixed(1))
  })

  // Dynamic BMI computed from latest weight and profile height
  const latestBmi = computed(() => {
    if (!latestWeight.value || !userProfile.value?.height_cm || userProfile.value.height_cm <= 0) {
      return null
    }
    const heightM = userProfile.value.height_cm / 100
    const bmiVal = latestWeight.value / (heightM * heightM)
    return Number(bmiVal.toFixed(1))
  })

  const fetchBiometrics = async (uid?: string) => {
    const targetUid = uid || userId.value
    if (!targetUid) return
    loading.value = true
    const { data } = await supabase
      .from<Biometric>('biometrics')
      .select()
      .eq('user_id', targetUid)
      .order('log_date', { ascending: false })
      .order('ts', { ascending: false })
      .get()

    if (data) {
      biometrics.value = data
      data.forEach(b => {
        const d = b.log_date || getLocalISODate(b.ts)
        if (d && !loggedDates.value.includes(d)) {
          loggedDates.value.push(d)
        }
      })
    }
    loading.value = false
  }

  const addBiometric = async (bioData: Biometric) => {
    if (!userId.value) return
    const id = uuidv7()
    const payload: Biometric = {
      ...bioData,
      id,
      user_id: userId.value,
      log_date: selectedDate.value
    }
    const { data, error } = await supabase.from<Biometric>('biometrics').insert([payload])
    if (!error && data) {
      biometrics.value.unshift(data[0] || payload)
      if (!loggedDates.value.includes(selectedDate.value)) {
        loggedDates.value.push(selectedDate.value)
      }
    }
  }

  const editBiometric = async (bioData: Biometric) => {
    if (!userId.value || !bioData.id) return
    const updatePayload: Partial<Biometric> = {
      cat: bioData.cat,
      type: bioData.type,
      val: bioData.val,
      unit: bioData.unit,
      flags: bioData.flags
    }
    if (bioData.val_sec !== undefined) {
      updatePayload.val_sec = bioData.val_sec
    }
    const { error } = await supabase
      .from('biometrics')
      .update(updatePayload)
      .eq('id', bioData.id)

    if (!error) {
      const idx = biometrics.value.findIndex(b => b.id === bioData.id)
      if (idx !== -1) {
        biometrics.value[idx] = {
          ...biometrics.value[idx],
          ...updatePayload
        }
      }
    }
  }

  const deleteBiometric = async (id: string) => {
    if (!userId.value || !id) return
    const { error } = await supabase.from('biometrics').delete().eq('id', id)
    if (!error) {
      const idx = biometrics.value.findIndex(b => b.id === id)
      if (idx !== -1) {
        biometrics.value.splice(idx, 1)
      }
    }
  }

  return {
    biometrics,
    latestWeight,
    latestBmi,
    loading,
    fetchBiometrics,
    addBiometric,
    editBiometric,
    deleteBiometric
  }
}
