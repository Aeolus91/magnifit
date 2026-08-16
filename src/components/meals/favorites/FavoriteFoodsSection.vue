<script setup lang="ts">
import { ref, computed } from 'vue'
import { Star, Search, Plus, Info, Loader2, Utensils, X } from '@lucide/vue'
import Modal from '../../atoms/Modal.vue'
import NutritionBreakdownModal from '../../modals/food/NutritionBreakdownModal.vue'
import { MealFlags } from '../../../lib/bitmask'
import type { UserFavoriteTemplate, Micronutrients } from '../../../types/fitness'

interface Props {
  favorites: UserFavoriteTemplate[]
  isLoading?: boolean
  microsOpt?: number
}

const props = withDefaults(defineProps<Props>(), {
  favorites: () => [],
  isLoading: false,
  microsOpt: 0
})

const emit = defineEmits<{
  (e: 'log-favorite', item: {
    template_id: string
    name: string
    cal: number
    prot_g: number
    carb_g: number
    fat_g: number
    serving_size?: number | null
    serving_unit?: string | null
    servings: number
    slotBit: number
    micros?: Micronutrients
  }): void
  (e: 'toggle-favorite', templateId: string): void
}>()

const searchQuery = ref('')
const inspectedTemplate = ref<{
  name: string
  cal_100g: number
  prot_100g: number
  carb_100g: number
  fat_100g: number
  serving_size_g?: number
  serving_label?: string
  micros?: Record<string, number>
} | null>(null)

// Log Modal State
const loggingFavorite = ref<UserFavoriteTemplate | null>(null)
const logServings = ref<number>(1)
const logSlotBit = ref<number>(MealFlags.BREAKFAST)

const filteredFavorites = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return props.favorites
  return props.favorites.filter(f => {
    const t = f.template
    if (!t) return false
    const nameMatch = (t.name || '').toLowerCase().includes(query)
    const brandMatch = (t.brand || '').toLowerCase().includes(query)
    return nameMatch || brandMatch
  })
})

const openLogModal = (fav: UserFavoriteTemplate) => {
  loggingFavorite.value = fav
  logServings.value = 1
}

const confirmLogFavorite = () => {
  if (!loggingFavorite.value || !loggingFavorite.value.template) return
  const fav = loggingFavorite.value
  const t = fav.template!
  const servings = Math.max(0.1, Number(logServings.value) || 1)
  const resolvedMicros = fav.custom_micros || t.micros

  const scaledCal = Math.round(t.cal * servings)
  const scaledProt = Math.round(t.prot_g * servings * 10) / 10
  const scaledCarb = Math.round(t.carb_g * servings * 10) / 10
  const scaledFat = Math.round(t.fat_g * servings * 10) / 10

  const scaledMicros: Record<string, number> = {}
  if (resolvedMicros) {
    Object.entries(resolvedMicros).forEach(([k, v]) => {
      if (typeof v === 'number' && !isNaN(v)) {
        scaledMicros[k] = Math.round(v * servings * 10) / 10
      }
    })
  }

  let formattedName = t.name
  if (t.brand) {
    formattedName = `${t.brand} ${formattedName}`
  }
  if (servings !== 1 && !formattedName.includes('x')) {
    formattedName = `${formattedName} (${servings}x)`
  }

  emit('log-favorite', {
    template_id: t.id,
    name: formattedName,
    cal: scaledCal,
    prot_g: scaledProt,
    carb_g: scaledCarb,
    fat_g: scaledFat,
    serving_size: t.serving_size,
    serving_unit: t.serving_unit || 'g',
    servings,
    slotBit: logSlotBit.value,
    micros: Object.keys(scaledMicros).length > 0 ? scaledMicros : undefined
  })

  loggingFavorite.value = null
}
</script>

