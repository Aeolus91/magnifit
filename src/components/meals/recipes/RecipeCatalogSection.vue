<script setup lang="ts">
import { ref } from 'vue'
import { Plus, BookOpen, Trash2, Check, Utensils, X, Search, Camera, PenTool } from '@lucide/vue'
import { MealFlags } from '../../../lib/bitmask'
import { useI18n } from '../../../lib/i18n'
import Modal from '../../modals/Modal.vue'
import FoodSearchLookup from '../forms/FoodSearchLookup.vue'
import NutritionLabelOcrModal from '../forms/NutritionLabelOcrModal.vue'
import type { MealTemplate, RecipeIngredient } from '../../../types/fitness'

const props = defineProps<{
  templates: MealTemplate[]
}>()

const emit = defineEmits<{
  (e: 'create-template', template: Partial<MealTemplate>): void
  (e: 'delete-template', id: string): void
  (e: 'log-template', template: MealTemplate, slot: number, multiplier: number): void
}>()

const { t } = useI18n()

const showCreateModal = ref(false)
const showLogModal = ref(false)
const selectedTemplateForLog = ref<MealTemplate | null>(null)
const logSlot = ref<number>(MealFlags.LUNCH)
const logMultiplier = ref<number>(1)

// Ingredient input mode
const ingredientInputMode = ref<'search' | 'manual' | 'ocr'>('search')

// New Template Model
const newName = ref('')
const newDescription = ref('')
const newServings = ref<number>(1)
const newIngredients = ref<RecipeIngredient[]>([])

const ingName = ref('')
const ingAmount = ref<number | null>(null)
const ingUnit = ref('g')
const ingCal = ref<number | null>(null)
const ingProt = ref<number | null>(null)
const ingCarb = ref<number | null>(null)
const ingFat = ref<number | null>(null)

const addIngredient = () => {
  if (!ingName.value.trim() || ingCal.value === null) return
  newIngredients.value.push({
    name: ingName.value.trim(),
    amount: ingAmount.value || 100,
    unit: ingUnit.value || 'g',
    cal: ingCal.value || 0,
    prot_g: ingProt.value || 0,
    carb_g: ingCarb.value || 0,
    fat_g: ingFat.value || 0
  })

  ingName.value = ''
  ingAmount.value = null
  ingCal.value = null
  ingProt.value = null
  ingCarb.value = null
  ingFat.value = null
}

const handleFoodSelectedForRecipe = (food: { meal_name: string; cal: number; prot_g: number; carb_g: number; fat_g: number }) => {
  newIngredients.value.push({
    name: food.meal_name,
    amount: 1,
    unit: 'serving',
    cal: food.cal,
    prot_g: food.prot_g,
    carb_g: food.carb_g,
    fat_g: food.fat_g
  })
}

const handleOcrSelectedForRecipe = (data: { meal_name?: string; cal?: number; prot_g?: number; carb_g?: number; fat_g?: number }) => {
  if (data.cal !== undefined) {
    newIngredients.value.push({
      name: data.meal_name || 'Scanned Ingredient',
      amount: 1,
      unit: 'serving',
      cal: data.cal || 0,
      prot_g: data.prot_g || 0,
      carb_g: data.carb_g || 0,
      fat_g: data.fat_g || 0
    })
  }
}

const recipeMicros = ref<Record<string, number | undefined>>({
  sugar_g: undefined,
  sodium_mg: undefined,
  potassium_mg: undefined,
  caffeine_mg: undefined
})

const removeIngredient = (idx: number) => {
  newIngredients.value.splice(idx, 1)
}

