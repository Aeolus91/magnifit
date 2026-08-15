<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Search, Loader2, Plus, AlertCircle, X, QrCode, Info, History, BookOpen, Utensils } from '@lucide/vue'
import { useI18n } from '../../../lib/i18n'
import Modal from '../../modals/Modal.vue'
import NutritionBreakdownModal from '../../modals/NutritionBreakdownModal.vue'
import type { MealTemplate, Meal } from '../../../types/fitness'

export interface FoodSearchResult {
  name: string
  brand?: string
  cal_100g: number
  prot_100g: number
  carb_100g: number
  fat_100g: number
  serving_size_g?: number
  serving_label?: string
  micros?: Record<string, number>
}

export interface QuickPickItem {
  id: string
  name: string
  type: 'recent' | 'recipe'
  cal: number
  prot_g: number
  carb_g: number
  fat_g: number
  serving_size?: number
  serving_unit?: string
  servings?: number
  micros?: Record<string, number>
  cal_100g?: number
  prot_100g?: number
  carb_100g?: number
  fat_100g?: number
}

interface Props {
  templates?: MealTemplate[]
  recentMeals?: Meal[]
}

const props = withDefaults(defineProps<Props>(), {
  templates: () => [],
  recentMeals: () => []
})

const emit = defineEmits<{
  (e: 'select-food', food: {
    meal_name: string
    cal: number
    prot_g: number
    carb_g: number
    fat_g: number
    serving_size?: number
    serving_unit?: string
    servings?: number
    micros?: Record<string, number>
  }): void
}>()

const { t } = useI18n()
const searchQuery = ref('')
const isSearching = ref(false)
const searchResults = ref<FoodSearchResult[]>([])
const searchError = ref<string | null>(null)
const selectedFood = ref<FoodSearchResult | null>(null)
const inspectedFood = ref<FoodSearchResult | null>(null)
const servingUnitGrams = ref<number>(100)
const servingCount = ref<number>(1)

onMounted(() => {
  // Purge any legacy client cache
  try {
    localStorage.removeItem('mfit_recent_foods')
  } catch {}
})

const quickPickList = computed<QuickPickItem[]>(() => {
  const list: QuickPickItem[] = []
  const seenNames = new Set<string>()

  // Populated exclusively from live database rows in public.meals
  if (props.recentMeals && props.recentMeals.length > 0) {
    for (const m of props.recentMeals) {
      const cleanName = (m.meal_name || '').trim()
      if (!cleanName) continue

      const lower = cleanName.toLowerCase()
      // Strip parenthetical portion suffixes like "(200g)" or "(1 serving)" to match recipe names
      const baseName = cleanName.replace(/\s*\([^)]*\)\s*$/, '').trim().toLowerCase()

      if (seenNames.has(lower) || (baseName && seenNames.has(baseName))) continue
      seenNames.add(lower)
      if (baseName) seenNames.add(baseName)

      const matchedRecipe = props.templates?.find(t => {
        const tLower = (t.name || '').trim().toLowerCase()
        return tLower === lower || tLower === baseName
      })
      const isRecipeMatch = !!matchedRecipe

      // Query recipe serving size, unit, and micros from recipe blueprint if matched
      const servingSize = m.serving_size || matchedRecipe?.serving_size || undefined
      const servingUnit = m.serving_unit || matchedRecipe?.serving_unit || 'g'
      const servings = m.servings || 1
      const micros = (m.micros || matchedRecipe?.micros) as Record<string, number> | undefined

      list.push({
        id: `db-${m.id || lower}`,
        name: isRecipeMatch && matchedRecipe ? matchedRecipe.name : cleanName,
        type: isRecipeMatch ? 'recipe' : 'recent',
        cal: m.cal || m.calories || matchedRecipe?.cal || 0,
        prot_g: m.prot_g || m.protein_g || matchedRecipe?.prot_g || 0,
        carb_g: m.carb_g || m.carbs_g || matchedRecipe?.carb_g || 0,
        fat_g: m.fat_g || matchedRecipe?.fat_g || 0,
        serving_size: servingSize,
        serving_unit: servingUnit,
        servings: servings,
        micros: micros
      })

      if (list.length >= 10) break
    }
  }

  return list
})

const confirmingRecentFood = ref<QuickPickItem | null>(null)
const recentFoodServings = ref<number>(1)

const handleSelectQuickPick = (item: QuickPickItem) => {
  confirmingRecentFood.value = item
  recentFoodServings.value = 1
}