<template>
  <div class="space-y-4">
    <!-- Header & Search Filter Bar -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <div class="relative flex-1">
        <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input type="text" v-model="searchQuery" placeholder="Filter favorite foods..."
          class="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pl-10 pr-9 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition" />
        <button v-if="searchQuery" type="button" @click="searchQuery = ''"
          class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300 transition cursor-pointer">
          <X class="w-3.5 h-3.5" />
        </button>
      </div>

      <div class="flex items-center gap-2 text-xs font-mono text-slate-400 shrink-0 self-end sm:self-auto">
        <span class="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
          {{ filteredFavorites.length }} {{ filteredFavorites.length === 1 ? 'Food' : 'Foods' }}
        </span>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="py-12 flex items-center justify-center gap-2 text-xs text-slate-400">
      <Loader2 class="w-4 h-4 animate-spin text-amber-400" />
      <span>Loading favorite foods...</span>
    </div>

    <!-- Favorites Grid / List -->
    <div v-else-if="filteredFavorites.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div v-for="fav in filteredFavorites" :key="fav.template_id"
        class="p-4 rounded-xl bg-slate-950/80 hover:bg-slate-900/90 border border-slate-800/80 hover:border-amber-500/50 transition flex flex-col justify-between gap-3 group shadow-sm">
        <div class="flex items-start justify-between gap-2">
          <div class="truncate">
            <div class="flex items-center gap-1.5 truncate">
              <span class="text-sm font-bold text-slate-100 group-hover:text-amber-300 transition truncate">
                {{ fav.template?.name }}
              </span>
            </div>
            <div class="text-xs text-slate-400 pt-0.5 flex items-center gap-1.5 truncate">
              <span v-if="fav.template?.brand" class="font-medium text-slate-300">{{ fav.template.brand }} •</span>
              <span>{{ fav.template?.cal }} kcal</span>
              <span v-if="fav.template?.serving_size" class="text-slate-500">
                ({{ fav.template.serving_size }}{{ fav.template.serving_unit || 'g' }})
              </span>
            </div>
          </div>

          <!-- Unstar Favorite Button -->
          <button type="button" @click="emit('toggle-favorite', fav.template_id)"
            class="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-amber-400 hover:text-amber-300 transition cursor-pointer shrink-0"
            title="Remove from Favorites">
            <Star class="w-4 h-4 fill-amber-400" />
          </button>
        </div>

        <!-- Macros Breakdown & Actions -->
        <div class="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
          <div class="flex items-center gap-1.5 text-[11px] font-mono">
            <span class="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/60 text-emerald-300">
              P:{{ fav.template?.prot_g }}g
            </span>
            <span class="px-1.5 py-0.5 rounded bg-yellow-950/80 border border-yellow-800/60 text-yellow-300">
              C:{{ fav.template?.carb_g }}g
            </span>
            <span class="px-1.5 py-0.5 rounded bg-rose-950/80 border border-rose-800/60 text-rose-300">
              F:{{ fav.template?.fat_g }}g
            </span>
          </div>

          <div class="flex items-center gap-1.5 shrink-0">
            <!-- Full Nutrition Breakdown Modal Trigger -->
            <button type="button" @click="inspectedTemplate = {
              name: fav.template?.name || 'Favorite Food',
              cal_100g: fav.template?.cal || 0,
              prot_100g: fav.template?.prot_g || 0,
              carb_100g: fav.template?.carb_g || 0,
              fat_100g: fav.template?.fat_g || 0,
              serving_size_g: fav.template?.serving_size || undefined,
              serving_label: fav.template?.serving_size ? `${fav.template.serving_size}${fav.template.serving_unit || 'g'}` : undefined,
              micros: (fav.custom_micros || fav.template?.micros) as Record<string, number> | undefined
            }"
              class="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-slate-400 hover:text-amber-300 transition cursor-pointer"
              title="View Micronutrients Breakdown">
              <Info class="w-3.5 h-3.5" />
            </button>

            <!-- Quick Log Meal Button -->
            <button type="button" @click="openLogModal(fav)"
              class="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center gap-1 active:scale-95 cursor-pointer shadow-sm">
              <Plus class="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Log</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="py-16 text-center rounded-2xl bg-slate-950/40 border border-dashed border-slate-800 space-y-3">
      <div
        class="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
        <Star class="w-6 h-6" />
      </div>
      <div class="space-y-1">
        <h3 class="text-sm font-bold text-slate-200">No Favorite Foods Yet</h3>
        <p class="text-xs text-slate-500 max-w-sm mx-auto">
          Tap the ★ icon on any food in the New Entry tab or search results to save it here for instant logging.
        </p>
      </div>
    </div>

    <!-- Log Favorite Modal -->
    <Modal v-if="loggingFavorite" title="Log Favorite Food" :icon="Utensils" icon-color="text-amber-400"
      max-width-class="max-w-md" @close="loggingFavorite = null">
      <div class="space-y-5">
        <div class="p-3 rounded-xl bg-slate-900 border border-slate-800">
          <div class="text-sm font-bold text-slate-100">{{ loggingFavorite.template?.name }}</div>
          <div class="text-xs text-slate-400 pt-0.5">
            Base portion: {{ loggingFavorite.template?.cal }} kcal
            <span v-if="loggingFavorite.template?.serving_size">
              • {{ loggingFavorite.template.serving_size }}{{ loggingFavorite.template.serving_unit || 'g' }}
            </span>
          </div>
        </div>

        <!-- Meal Slot Selector -->
        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-slate-300">Meal Slot</label>
          <div class="grid grid-cols-4 gap-1.5">
            <button v-for="slot in [
              { bit: MealFlags.BREAKFAST, label: 'Breakfast' },
              { bit: MealFlags.LUNCH, label: 'Lunch' },
              { bit: MealFlags.DINNER, label: 'Dinner' },
              { bit: MealFlags.SNACK, label: 'Snack' }
            ]" :key="slot.bit" type="button" @click="logSlotBit = slot.bit" :class="[
                'py-2 px-1 rounded-xl text-xs font-bold text-center transition cursor-pointer border',
                logSlotBit === slot.bit
                  ? 'bg-amber-500 text-slate-950 border-amber-500'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
              ]">
              {{ slot.label }}
            </button>
          </div>
        </div>

        <!-- Servings Multiplier -->
        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-slate-300">Number of Servings</label>
          <div class="flex items-center gap-2">
            <input type="number" v-model.number="logServings" min="0.1" step="0.25"
              class="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none transition font-mono" />
            <span class="text-xs text-slate-400 shrink-0 font-medium">servings</span>
          </div>
        </div>

        <!-- Live Scaled Nutrition Summary -->
        <div
          class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-center justify-between text-amber-200">
          <span>Scaled Total:</span>
          <span class="font-mono font-bold">
            {{ Math.round((loggingFavorite.template?.cal || 0) * (Number(logServings) || 1)) }} kcal
            (P:{{ Math.round((loggingFavorite.template?.prot_g || 0) * (Number(logServings) || 1) * 10) / 10 }}g •
            C:{{ Math.round((loggingFavorite.template?.carb_g || 0) * (Number(logServings) || 1) * 10) / 10 }}g •
            F:{{ Math.round((loggingFavorite.template?.fat_g || 0) * (Number(logServings) || 1) * 10) / 10 }}g)
          </span>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2">
          <button type="button" @click="loggingFavorite = null"
            class="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition cursor-pointer">
            Cancel
          </button>
          <button type="button" @click="confirmLogFavorite"
            class="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition active:scale-95 cursor-pointer shadow-md">
            Log to Today
          </button>
        </div>
      </div>
    </Modal>

    <!-- Detailed Micronutrients Breakdown Modal -->
    <NutritionBreakdownModal :show="!!inspectedTemplate" :data="inspectedTemplate ? {
      title: inspectedTemplate.name,
      serving_size: inspectedTemplate.serving_label || '100g',
      cal: inspectedTemplate.cal_100g,
      prot_g: inspectedTemplate.prot_100g,
      carb_g: inspectedTemplate.carb_100g,
      fat_g: inspectedTemplate.fat_100g,
      micros: inspectedTemplate.micros
    } : null" :micros-opt="microsOpt" @close="inspectedTemplate = null" />
  </div>
</template>