const handleCreateTemplate = () => {
  if (!newName.value.trim()) return
  const totalCal = newIngredients.value.reduce((acc, i) => acc + i.cal, 0)
  const totalProt = newIngredients.value.reduce((acc, i) => acc + i.prot_g, 0)
  const totalCarb = newIngredients.value.reduce((acc, i) => acc + i.carb_g, 0)
  const totalFat = newIngredients.value.reduce((acc, i) => acc + i.fat_g, 0)

  // Clean empty micros
  const cleanedMicros: Record<string, number> = {}
  Object.entries(recipeMicros.value).forEach(([k, v]) => {
    if (v !== undefined && v !== null && !isNaN(v)) {
      cleanedMicros[k] = v
    }
  })

  emit('create-template', {
    name: newName.value.trim(),
    description: newDescription.value.trim() || null,
    cal: totalCal,
    prot_g: totalProt,
    carb_g: totalCarb,
    fat_g: totalFat,
    servings: newServings.value || 1,
    items: newIngredients.value.map(i => ({
      item_name: i.name,
      amount: i.amount,
      unit: i.unit,
      cal: i.cal,
      prot_g: i.prot_g,
      carb_g: i.carb_g,
      fat_g: i.fat_g
    })),
    micros: Object.keys(cleanedMicros).length > 0 ? cleanedMicros : undefined
  })

  newName.value = ''
  newDescription.value = ''
  newIngredients.value = []
  recipeMicros.value = {
    sugar_g: undefined,
    sodium_mg: undefined,
    potassium_mg: undefined,
    caffeine_mg: undefined
  }
  showCreateModal.value = false
}

const openLogModal = (tmpl: MealTemplate) => {
  selectedTemplateForLog.value = tmpl
  logMultiplier.value = 1
  showLogModal.value = true
}