const confirmRecentFoodServing = () => {
  if (!confirmingRecentFood.value) return
  const item = confirmingRecentFood.value
  const servings = Math.max(0.1, Number(recentFoodServings.value) || 1)

  const scaledCal = Math.round(item.cal * servings)
  const scaledProt = Math.round(item.prot_g * servings * 10) / 10
  const scaledCarb = Math.round(item.carb_g * servings * 10) / 10
  const scaledFat = Math.round(item.fat_g * servings * 10) / 10

  const scaledMicros: Record<string, number> = {}
  if (item.micros) {
    Object.entries(item.micros).forEach(([k, v]) => {
      scaledMicros[k] = Math.round(v * servings * 10) / 10
    })
  }

  let formattedName = item.name
  if (servings !== 1 && !formattedName.includes('x ')) {
    formattedName = `${formattedName} (${servings}x)`
  }

  emit('select-food', {
    meal_name: formattedName,
    cal: scaledCal,
    prot_g: scaledProt,
    carb_g: scaledCarb,
    fat_g: scaledFat,
    serving_size: item.serving_size,
    serving_unit: item.serving_unit || 'g',
    servings: servings,
    micros: Object.keys(scaledMicros).length > 0 ? scaledMicros : undefined
  })

  confirmingRecentFood.value = null
}

// Barcode Scanning State
const showScannerModal = ref(false)
const scannerVideoRef = ref<HTMLVideoElement | null>(null)
const isScanningActive = ref(false)
const scannerError = ref<string | null>(null)
let scannerInterval: any = null
let mediaStream: MediaStream | null = null

import { nextTick } from 'vue'
import { BarcodeDetector as BarcodeDetectorPolyfill } from 'barcode-detector'

const startBarcodeScan = async () => {
  scannerError.value = null
  isScanningActive.value = true
  showScannerModal.value = true

  await nextTick()

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    scannerError.value = 'Camera API is not supported in this browser context (HTTPS required).'
    return
  }

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' }
      },
      audio: false
    })

    if (scannerVideoRef.value && mediaStream) {
      scannerVideoRef.value.srcObject = mediaStream
      scannerVideoRef.value.setAttribute('playsinline', 'true')
      scannerVideoRef.value.setAttribute('autoplay', 'true')
      scannerVideoRef.value.setAttribute('muted', 'true')
      
      try {
        await scannerVideoRef.value.play()
      } catch (playErr) {
        // Autoplay policy fallback
      }

      // Universal BarcodeDetector (Native API if available, else WASM Polyfill)
      const DetectorClass = ('BarcodeDetector' in window) 
        ? (window as any).BarcodeDetector 
        : BarcodeDetectorPolyfill

      const barcodeDetector = new DetectorClass({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'qr_code', 'code_128', 'code_39']
      })

      scannerInterval = setInterval(async () => {
        if (scannerVideoRef.value && scannerVideoRef.value.readyState >= 2 && !scannerVideoRef.value.paused) {
          try {
            const barcodes = await barcodeDetector.detect(scannerVideoRef.value)
            if (barcodes.length > 0) {
              const code = barcodes[0].rawValue
              stopBarcodeScan()
              searchQuery.value = code
              performSearch()
            }
          } catch (detErr) {
            // Frame dropped or decoding
          }
        }
      }, 250)
    }
  } catch (err: any) {
    scannerError.value = `Camera Error (${err?.name || 'Error'}): ${err?.message || 'Access failed'}`
    isScanningActive.value = false
  }
}

