<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search, Loader2, Plus, AlertCircle, X, QrCode } from '@lucide/vue'
import { useI18n } from '../../../lib/i18n'
import Modal from '../../modals/Modal.vue'

export interface FoodSearchResult {
  name: string
  brand?: string
  cal_100g: number
  prot_100g: number
  carb_100g: number
  fat_100g: number
  serving_size_g?: number
  serving_label?: string
}

const emit = defineEmits<{
  (e: 'select-food', food: {
    meal_name: string
    cal: number
    prot_g: number
    carb_g: number
    fat_g: number
  }): void
}>()

const { t } = useI18n()
const searchQuery = ref('')
const isSearching = ref(false)
const searchResults = ref<FoodSearchResult[]>([])
const searchError = ref<string | null>(null)
const selectedFood = ref<FoodSearchResult | null>(null)
const servingGrams = ref<number>(100)

// Barcode Scanning State
const showScannerModal = ref(false)
const scannerVideoRef = ref<HTMLVideoElement | null>(null)
const isScanningActive = ref(false)
const scannerError = ref<string | null>(null)
let scannerInterval: any = null
let mediaStream: MediaStream | null = null

import { nextTick } from 'vue'

const startBarcodeScan = async () => {
  console.log('[BarcodeScanner] startBarcodeScan triggered')
  scannerError.value = null
  isScanningActive.value = true
  showScannerModal.value = true

  await nextTick()
  console.log('[BarcodeScanner] Modal opened, nextTick completed. videoRef:', scannerVideoRef.value)

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.error('[BarcodeScanner] navigator.mediaDevices.getUserMedia is undefined (insecure context or unsupported browser)')
    scannerError.value = 'Camera API is not supported in this browser context (HTTPS required).'
    return
  }

  try {
    console.log('[BarcodeScanner] Requesting getUserMedia...')
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' }
      },
      audio: false
    })
    console.log('[BarcodeScanner] getUserMedia success. Stream active:', mediaStream.active)

    if (scannerVideoRef.value && mediaStream) {
      scannerVideoRef.value.srcObject = mediaStream
      scannerVideoRef.value.setAttribute('playsinline', 'true')
      scannerVideoRef.value.setAttribute('autoplay', 'true')
      scannerVideoRef.value.setAttribute('muted', 'true')
      
      try {
        await scannerVideoRef.value.play()
        console.log('[BarcodeScanner] video.play() started successfully')
      } catch (playErr) {
        console.warn('[BarcodeScanner] video.play() error:', playErr)
      }

      // Check native BarcodeDetector API support
      if ('BarcodeDetector' in window) {
        console.log('[BarcodeScanner] BarcodeDetector supported in window')
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'qr_code', 'code_128', 'code_39']
        })

        scannerInterval = setInterval(async () => {
          if (scannerVideoRef.value && scannerVideoRef.value.readyState >= 2 && !scannerVideoRef.value.paused) {
            try {
              const barcodes = await barcodeDetector.detect(scannerVideoRef.value)
              if (barcodes.length > 0) {
                const code = barcodes[0].rawValue
                console.log('[BarcodeScanner] Barcode detected:', code)
                stopBarcodeScan()
                searchQuery.value = code
                performSearch()
              }
            } catch (detErr) {
              // Frame dropped
            }
          }
        }, 250)
      } else {
        console.warn('[BarcodeScanner] BarcodeDetector is NOT supported on this browser')
        scannerError.value = 'Live barcode detection is not supported on this browser engine. Please type the barcode number in the search box.'
      }
    }
  } catch (err: any) {
    console.error('[BarcodeScanner] getUserMedia failed:', err)
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

      // 1. Query USDA via Secure Edge Function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUB_KEY
      const edgeUrl = `${supabaseUrl}/functions/v1/food-search?q=${encodeURIComponent(q)}`

      // 2. Query OpenFoodFacts directly from client IP (Simple CORS request without custom headers to bypass preflight blocks)
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

              if (cal > 0 || prot > 0 || carb > 0) {
                results.push({
                  name: f.description,
                  brand: f.brandOwner || f.brandName || 'USDA Database',
                  cal_100g: cal,
                  prot_100g: prot,
                  carb_100g: carb,
                  fat_100g: fat,
                  serving_size_g: f.servingSize ? Number(f.servingSize) : 100,
                  serving_label: f.servingSizeUnit ? `${f.servingSize}${f.servingSizeUnit}` : '100g'
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

              results.push({
                name: p.product_name,
                brand: p.brands || undefined,
                cal_100g: Math.round(cal),
                prot_100g: Math.round(prot * 10) / 10,
                carb_100g: Math.round(carb * 10) / 10,
                fat_100g: Math.round(fat * 10) / 10,
                serving_size_g: p.serving_quantity ? Number(p.serving_quantity) : 100,
                serving_label: p.serving_size || '100g'
              })
            })
          }
        } catch {
          // Ignore
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
    servingGrams.value = item.serving_size_g || 100
  }

  const confirmSelection = () => {
    if (!selectedFood.value) return
    const ratio = (servingGrams.value || 100) / 100
    const fullName = selectedFood.value.brand
      ? `${selectedFood.value.brand} ${selectedFood.value.name}`
      : selectedFood.value.name

    emit('select-food', {
      meal_name: `${fullName} (${servingGrams.value}g)`,
      cal: Math.round(selectedFood.value.cal_100g * ratio),
      prot_g: Math.round(selectedFood.value.prot_100g * ratio),
      carb_g: Math.round(selectedFood.value.carb_100g * ratio),
      fat_g: Math.round(selectedFood.value.fat_100g * ratio)
    })

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

          <div class="flex items-center gap-1.5 text-[10px] font-mono shrink-0">
            <span class="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/60 text-emerald-300">P:{{ item.prot_100g }}g</span>
            <span class="px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-800/60 text-amber-300">C:{{ item.carb_100g }}g</span>
            <span class="px-1.5 py-0.5 rounded bg-rose-950/80 border border-rose-800/60 text-rose-300">F:{{ item.fat_100g }}g</span>
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

      <div class="flex items-center gap-3 pt-1">
        <div class="w-1/2 space-y-1">
          <label class="text-xs font-semibold text-slate-300">Portion (grams)</label>
          <input
            type="number"
            v-model.number="servingGrams"
            min="1"
            max="2000"
            class="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none"
          />
        </div>

        <div class="w-1/2 bg-slate-900 border border-slate-800 rounded-lg p-2 text-center">
          <div class="text-[10px] text-slate-400 uppercase font-semibold">Total Energy</div>
          <div class="text-base font-bold text-amber-400">
            {{ Math.round(selectedFood.cal_100g * (servingGrams / 100)) }} kcal
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
  </div>
</template>
