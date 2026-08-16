<script setup lang="ts">
import { computed } from 'vue'
import Modal from '../../../modals/Modal.vue'
import FormInput from '../../../atoms/FormInput.vue'
import { Plus } from '@lucide/vue'
import type { FoodSearchResult } from '../FoodSearchLookup.vue'

const props = defineProps<{
  food: FoodSearchResult | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', details: { totalGrams: number; scaledCal: number; scaledProt: number; scaledCarb: number; scaledFat: number; scaledMicros: Record<string, number> }): void
}>()

const servingUnitGrams = defineModel<number>('servingUnitGrams', { default: 100 })
const servingCount = defineModel<number>('servingCount', { default: 1 })

const totalGrams = computed(() => {
  return (servingUnitGrams.value || 100) * (servingCount.value || 1)
})

const ratio = computed(() => totalGrams.value / 100)

const scaledCal = computed(() => Math.round((props.food?.cal_100g || 0) * ratio.value))
const scaledProt = computed(() => Math.round((props.food?.prot_100g || 0) * ratio.value * 10) / 10)
const scaledCarb = computed(() => Math.round((props.food?.carb_100g || 0) * ratio.value * 10) / 10)
const scaledFat = computed(() => Math.round((props.food?.fat_100g || 0) * ratio.value * 10) / 10)

const scaledMicros = computed(() => {
  const map: Record<string, number> = {}
  if (props.food?.micros) {
    Object.entries(props.food.micros).forEach(([k, v]) => {
      map[k] = Math.round(v * ratio.value * 10) / 10
    })
  }
  return map
})

const handleConfirm = () => {
  emit('confirm', {
    totalGrams: totalGrams.value,
    scaledCal: scaledCal.value,
    scaledProt: scaledProt.value,
    scaledCarb: scaledCarb.value,
    scaledFat: scaledFat.value,
    scaledMicros: scaledMicros.value
  })
}
</script>

<template>
  <Modal v-if="food" :title="food.brand ? `${food.brand} - ${food.name}` : food.name" max-width-class="max-w-md"
    @close="emit('close')">
    <div class="space-y-4 pt-1">
      <div class="grid grid-cols-2 gap-3">
        <FormInput v-model.number="servingUnitGrams" type="number" label="Serving Size (g)" suffix="g" :min="1"
          required />
        <FormInput v-model.number="servingCount" type="number" label="Number of Servings" suffix="servings" :min="0.1"
          step="0.25" required />
      </div>

      <!-- Live Nutrition Summary Preview Card -->
      <div class="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
        <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Calculated for {{ totalGrams }}g
        </div>
        <div class="grid grid-cols-4 gap-2 text-center">
          <div class="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
            <div class="text-[10px] text-slate-500 font-semibold uppercase">Calories</div>
            <div class="text-sm font-bold text-emerald-400 mt-0.5">{{ scaledCal }}</div>
          </div>
          <div class="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
            <div class="text-[10px] text-slate-500 font-semibold uppercase">Protein</div>
            <div class="text-sm font-bold text-cyan-400 mt-0.5">{{ scaledProt }}g</div>
          </div>
          <div class="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
            <div class="text-[10px] text-slate-500 font-semibold uppercase">Carbs</div>
            <div class="text-sm font-bold text-amber-400 mt-0.5">{{ scaledCarb }}g</div>
          </div>
          <div class="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
            <div class="text-[10px] text-slate-500 font-semibold uppercase">Fat</div>
            <div class="text-sm font-bold text-rose-400 mt-0.5">{{ scaledFat }}g</div>
          </div>
        </div>
      </div>

      <!-- Confirmation Actions -->
      <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
        <button type="button" @click="emit('close')"
          class="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer">
          Cancel
        </button>
        <button type="button" @click="handleConfirm"
          class="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1.5 transition active:scale-[0.98] cursor-pointer shadow-lg shadow-emerald-950/50">
          <Plus class="w-4 h-4 stroke-3" />
          <span>Add to Meal</span>
        </button>
      </div>
    </div>
  </Modal>
</template>