const confirmLog = () => {
  if (!selectedTemplateForLog.value) return
  emit('log-template', selectedTemplateForLog.value, logSlot.value, logMultiplier.value)
  showLogModal.value = false
  selectedTemplateForLog.value = null
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header with Create Button -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-bold text-slate-100">{{ t('meals.recipes.title') }}</h2>
        <p class="text-xs text-slate-400">{{ t('meals.recipes.desc') }}</p>
      </div>

      <button
        type="button"
        @click="showCreateModal = true"
        class="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
      >
        <Plus class="w-3.5 h-3.5 stroke-[3]" />
        <span>{{ t('meals.recipes.new_btn') }}</span>
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="templates.length === 0" class="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
      <BookOpen class="w-8 h-8 text-amber-400 mx-auto" />
      <div class="text-sm font-semibold text-slate-200">No saved recipes yet</div>
      <p class="text-xs text-slate-400 max-w-sm mx-auto">
        Create recipes with individual ingredients and macros to quickly log repeat meals in one tap.
      </p>
    </div>

    <!-- Template Cards Grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div
        v-for="tmpl in templates"
        :key="tmpl.id"
        class="bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl transition group"
      >
        <div class="flex items-start justify-between">
          <div>
            <div class="text-sm font-bold text-slate-100 group-hover:text-amber-300 transition">{{ tmpl.name }}</div>
            <div v-if="tmpl.description" class="text-xs text-slate-400 mt-0.5 line-clamp-1">{{ tmpl.description }}</div>
          </div>
          <button
            type="button"
            @click="tmpl.id && emit('delete-template', tmpl.id)"
            class="text-slate-600 hover:text-rose-400 p-1 transition cursor-pointer"
            title="Delete Recipe"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- Macro Badges -->
        <div class="grid grid-cols-4 gap-1.5 text-center font-mono">
          <div class="bg-slate-950 p-1.5 rounded-lg border border-slate-800/80">
            <div class="text-[9px] text-slate-500 uppercase font-sans">Energy</div>
            <div class="text-xs font-bold text-amber-400">{{ tmpl.cal }}</div>
          </div>
          <div class="bg-slate-950 p-1.5 rounded-lg border border-slate-800/80">
            <div class="text-[9px] text-slate-500 uppercase font-sans">Protein</div>
            <div class="text-xs font-bold text-emerald-300">{{ tmpl.prot_g }}g</div>
          </div>
          <div class="bg-slate-950 p-1.5 rounded-lg border border-slate-800/80">
            <div class="text-[9px] text-slate-500 uppercase font-sans">Carbs</div>
            <div class="text-xs font-bold text-amber-300">{{ tmpl.carb_g }}g</div>
          </div>
          <div class="bg-slate-950 p-1.5 rounded-lg border border-slate-800/80">
            <div class="text-[9px] text-slate-500 uppercase font-sans">Fat</div>
            <div class="text-xs font-bold text-rose-300">{{ tmpl.fat_g }}g</div>
          </div>
        </div>

        <!-- Ingredients Preview -->
        <div v-if="tmpl.ingredients && tmpl.ingredients.length > 0" class="text-[11px] text-slate-400 truncate">
          <span>{{ tmpl.ingredients.map(i => `${i.name} (${i.amount}${i.unit})`).join(', ') }}</span>
        </div>

        <!-- Log Button -->
        <button
          type="button"
          @click="openLogModal(tmpl)"
          class="w-full py-2 rounded-xl bg-slate-950 hover:bg-amber-500 border border-slate-800 hover:border-amber-500 hover:text-slate-950 text-amber-400 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-md"
        >
          <Utensils class="w-3.5 h-3.5" />
          <span>{{ t('meals.recipes.log_btn') }}</span>
        </button>
      </div>
    </div>

    <!-- Create Recipe Modal -->
    <Modal
      v-if="showCreateModal"
      title="Create Recipe Blueprint"
      :icon="BookOpen"
      icon-color="text-amber-400"
      max-width-class="max-w-lg"
      @close="showCreateModal = false"
    >
      <form @submit.prevent="handleCreateTemplate" class="space-y-4">
        <div class="space-y-1">
          <label class="text-xs font-semibold text-slate-300">Recipe Name</label>
          <input
            type="text"
            v-model="newName"
            placeholder="e.g. Post-Workout Protein Smoothie"
            required
            class="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
          />
        </div>

        <!-- Ingredients Builder with Mode Tabs -->
        <div class="space-y-3 pt-2 border-t border-slate-800/80">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-300">Add Ingredients</span>
            
            <div class="flex p-0.5 bg-slate-950 border border-slate-800 rounded-lg text-[10px] font-semibold">
              <button
                type="button"
                @click="ingredientInputMode = 'search'"
                :class="[
                  'px-2 py-1 rounded transition cursor-pointer flex items-center gap-1',
                  ingredientInputMode === 'search' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                ]"
              >
                <Search class="w-3 h-3" />
                <span>Search</span>
              </button>
              <button
                type="button"
                @click="ingredientInputMode = 'manual'"
                :class="[
                  'px-2 py-1 rounded transition cursor-pointer flex items-center gap-1',
                  ingredientInputMode === 'manual' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                ]"
              >
                <PenTool class="w-3 h-3" />
                <span>Manual</span>
              </button>
              <button
                type="button"
                @click="ingredientInputMode = 'ocr'"
                :class="[
                  'px-2 py-1 rounded transition cursor-pointer flex items-center gap-1',
                  ingredientInputMode === 'ocr' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                ]"
              >
                <Camera class="w-3 h-3" />
                <span>OCR</span>
              </button>
            </div>
          </div>

          <!-- Mode 1: Search Database -->
          <div v-if="ingredientInputMode === 'search'">
            <FoodSearchLookup @select-food="handleFoodSelectedForRecipe" />
          </div>

          <!-- Mode 2: OCR Label -->
          <div v-else-if="ingredientInputMode === 'ocr'">
            <NutritionLabelOcrModal @autofill="handleOcrSelectedForRecipe" />
          </div>

          <!-- Mode 3: Manual Values -->
          <div v-else class="space-y-2">
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <input
                type="text"
                v-model="ingName"
                placeholder="Ingredient name"
                class="col-span-2 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500"
              />
              <input
                type="number"
                v-model.number="ingAmount"
                placeholder="Amount (100)"
                class="bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-100 placeholder-slate-500"
              />
              <input
                type="number"
                v-model.number="ingCal"
                placeholder="Calories"
                class="bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-100 placeholder-slate-500"
              />
            </div>

            <div class="grid grid-cols-4 gap-2">
              <input
                type="number"
                v-model.number="ingProt"
                placeholder="Prot (g)"
                class="bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-100 placeholder-slate-500"
              />
              <input
                type="number"
                v-model.number="ingCarb"
                placeholder="Carb (g)"
                class="bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-100 placeholder-slate-500"
              />
              <input
                type="number"
                v-model.number="ingFat"
                placeholder="Fat (g)"
                class="bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-100 placeholder-slate-500"
              />
              <button
                type="button"
                @click="addIngredient"
                class="rounded-lg bg-amber-950/80 hover:bg-amber-900 border border-amber-800 text-amber-300 text-xs font-bold py-1.5 transition active:scale-95 cursor-pointer"
              >
                + Add
              </button>
            </div>
          </div>

          <!-- Ingredients List -->
          <div v-if="newIngredients.length > 0" class="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            <div
              v-for="(ing, idx) in newIngredients"
              :key="idx"
              class="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs"
            >
              <span class="text-slate-200">{{ ing.name }} ({{ ing.amount }}{{ ing.unit }})</span>
              <div class="flex items-center gap-2">
                <span class="font-mono text-amber-400">{{ ing.cal }} kcal</span>
                <button type="button" @click="removeIngredient(idx)" class="text-slate-500 hover:text-rose-400 p-0.5 cursor-pointer">
                  <X class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Optional Micronutrients Details -->
        <div class="space-y-2 pt-2 border-t border-slate-800/80">
          <div class="text-xs font-semibold text-slate-300">Tracked Micronutrients (Optional)</div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div class="space-y-1">
              <label class="text-[10px] text-slate-400">Sugar (g)</label>
              <input
                type="number"
                v-model.number="recipeMicros.sugar_g"
                placeholder="0"
                class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-100 placeholder-slate-500"
              />
            </div>
            <div class="space-y-1">
              <label class="text-[10px] text-slate-400">Sodium (mg)</label>
              <input
                type="number"
                v-model.number="recipeMicros.sodium_mg"
                placeholder="0"
                class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-100 placeholder-slate-500"
              />
            </div>
            <div class="space-y-1">
              <label class="text-[10px] text-slate-400">Potassium (mg)</label>
              <input
                type="number"
                v-model.number="recipeMicros.potassium_mg"
                placeholder="0"
                class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-100 placeholder-slate-500"
              />
            </div>
            <div class="space-y-1">
              <label class="text-[10px] text-slate-400">Caffeine (mg)</label>
              <input
                type="number"
                v-model.number="recipeMicros.caffeine_mg"
                placeholder="0"
                class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-100 placeholder-slate-500"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          class="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md"
        >
          <Check class="w-3.5 h-3.5 stroke-[3]" />
          <span>Save Recipe Blueprint</span>
        </button>
      </form>
    </Modal>

    <!-- Log Recipe to Date/Slot Modal -->
    <Modal
      v-if="showLogModal && selectedTemplateForLog"
      title="Log Recipe to Day"
      :icon="Utensils"
      icon-color="text-amber-400"
      max-width-class="max-w-sm"
      @close="showLogModal = false"
    >
      <div class="space-y-4">
        <div>
          <div class="text-sm font-bold text-slate-100">{{ selectedTemplateForLog.name }}</div>
          <div class="text-xs text-slate-400">{{ selectedTemplateForLog.cal }} kcal base</div>
        </div>

        <div class="space-y-1">
          <label class="text-xs font-semibold text-slate-300">Target Meal Slot</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="slot in [
                { bit: MealFlags.BREAKFAST, label: 'Breakfast' },
                { bit: MealFlags.LUNCH, label: 'Lunch' },
                { bit: MealFlags.DINNER, label: 'Dinner' },
                { bit: MealFlags.SNACK, label: 'Snack' }
              ]"
              :key="slot.bit"
              type="button"
              @click="logSlot = slot.bit"
              :class="[
                'py-2 rounded-lg border text-xs font-semibold transition cursor-pointer text-center',
                logSlot === slot.bit
                  ? 'bg-amber-950/70 border-amber-500 text-amber-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              ]"
            >
              {{ slot.label }}
            </button>
          </div>
        </div>

        <div class="space-y-1">
          <label class="text-xs font-semibold text-slate-300">Servings Multiplier</label>
          <input
            type="number"
            v-model.number="logMultiplier"
            step="0.25"
            min="0.25"
            max="10"
            class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100"
          />
        </div>

        <button
          type="button"
          @click="confirmLog"
          class="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md"
        >
          <Check class="w-3.5 h-3.5 stroke-[3]" />
          <span>Confirm & Log</span>
        </button>
      </div>
    </Modal>
  </div>
</template>
