<script setup lang="ts">
import { computed } from 'vue'
import Modal from '../../../components/atoms/Modal.vue'
import { Utensils, Info, Plus } from '@lucide/vue'
import { useI18n } from '../../../lib/i18n'
import FormInput from '../../atoms/FormInput.vue'
import type { QuickPickItem } from '../../../composables/useFoodSearchLookup'

const props = defineProps<{
  item: QuickPickItem | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'inspect', item: QuickPickItem): void
  (e: 'confirm'): void
}>()

const { t } = useI18n()

const servings = defineModel<number>('servings', { default: 1 })

const scaledCal = computed(() => Math.round((props.item?.cal || 0) * (servings.value || 1)))
const scaledProt = computed(() => Math.round((props.item?.prot_g || 0) * (servings.value || 1) * 10) / 10)
const scaledCarb = computed(() => Math.round((props.item?.carb_g || 0) * (servings.value || 1) * 10) / 10)
const scaledFat = computed(() => Math.round((props.item?.fat_g || 0) * (servings.value || 1) * 10) / 10)
</script>

<template>
  <Modal v-if="item"
    :title="item.type === 'recipe' ? t('meals.quick_picks.add_recipe') : t('meals.quick_picks.add_recent')"
    :icon="Utensils" icon-color="text-amber-400" max-width-class="max-w-md"
    :confirm-text="t('meals.quick_picks.confirm_btn')" confirm-variant="amber" :confirm-icon="Plus"
    @close="emit('close')" @confirm="emit('confirm')">
    <div class="space-y-4">
      <!-- Item Info -->
      <div class="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start justify-between gap-3">
        <div>
          <div class="text-sm font-bold text-slate-100">{{ item.name }}</div>
          <div class="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
            <span>{{ t('meals.quick_picks.base', { cal: item.cal }) }}</span>
            <span class="text-slate-600">•</span>
            <span class="text-emerald-400">P: {{ item.prot_g }}g</span>
            <span class="text-yellow-400">C: {{ item.carb_g }}g</span>
            <span class="text-rose-400">F: {{ item.fat_g }}g</span>
          </div>
        </div>
        <button type="button" @click="emit('inspect', item)"
          class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-300 transition cursor-pointer shrink-0"
          :title="t('meals.quick_picks.inspect_tooltip')">
          <Info class="w-4 h-4" />
        </button>
      </div>

      <!-- Servings Input & Stepper -->
      <div class="space-y-1.5">
        <label class="text-xs font-semibold text-slate-300">{{ t('meals.quick_picks.servings_label') }}</label>
        <div class="flex items-center gap-2">
          <button type="button" @click="servings = Math.max(0.25, Math.round(((servings || 1) - 0.25) * 100) / 100)"
            class="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 active:scale-95 text-slate-200 font-bold flex items-center justify-center transition cursor-pointer text-xs shrink-0">
            -¼
          </button>
          <FormInput v-model="servings" type="number" step="0.25" min="0.1" max="50"
            input-class="focus:border-amber-500 text-center text-sm font-mono py-2"
            class="flex-1" />
          <button type="button" @click="servings = Math.round(((servings || 1) + 0.25) * 100) / 100"
            class="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 active:scale-95 text-slate-200 font-bold flex items-center justify-center transition cursor-pointer text-xs shrink-0">
            +¼
          </button>
        </div>
      </div>

      <!-- Scaled Totals Live Preview -->
      <div class="grid grid-cols-4 gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-center">
        <div>
          <div class="text-[10px] text-slate-500 font-medium uppercase">Calories</div>
          <div class="text-sm font-bold text-amber-400">{{ scaledCal }}</div>
        </div>
        <div>
          <div class="text-[10px] text-slate-500 font-medium uppercase">Protein</div>
          <div class="text-sm font-bold text-emerald-400">{{ scaledProt }}g</div>
        </div>
        <div>
          <div class="text-[10px] text-slate-500 font-medium uppercase">Carbs</div>
          <div class="text-sm font-bold text-yellow-400">{{ scaledCarb }}g</div>
        </div>
        <div>
          <div class="text-[10px] text-slate-500 font-medium uppercase">Fat</div>
          <div class="text-sm font-bold text-rose-400">{{ scaledFat }}g</div>
        </div>
      </div>
    </div>
  </Modal>
</template>
