import { ref, computed, onMounted, type Ref } from 'vue'
import { useAuthStore } from '../stores/authStore'
import { useFoodTemplates } from './useFoodTemplates'
import { MicroNutrientFlags } from '../lib/bitmask'
import type { MealTemplate, Meal } from '../types/fitness'

export interface FoodSearchResult {
  id?: string
  template_id?: string
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
  template_id?: string
  name: string
  brand?: string
  type: 'recent' | 'recipe' | 'favorite'
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
  is_favorite?: boolean
}

export function useFoodSearchLookup(
  templatesRef: Ref<MealTemplate[] | undefined>,
  recentMealsRef: Ref<Meal[] | undefined>
) {
  const authStore = useAuthStore()
  const currentUserId = computed(() => authStore.user.value?.id)
  const { favoriteTemplates, isFavorited, fetchFavorites, upsertFoodTemplate, toggleFavorite } = useFoodTemplates(currentUserId)

  const searchQuery = ref('')
  const isSearching = ref(false)
  const searchResults = ref<FoodSearchResult[]>([])
  const searchError = ref<string | null>(null)
  const showAllResults = ref(false)

  const selectedFood = ref<FoodSearchResult | null>(null)
  const inspectedFood = ref<FoodSearchResult | null>(null)
  const servingUnitGrams = ref<number>(100)
  const servingCount = ref<number>(1)

  const confirmingRecentFood = ref<QuickPickItem | null>(null)
  const recentFoodServings = ref<number>(1)

  const showScannerModal = ref(false)
  const scannerError = ref<string | null>(null)

  const queryCache = new Map<string, FoodSearchResult[]>()

  onMounted(() => {
    try {
      localStorage.removeItem('mfit_recent_foods')
    } catch {}
    if (currentUserId.value) {
      fetchFavorites(currentUserId.value)
    }
  })

  const cleanItemName = (name: string) => {
    return name.trim().replace(/\s*\([^)]*\)\s*$/, '').trim().toLowerCase()
  }

  const isItemFavorited = (item: { template_id?: string; name: string }) => {
    if (item.template_id && isFavorited(item.template_id)) return true
    const lower = item.name.trim().toLowerCase()
    const base = cleanItemName(item.name)
    return favoriteTemplates.value.some(f => {
      const tName = f.template?.name.trim().toLowerCase() || ''
      const tBase = cleanItemName(tName)
      return tName === lower || tName === base || tBase === base
    })
  }

  const handleToggleFavoriteItem = async (item: {
    id?: string
    template_id?: string
    name: string
    brand?: string
    cal?: number
    prot_g?: number
    carb_g?: number
    fat_g?: number
    cal_100g?: number
    prot_100g?: number
    carb_100g?: number
    fat_100g?: number
    serving_size?: number
    serving_size_g?: number
    serving_unit?: string
    micros?: Record<string, number>
  }) => {
    let templateId = item.template_id
    const lower = item.name.trim().toLowerCase()
    const base = cleanItemName(item.name)

    const existingFav = favoriteTemplates.value.find(f => {
      const tName = f.template?.name.trim().toLowerCase() || ''
      const tBase = cleanItemName(tName)
      return (item.template_id && f.template_id === item.template_id) || tName === lower || tName === base || tBase === base
    })

    if (existingFav) {
      templateId = existingFav.template_id
    }

    if (!templateId) {
      const cal = item.cal ?? (item.cal_100g ?? 0)
      const prot = item.prot_g ?? (item.prot_100g ?? 0)
      const carb = item.carb_g ?? (item.carb_100g ?? 0)
      const fat = item.fat_g ?? (item.fat_100g ?? 0)
      const sSize = item.serving_size ?? (item.serving_size_g ?? 100)
      const normalizedName = item.name.trim().replace(/\s*\([^)]*\)\s*$/, '').trim()

      templateId = (await upsertFoodTemplate({
        name: normalizedName || item.name,
        brand: item.brand,
        cal,
        prot_g: prot,
        carb_g: carb,
        fat_g: fat,
        serving_size: sSize,
        serving_unit: item.serving_unit || 'g',
        is_public: true,
        micros: item.micros
      })) || undefined
    }

    if (templateId) {
      await toggleFavorite(templateId, item.micros)
    }
  }

  // Quick Picks Aggregation
  const quickPickList = computed<QuickPickItem[]>(() => {
    const list: QuickPickItem[] = []
    const seenNames = new Set<string>()

    const recentMeals = recentMealsRef.value || []
    const templates = templatesRef.value || []

    if (recentMeals.length > 0) {
      for (const m of recentMeals) {
        const cleanName = (m.meal_name || '').trim()
        if (!cleanName) continue

        const lower = cleanName.toLowerCase()
        const baseName = cleanName.replace(/\s*\([^)]*\)\s*$/, '').trim().toLowerCase()

        if (seenNames.has(lower) || (baseName && seenNames.has(baseName))) continue
        seenNames.add(lower)
        if (baseName) seenNames.add(baseName)

        const matchedRecipe = templates.find(t => {
          const tLower = (t.name || '').trim().toLowerCase()
          return tLower === lower || tLower === baseName
        })
        const isRecipeMatch = !!matchedRecipe

        const servingSize = m.serving_size || matchedRecipe?.serving_size || undefined
        const servingUnit = m.serving_unit || matchedRecipe?.serving_unit || 'g'
        const servings = m.servings || 1
        const micros = (m.micros || matchedRecipe?.micros) as Record<string, number> | undefined

        list.push({
          id: `db-${m.id || lower}`,
          template_id: m.template_id || undefined,
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

  // Search & Scoring
  const rankResults = (items: FoodSearchResult[], rawQuery: string): FoodSearchResult[] => {
    const tokens = rawQuery.toLowerCase().split(/\s+/).filter(t => t.length > 1)

    return items
      .map(item => {
        let score = 0
        const nameLower = (item.name || '').toLowerCase()
        const brandLower = (item.brand || '').toLowerCase()
        const target = `${brandLower} ${nameLower}`

        if (nameLower === rawQuery || target === rawQuery) score += 100
        else if (target.startsWith(rawQuery)) score += 50
        else if (target.includes(rawQuery)) score += 30

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

  const performSearch = async () => {
    const q = searchQuery.value.trim().toLowerCase()
    if (!q) {
      searchResults.value = []
      searchError.value = null
      return
    }

    if (queryCache.has(q)) {
      searchResults.value = queryCache.get(q)!
      return
    }

    isSearching.value = true
    searchError.value = null
    searchResults.value = []

    try {
      const results: FoodSearchResult[] = []

      if (/^\d{8,14}$/.test(q)) {
        try {
          const offBarcodeUrl = `https://world.openfoodfacts.org/api/v0/product/${q}.json`
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
              if (nut.sugars_100g !== undefined) micros[MicroNutrientFlags.SUGAR.col] = Number(nut.sugars_100g)
              if (nut['saturated-fat_100g'] !== undefined) micros[MicroNutrientFlags.SAT_FAT.col] = Number(nut['saturated-fat_100g'])
              if (nut['trans-fat_100g'] !== undefined) micros[MicroNutrientFlags.TRANS_FAT.col] = Number(nut['trans-fat_100g'])
              if (nut.sodium_100g !== undefined) micros[MicroNutrientFlags.SODIUM.col] = Math.round(Number(nut.sodium_100g) * 1000)
              if (nut.potassium_100g !== undefined) micros[MicroNutrientFlags.POTASSIUM.col] = Math.round(Number(nut.potassium_100g) * 1000)
              if (nut.cholesterol_100g !== undefined) micros[MicroNutrientFlags.CHOLESTEROL.col] = Math.round(Number(nut.cholesterol_100g) * 1000)
              if (nut.caffeine_100g !== undefined) micros[MicroNutrientFlags.CAFFEINE.col] = Math.round(Number(nut.caffeine_100g) * 1000)
              if (nut.calcium_100g !== undefined) micros[MicroNutrientFlags.CALCIUM.col] = Math.round(Number(nut.calcium_100g) * 1000)
              if (nut.iron_100g !== undefined) micros[MicroNutrientFlags.IRON.col] = Math.round(Number(nut.iron_100g) * 1000)

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
        } catch {}
      }

      if (results.length === 0) {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUB_KEY
        const edgeUrl = `${supabaseUrl}/functions/v1/food-search?q=${encodeURIComponent(q)}`
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
                  if (n.nutrientId === 2000 || n.nutrientName?.toLowerCase().includes('sugars, total')) usdaMicros[MicroNutrientFlags.SUGAR.col] = val
                  if (n.nutrientId === 1258 || n.nutrientName?.toLowerCase().includes('fatty acids, total saturated')) usdaMicros[MicroNutrientFlags.SAT_FAT.col] = val
                  if (n.nutrientId === 1257 || n.nutrientName?.toLowerCase().includes('fatty acids, total trans')) usdaMicros[MicroNutrientFlags.TRANS_FAT.col] = val
                  if (n.nutrientId === 1093 || n.nutrientName?.toLowerCase().includes('sodium')) usdaMicros[MicroNutrientFlags.SODIUM.col] = val
                  if (n.nutrientId === 1092 || n.nutrientName?.toLowerCase().includes('potassium')) usdaMicros[MicroNutrientFlags.POTASSIUM.col] = val
                  if (n.nutrientId === 1253 || n.nutrientName?.toLowerCase().includes('cholesterol')) usdaMicros[MicroNutrientFlags.CHOLESTEROL.col] = val
                  if (n.nutrientId === 1087 || n.nutrientName?.toLowerCase().includes('calcium')) usdaMicros[MicroNutrientFlags.CALCIUM.col] = val
                  if (n.nutrientId === 1089 || n.nutrientName?.toLowerCase().includes('iron')) usdaMicros[MicroNutrientFlags.IRON.col] = val
                  if (n.nutrientId === 1090 || n.nutrientName?.toLowerCase().includes('magnesium')) usdaMicros[MicroNutrientFlags.MAGNESIUM.col] = val
                  if (n.nutrientId === 1095 || n.nutrientName?.toLowerCase().includes('zinc')) usdaMicros[MicroNutrientFlags.ZINC.col] = val
                  if (n.nutrientId === 1162 || n.nutrientName?.toLowerCase().includes('vitamin c')) usdaMicros[MicroNutrientFlags.VIT_C.col] = val
                  if (n.nutrientId === 1114 || n.nutrientName?.toLowerCase().includes('vitamin d')) usdaMicros[MicroNutrientFlags.VIT_D.col] = val
                  if (n.nutrientId === 1178 || n.nutrientName?.toLowerCase().includes('vitamin b-12')) usdaMicros[MicroNutrientFlags.VIT_B12.col] = val
                  if (n.nutrientId === 1057 || n.nutrientName?.toLowerCase().includes('caffeine')) usdaMicros[MicroNutrientFlags.CAFFEINE.col] = val
                })

                if (cal > 0 || prot > 0 || carb > 0) {
                  results.push({
                    name: f.description,
                    brand: f.brandOwner || f.brandName || 'USDA Database',
                    cal_100g: cal,
                    prot_100g: prot,
                    carb_100g: carb,
                    fat_100g: fat,
                    serving_size_g: 100,
                    serving_label: '100g',
                    micros: usdaMicros
                  })
                }
              })
            }
          } catch {}
        }

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
                if (nut.sugars_100g !== undefined) offMicros[MicroNutrientFlags.SUGAR.col] = Number(nut.sugars_100g)
                if (nut['saturated-fat_100g'] !== undefined) offMicros[MicroNutrientFlags.SAT_FAT.col] = Number(nut['saturated-fat_100g'])
                if (nut['trans-fat_100g'] !== undefined) offMicros[MicroNutrientFlags.TRANS_FAT.col] = Number(nut['trans-fat_100g'])
                if (nut.sodium_100g !== undefined) offMicros[MicroNutrientFlags.SODIUM.col] = Math.round(Number(nut.sodium_100g) * 1000)
                if (nut.potassium_100g !== undefined) offMicros[MicroNutrientFlags.POTASSIUM.col] = Math.round(Number(nut.potassium_100g) * 1000)
                if (nut.cholesterol_100g !== undefined) offMicros[MicroNutrientFlags.CHOLESTEROL.col] = Math.round(Number(nut.cholesterol_100g) * 1000)
                if (nut.caffeine_100g !== undefined) offMicros[MicroNutrientFlags.CAFFEINE.col] = Math.round(Number(nut.caffeine_100g) * 1000)
                if (nut.calcium_100g !== undefined) offMicros[MicroNutrientFlags.CALCIUM.col] = Math.round(Number(nut.calcium_100g) * 1000)
                if (nut.iron_100g !== undefined) offMicros[MicroNutrientFlags.IRON.col] = Math.round(Number(nut.iron_100g) * 1000)

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
          } catch {}
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

  return {
    searchQuery,
    isSearching,
    searchResults,
    searchError,
    showAllResults,
    selectedFood,
    inspectedFood,
    servingUnitGrams,
    servingCount,
    confirmingRecentFood,
    recentFoodServings,
    showScannerModal,
    scannerError,
    quickPickList,
    displayedResults,
    isItemFavorited,
    handleToggleFavoriteItem,
    performSearch,
    upsertFoodTemplate
  }
}