const stopBarcodeScan = () => {
  if (scannerInterval) {
    clearInterval(scannerInterval)
    scannerInterval = null
  }
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop())
    mediaStream = null
  }
  isScanningActive.value = false
  showScannerModal.value = false
}

  // Simple in-memory LRU cache to avoid duplicate API calls
  const queryCache = new Map<string, FoodSearchResult[]>()

  const performSearch = async () => {
    const q = searchQuery.value.trim().toLowerCase()
    if (q.length < 2) {
      searchResults.value = []
      return
    }

    if (queryCache.has(q)) {
      searchResults.value = queryCache.get(q)!
      return
    }

    isSearching.value = true
    searchError.value = null

    try {
      const results: FoodSearchResult[] = []
      const isBarcode = /^\d{8,14}$/.test(q)

      if (isBarcode) {
        // Direct OpenFoodFacts Product Barcode API Lookup
        try {
          const offBarcodeUrl = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(q)}.json`
          const offRes = await fetch(offBarcodeUrl)
          if (offRes.ok) {
            const offData = await offRes.json()
            if (offData.status === 1 && offData.product) {
              const p = offData.product
              const nut = p.nutriments || {}
              const cal = Number(nut['energy-kcal_100g'] ?? nut['energy-kcal'] ?? nut['energy-kcal_value'] ?? 0)
              const prot = Number(nut.proteins_100g ?? nut.proteins ?? 0)
              const carb = Number(nut.carbohydrates_100g ?? nut.carbohydrates ?? 0)
              const fat = Number(nut.fat_100g ?? nut.fat ?? 0)

              const micros: Record<string, number> = {}
              if (nut.sugars_100g !== undefined) micros.sugar_g = Number(nut.sugars_100g)
              if (nut['saturated-fat_100g'] !== undefined) micros.sat_fat_g = Number(nut['saturated-fat_100g'])
              if (nut['trans-fat_100g'] !== undefined) micros.trans_fat_g = Number(nut['trans-fat_100g'])
              if (nut.sodium_100g !== undefined) micros.sodium_mg = Math.round(Number(nut.sodium_100g) * 1000)
              if (nut.potassium_100g !== undefined) micros.potassium_mg = Math.round(Number(nut.potassium_100g) * 1000)
              if (nut.cholesterol_100g !== undefined) micros.cholesterol_mg = Math.round(Number(nut.cholesterol_100g) * 1000)
              if (nut.caffeine_100g !== undefined) micros.caffeine_mg = Math.round(Number(nut.caffeine_100g) * 1000)
              if (nut.calcium_100g !== undefined) micros.calcium_mg = Math.round(Number(nut.calcium_100g) * 1000)
              if (nut.iron_100g !== undefined) micros.iron_mg = Math.round(Number(nut.iron_100g) * 1000)

              results.push({
                name: p.product_name || p.product_name_en || `Barcode ${q}`,
                brand: p.brands || undefined,
                cal_100g: Math.round(cal),
                prot_100g: Math.round(prot * 10) / 10,
                carb_100g: Math.round(carb * 10) / 10,
                fat_100g: Math.round(fat * 10) / 10,
                serving_size_g: p.serving_quantity ? Number(p.serving_quantity) : 100,
                serving_label: p.serving_size || '100g',
                micros
              })
            }
          }
        } catch {
          // Fallback to general text search
        }
      }

      // If no barcode match found or not a pure barcode, query USDA & OFF text search
      if (results.length === 0) {
        // 1. Query USDA via Secure Edge Function
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUB_KEY
        const edgeUrl = `${supabaseUrl}/functions/v1/food-search?q=${encodeURIComponent(q)}`

        // 2. Query OpenFoodFacts text search directly from client IP
        const offUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=10`

        const [usdaRes, offRes] = await Promise.allSettled([
          fetch(edgeUrl, {
            headers: {
              'Authorization': `Bearer ${anonKey}`,
              'apikey': anonKey
            }
          }),
          fetch(offUrl)
        ])

        // Process USDA Foods
        if (usdaRes.status === 'fulfilled' && usdaRes.value.ok) {
          try {
            const usdaData = await usdaRes.value.json()
            if (usdaData.foods && Array.isArray(usdaData.foods)) {
              usdaData.foods.forEach((f: any) => {
                const nutrients = f.foodNutrients || []
                const calNut = nutrients.find((n: any) => n.nutrientId === 1008 || n.nutrientName?.includes('Energy') || n.unitName === 'KCAL')
                const protNut = nutrients.find((n: any) => n.nutrientId === 1003 || n.nutrientName?.includes('Protein'))
                const carbNut = nutrients.find((n: any) => n.nutrientId === 1005 || n.nutrientName?.includes('Carbohydrate'))
                const fatNut = nutrients.find((n: any) => n.nutrientId === 1004 || n.nutrientName?.includes('Total lipid'))

                const cal = Math.round(calNut?.value || 0)
                const prot = Math.round((protNut?.value || 0) * 10) / 10
                const carb = Math.round((carbNut?.value || 0) * 10) / 10
                const fat = Math.round((fatNut?.value || 0) * 10) / 10

                const usdaMicros: Record<string, number> = {}
                nutrients.forEach((n: any) => {
                  const val = Number(n.value || 0)
                  if (n.nutrientId === 2000 || n.nutrientName?.toLowerCase().includes('sugars, total')) usdaMicros.sugar_g = val
                  if (n.nutrientId === 1258 || n.nutrientName?.toLowerCase().includes('fatty acids, total saturated')) usdaMicros.sat_fat_g = val
                  if (n.nutrientId === 1257 || n.nutrientName?.toLowerCase().includes('fatty acids, total trans')) usdaMicros.trans_fat_g = val
                  if (n.nutrientId === 1093 || n.nutrientName?.toLowerCase().includes('sodium')) usdaMicros.sodium_mg = val
                  if (n.nutrientId === 1092 || n.nutrientName?.toLowerCase().includes('potassium')) usdaMicros.potassium_mg = val
                  if (n.nutrientId === 1253 || n.nutrientName?.toLowerCase().includes('cholesterol')) usdaMicros.cholesterol_mg = val
                  if (n.nutrientId === 1087 || n.nutrientName?.toLowerCase().includes('calcium')) usdaMicros.calcium_mg = val
                  if (n.nutrientId === 1089 || n.nutrientName?.toLowerCase().includes('iron')) usdaMicros.iron_mg = val
                  if (n.nutrientId === 1090 || n.nutrientName?.toLowerCase().includes('magnesium')) usdaMicros.magnesium_mg = val
                  if (n.nutrientId === 1095 || n.nutrientName?.toLowerCase().includes('zinc')) usdaMicros.zinc_mg = val
                  if (n.nutrientId === 1162 || n.nutrientName?.toLowerCase().includes('vitamin c')) usdaMicros.vit_c_mg = val
                  if (n.nutrientId === 1114 || n.nutrientName?.toLowerCase().includes('vitamin d')) usdaMicros.vit_d_mcg = val
                  if (n.nutrientId === 1178 || n.nutrientName?.toLowerCase().includes('vitamin b-12')) usdaMicros.vit_b12_mcg = val
                  if (n.nutrientId === 1057 || n.nutrientName?.toLowerCase().includes('caffeine')) usdaMicros.caffeine_mg = val
                })

                if (cal > 0 || prot > 0 || carb > 0) {
                  results.push({
                    name: f.description,
                    brand: f.brandOwner || f.brandName || 'USDA Database',
                    cal_100g: cal,
                    prot_100g: prot,
                    carb_100g: carb,
                    fat_100g: fat,
                    serving_size_g: f.servingSize ? Number(f.servingSize) : 100,
                    serving_label: f.servingSizeUnit ? `${f.servingSize}${f.servingSizeUnit}` : '100g',
                    micros: usdaMicros
                  })
                }
              })
            }
          } catch {
            // Ignore
          }
        }

        // Process OpenFoodFacts Products
        if (offRes.status === 'fulfilled' && offRes.value.ok) {
          try {
            const offData = await offRes.value.json()
            if (offData.products && Array.isArray(offData.products)) {
              offData.products.forEach((p: any) => {
                if (!p.product_name || !p.nutriments) return
                const nut = p.nutriments
                const cal = Number(nut['energy-kcal_100g'] ?? nut['energy-kcal'] ?? nut['energy-kcal_value'] ?? 0)
                const prot = Number(nut.proteins_100g ?? nut.proteins ?? 0)
                const carb = Number(nut.carbohydrates_100g ?? nut.carbohydrates ?? 0)
                const fat = Number(nut.fat_100g ?? nut.fat ?? 0)

                const offMicros: Record<string, number> = {}
                if (nut.sugars_100g !== undefined) offMicros.sugar_g = Number(nut.sugars_100g)
                if (nut['saturated-fat_100g'] !== undefined) offMicros.sat_fat_g = Number(nut['saturated-fat_100g'])
                if (nut['trans-fat_100g'] !== undefined) offMicros.trans_fat_g = Number(nut['trans-fat_100g'])
                if (nut.sodium_100g !== undefined) offMicros.sodium_mg = Math.round(Number(nut.sodium_100g) * 1000)
                if (nut.potassium_100g !== undefined) offMicros.potassium_mg = Math.round(Number(nut.potassium_100g) * 1000)
                if (nut.cholesterol_100g !== undefined) offMicros.cholesterol_mg = Math.round(Number(nut.cholesterol_100g) * 1000)
                if (nut.caffeine_100g !== undefined) offMicros.caffeine_mg = Math.round(Number(nut.caffeine_100g) * 1000)
                if (nut.calcium_100g !== undefined) offMicros.calcium_mg = Math.round(Number(nut.calcium_100g) * 1000)
                if (nut.iron_100g !== undefined) offMicros.iron_mg = Math.round(Number(nut.iron_100g) * 1000)

                results.push({
                  name: p.product_name,
                  brand: p.brands || undefined,
                  cal_100g: Math.round(cal),
                  prot_100g: Math.round(prot * 10) / 10,
                  carb_100g: Math.round(carb * 10) / 10,
                  fat_100g: Math.round(fat * 10) / 10,
                  serving_size_g: p.serving_quantity ? Number(p.serving_quantity) : 100,
                  serving_label: p.serving_size || '100g',
                  micros: offMicros
                })
              })
            }
          } catch {
            // Ignore
          }
        }
      }

      const ranked = rankResults(results, q)
      queryCache.set(q, ranked)
      searchResults.value = ranked
    } catch (err: any) {
      searchError.value = 'Food database currently busy. Please use label OCR or manual entry.'
      searchResults.value = []
    } finally {
      isSearching.value = false
    }
  }

  // Pagination & Relevance state
  const showAllResults = ref(false)

  // Token-based relevance ranker
  const rankResults = (items: FoodSearchResult[], rawQuery: string): FoodSearchResult[] => {
    const tokens = rawQuery.toLowerCase().split(/\s+/).filter(t => t.length > 1)
    
    return items
      .map(item => {
        let score = 0
        const nameLower = (item.name || '').toLowerCase()
        const brandLower = (item.brand || '').toLowerCase()
        const target = `${brandLower} ${nameLower}`

        // Exact match bonus
        if (nameLower === rawQuery || target === rawQuery) score += 100
        else if (target.startsWith(rawQuery)) score += 50
        else if (target.includes(rawQuery)) score += 30

        // Token match scoring
        tokens.forEach(tok => {
          if (nameLower.includes(tok)) score += 15
          if (brandLower.includes(tok)) score += 10
        })

        return { item, score }
      })
      .sort((a, b) => b.score - a.score)
      .map(entry => entry.item)
  }

  const displayedResults = computed(() => {
    if (showAllResults.value) return searchResults.value
    return searchResults.value.slice(0, 6)
  })

  const selectItem = (item: FoodSearchResult) => {
    selectedFood.value = item
    servingUnitGrams.value = item.serving_size_g || 100
    servingCount.value = 1
  }

  const confirmSelection = () => {
    if (!selectedFood.value) return
    const totalGrams = (servingUnitGrams.value || 100) * (servingCount.value || 1)
    const ratio = totalGrams / 100
    const fullName = selectedFood.value.brand
      ? `${selectedFood.value.brand} ${selectedFood.value.name}`
      : selectedFood.value.name

    const scaledMicros: Record<string, number> = {}
    if (selectedFood.value.micros) {
      Object.entries(selectedFood.value.micros).forEach(([k, v]) => {
        scaledMicros[k] = Math.round(v * ratio * 10) / 10
      })
    }

    const servingInfo = servingCount.value !== 1
      ? `${servingCount.value}x ${servingUnitGrams.value}g`
      : `${totalGrams}g`

    const foodPayload = {
      meal_name: `${fullName} (${servingInfo})`,
      cal: Math.round(selectedFood.value.cal_100g * ratio),
      prot_g: Math.round(selectedFood.value.prot_100g * ratio),
      carb_g: Math.round(selectedFood.value.carb_100g * ratio),
      fat_g: Math.round(selectedFood.value.fat_100g * ratio),
      serving_size: servingUnitGrams.value || 100,
      serving_unit: 'g',
      servings: servingCount.value || 1,
      micros: scaledMicros
    }

    emit('select-food', foodPayload)

    selectedFood.value = null
  }
</script>

<template>
  <div class="space-y-4">
    <!-- Search Bar with Explicit Search Submit, Barcode Scanner, & Enter Key -->
    <form @submit.prevent="showAllResults = false; performSearch()" class="flex gap-2">
      <div class="relative flex-1">
        <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          v-model="searchQuery"
          :placeholder="t('meals.search.placeholder')"
          class="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pl-10 pr-9 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition"
        />
        <button
          v-if="searchQuery"
          type="button"
          @click="searchQuery = ''; searchResults = []"
          class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300 transition cursor-pointer"
        >
          <X class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Barcode Scan Camera Trigger -->
      <button
        type="button"
        @click="startBarcodeScan"
        title="Scan Barcode"
        class="px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500 text-slate-300 hover:text-amber-400 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-md"
      >
        <QrCode class="w-4 h-4" />
      </button>

      <button
        type="submit"
        :disabled="isSearching || !searchQuery.trim()"
        class="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-md"
      >
        <Loader2 v-if="isSearching" class="w-3.5 h-3.5 animate-spin" />
        <template v-else>
          <Search class="w-3.5 h-3.5 stroke-[2.5]" />
          <span class="hidden sm:inline">Search</span>
        </template>
      </button>
    </form>

    <!-- Native Barcode Camera Scanner Modal -->
    <Modal
      v-if="showScannerModal"
      title="Scan Product Barcode"
      :icon="QrCode"
      icon-color="text-amber-400"
      max-width-class="max-w-md"
      @close="stopBarcodeScan"
    >
      <div class="space-y-4 text-center">
        <div class="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
          <video
            ref="scannerVideoRef"
            autoplay
            playsinline
            muted
            class="w-full h-full object-cover"
          ></video>
          
          <!-- Scanner Target Reticle -->
          <div class="absolute inset-x-12 inset-y-8 border-2 border-dashed border-amber-400/80 rounded-xl pointer-events-none animate-pulse"></div>
        </div>

        <div v-if="scannerError" class="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs">
          {{ scannerError }}
        </div>
        <p v-else class="text-xs text-slate-400">
          Center the UPC / EAN barcode in the viewfinder. The item will be recognized automatically.
        </p>
      </div>
    </Modal>

    <!-- Quick-Pick List: Recent Foods & Saved Recipes (Visible when search query is empty) -->
    <div v-if="!searchQuery.trim() && !isSearching && quickPickList.length > 0" class="space-y-3 pt-1">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-1.5 text-xs font-bold text-slate-300">
          <History class="w-3.5 h-3.5 text-amber-400" />
          <span>Recently Added Foods & Recipes</span>
        </div>
        <span class="text-[10px] text-slate-500 font-mono">{{ quickPickList.length }} items</span>
      </div>

      <div class="space-y-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
        <div
          v-for="item in quickPickList"
          :key="item.id"
          @click="handleSelectQuickPick(item)"
          class="p-3 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800/80 hover:border-amber-500/60 transition cursor-pointer flex items-center justify-between gap-3 group"
        >
          <div class="truncate">
            <div class="flex items-center gap-1.5 truncate">
              <span
                class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0"
                :class="item.type === 'recipe' ? 'bg-amber-950/90 text-amber-300 border border-amber-800/60' : 'bg-slate-800 text-slate-300 border border-slate-700/60'"
              >
                {{ item.type }}
              </span>
              <span class="text-xs font-bold text-slate-200 group-hover:text-amber-300 truncate transition">
                {{ item.name }}
              </span>
            </div>
            <div class="text-[11px] text-slate-400 truncate pt-0.5">
              <span>{{ item.cal }} kcal</span>
              <span v-if="item.serving_size" class="text-slate-500"> • {{ item.serving_size }}{{ item.serving_unit || 'g' }}</span>
            </div>
          </div>

          <div class="flex items-center gap-1.5 shrink-0">
            <div class="flex items-center gap-1 text-[10px] font-mono">
              <span class="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/60 text-emerald-300">P:{{ item.prot_g }}g</span>
              <span class="px-1.5 py-0.5 rounded bg-yellow-950/80 border border-yellow-800/60 text-yellow-300">C:{{ item.carb_g }}g</span>
              <span class="px-1.5 py-0.5 rounded bg-rose-950/80 border border-rose-800/60 text-rose-300">F:{{ item.fat_g }}g</span>
            </div>

            <!-- Inspect Full Nutritional Breakdown Button -->
            <button
              type="button"
              @click.stop="inspectedFood = {
                name: item.name,
                cal_100g: item.cal,
                prot_100g: item.prot_g,
                carb_100g: item.carb_g,
                fat_100g: item.fat_g,
                serving_size_g: item.serving_size,
                serving_label: item.serving_size ? `${item.serving_size}${item.serving_unit || 'g'}` : undefined,
                micros: item.micros
              }"
              class="p-1 rounded-md bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-slate-400 hover:text-amber-300 transition cursor-pointer"
              title="View Full Nutritional Breakdown"
            >
              <Info class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isSearching" class="py-6 flex items-center justify-center gap-2 text-xs text-slate-400">
      <Loader2 class="w-4 h-4 animate-spin text-amber-400" />
      <span>{{ t('meals.search.searching') }}</span>
    </div>

    <!-- Error State -->
    <div v-else-if="searchError" class="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
      <AlertCircle class="w-4 h-4 text-rose-400 shrink-0" />
      <span>{{ searchError }}</span>
    </div>

    <!-- Ranked Results List -->
    <div v-else-if="searchResults.length > 0" class="space-y-2">
      <div class="space-y-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
        <div
          v-for="(item, idx) in displayedResults"
          :key="idx"
          @click="selectItem(item)"
          class="p-3 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800/80 hover:border-amber-500/60 transition cursor-pointer flex items-center justify-between gap-3 group"
        >
          <div class="truncate">
            <div class="text-xs font-bold text-slate-200 group-hover:text-amber-300 truncate transition">
              {{ item.name }}
            </div>
            <div class="text-[11px] text-slate-400 truncate">
              <span v-if="item.brand" class="font-medium text-slate-300 mr-1.5">{{ item.brand }} •</span>
              <span>{{ item.cal_100g }} kcal / 100g</span>
            </div>
          </div>

          <div class="flex items-center gap-1.5 shrink-0">
            <div class="flex items-center gap-1 text-[10px] font-mono">
              <span class="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/60 text-emerald-300">P:{{ item.prot_100g }}g</span>
              <span class="px-1.5 py-0.5 rounded bg-yellow-950/80 border border-yellow-800/60 text-yellow-300">C:{{ item.carb_100g }}g</span>
              <span class="px-1.5 py-0.5 rounded bg-rose-950/80 border border-rose-800/60 text-rose-300">F:{{ item.fat_100g }}g</span>
            </div>

            <!-- Inspect Full Nutritional Breakdown Button -->
            <button
              type="button"
              @click.stop="inspectedFood = item"
              class="p-1 rounded-md bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-slate-400 hover:text-amber-300 transition cursor-pointer"
              title="View Full Nutritional Breakdown"
            >
              <Info class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <!-- Show More Toggle Button -->
      <div v-if="searchResults.length > 6" class="pt-1 text-center">
        <button
          type="button"
          @click="showAllResults = !showAllResults"
          class="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 text-xs font-semibold transition active:scale-95 cursor-pointer inline-flex items-center gap-1"
        >
          <span>{{ showAllResults ? 'Show Less' : `Show More (${searchResults.length - 6} additional matches)` }}</span>
        </button>
      </div>
    </div>

    <!-- Empty Search State -->
    <div v-else-if="searchQuery.trim().length >= 2 && !isSearching" class="text-center py-6 text-xs text-slate-500">
      {{ t('meals.search.no_results') }}
    </div>

    <!-- Selected Food Portion Configurator Modal / Drawer -->
    <div v-if="selectedFood" class="bg-slate-950 border border-amber-500/50 rounded-xl p-4 space-y-3 animate-in fade-in zoom-in-95">
      <div class="flex items-start justify-between">
        <div>
          <div class="text-xs font-bold text-slate-100">{{ selectedFood.name }}</div>
          <div class="text-[11px] text-slate-400">{{ selectedFood.brand || 'Nutrition per 100g' }}</div>
        </div>
        <button type="button" @click="selectedFood = null" class="text-slate-500 hover:text-slate-300 p-1 cursor-pointer">
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Dual Input: Serving Size (g) and Number of Servings -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        <div class="space-y-1">
          <label class="text-[11px] font-semibold text-slate-300">Serving Size (g)</label>
          <input
            type="number"
            v-model.number="servingUnitGrams"
            min="1"
            max="2000"
            class="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none"
          />
        </div>

        <div class="space-y-1">
          <label class="text-[11px] font-semibold text-slate-300"># of Servings</label>
          <input
            type="number"
            step="0.25"
            v-model.number="servingCount"
            min="0.25"
            max="50"
            class="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none"
          />
        </div>

        <div class="bg-slate-900 border border-slate-800 rounded-lg p-2 text-center flex flex-col justify-center">
          <div class="text-[10px] text-slate-400 uppercase font-semibold">Total ({{ (servingUnitGrams || 100) * (servingCount || 1) }}g)</div>
          <div class="text-base font-bold text-amber-400">
            {{ Math.round(selectedFood.cal_100g * (((servingUnitGrams || 100) * (servingCount || 1)) / 100)) }} kcal
          </div>
        </div>
      </div>

      <button
        type="button"
        @click="confirmSelection"
        class="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-md"
      >
        <Plus class="w-3.5 h-3.5 stroke-[3]" />
        <span>Use This Food</span>
      </button>
    </div>

    <!-- Clickable Food Search Result Nutrition Breakdown Modal -->
    <NutritionBreakdownModal
      :show="!!inspectedFood"
      :data="inspectedFood ? {
        title: inspectedFood.name,
        subtitle: inspectedFood.brand,
        serving_size: inspectedFood.serving_label || '100g',
        cal: inspectedFood.cal_100g,
        prot_g: inspectedFood.prot_100g,
        carb_g: inspectedFood.carb_100g,
        fat_g: inspectedFood.fat_100g,
        micros: inspectedFood.micros
      } : null"
      @close="inspectedFood = null"
    />

    <!-- Confirm Servings Modal for Recent Foods & Recipes -->
    <Modal
      v-if="confirmingRecentFood"
      :title="confirmingRecentFood.type === 'recipe' ? 'Add Recipe' : 'Add Recent Food'"
      :icon="Utensils"
      icon-color="text-amber-400"
      max-width-class="max-w-md"
      @close="confirmingRecentFood = null"
    >
      <div class="space-y-4">
        <!-- Item Info -->
        <div class="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start justify-between gap-3">
          <div>
            <div class="text-sm font-bold text-slate-100">{{ confirmingRecentFood.name }}</div>
            <div class="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
              <span>Base: {{ confirmingRecentFood.cal }} kcal</span>
              <span class="text-slate-600">•</span>
              <span class="text-emerald-400">P: {{ confirmingRecentFood.prot_g }}g</span>
              <span class="text-yellow-400">C: {{ confirmingRecentFood.carb_g }}g</span>
              <span class="text-rose-400">F: {{ confirmingRecentFood.fat_g }}g</span>
            </div>
          </div>
          <button
            type="button"
            @click="inspectedFood = {
              name: confirmingRecentFood.name,
              cal_100g: confirmingRecentFood.cal,
              prot_100g: confirmingRecentFood.prot_g,
              carb_100g: confirmingRecentFood.carb_g,
              fat_100g: confirmingRecentFood.fat_g,
              serving_size_g: confirmingRecentFood.serving_size,
              serving_label: confirmingRecentFood.serving_size ? `${confirmingRecentFood.serving_size}${confirmingRecentFood.serving_unit || 'g'}` : undefined,
              micros: confirmingRecentFood.micros
            }"
            class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-300 transition cursor-pointer shrink-0"
            title="View Full Nutritional Breakdown"
          >
            <Info class="w-4 h-4" />
          </button>
        </div>

        <!-- Servings Input & Stepper -->
        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-slate-300">Number of Servings</label>
          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="recentFoodServings = Math.max(0.25, Math.round(((recentFoodServings || 1) - 0.25) * 100) / 100)"
              class="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 active:scale-95 text-slate-200 font-bold flex items-center justify-center transition cursor-pointer text-xs shrink-0"
            >
              -¼
            </button>
            <input
              type="number"
              v-model.number="recentFoodServings"
              step="0.25"
              min="0.1"
              max="50"
              class="flex-1 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-center text-sm font-mono text-slate-100 focus:outline-none"
            />
            <button
              type="button"
              @click="recentFoodServings = Math.round(((recentFoodServings || 1) + 0.25) * 100) / 100"
              class="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 active:scale-95 text-slate-200 font-bold flex items-center justify-center transition cursor-pointer text-xs shrink-0"
            >
              +¼
            </button>
          </div>
        </div>

        <!-- Scaled Totals Live Preview -->
        <div class="grid grid-cols-4 gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-center">
          <div>
            <div class="text-[10px] text-slate-500 font-medium uppercase">Calories</div>
            <div class="text-sm font-bold text-amber-400">
              {{ Math.round(confirmingRecentFood.cal * (recentFoodServings || 1)) }}
            </div>
          </div>
          <div>
            <div class="text-[10px] text-slate-500 font-medium uppercase">Protein</div>
            <div class="text-sm font-bold text-emerald-400">
              {{ Math.round(confirmingRecentFood.prot_g * (recentFoodServings || 1) * 10) / 10 }}g
            </div>
          </div>
          <div>
            <div class="text-[10px] text-slate-500 font-medium uppercase">Carbs</div>
            <div class="text-sm font-bold text-yellow-400">
              {{ Math.round(confirmingRecentFood.carb_g * (recentFoodServings || 1) * 10) / 10 }}g
            </div>
          </div>
          <div>
            <div class="text-[10px] text-slate-500 font-medium uppercase">Fat</div>
            <div class="text-sm font-bold text-rose-400">
              {{ Math.round(confirmingRecentFood.fat_g * (recentFoodServings || 1) * 10) / 10 }}g
            </div>
          </div>
        </div>

        <!-- Modal Action Buttons -->
        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            @click="confirmingRecentFood = null"
            class="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="confirmRecentFoodServing"
            class="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
          >
            <Plus class="w-3.5 h-3.5 stroke-[3]" />
            <span>Confirm & Add</span>
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>
