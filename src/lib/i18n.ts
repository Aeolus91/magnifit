import { ref, computed } from 'vue'
import en_US from '../locales/en_US.json'

export type Locale = 'en_US' | 'es_ES' | 'fr_FR' | 'de_DE'
export type TranslationKey = keyof typeof en_US

const currentLocale = ref<Locale>('en_US')
const translations = ref<Record<string, any>>({ ...en_US })

export function useI18n() {
  /**
   * Translate key with optional parameter interpolation
   * Example: t('onboarding.step_counter', { step: 1, total: 3, percent: 33 })
   */
  const t = (key: TranslationKey | string, params?: Record<string, string | number>): string => {
    const val = translations.value[key]
    if (val === undefined || val === null) return String(key)
    if (typeof val !== 'string') return String(val)
    let text = val
    if (params) {
      Object.entries(params).forEach(([paramKey, paramVal]) => {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal))
      })
    }
    return text
  }

  /**
   * Retrieve raw translation entry (e.g. array or object)
   */
  const tm = <T = any>(key: TranslationKey | string): T => {
    return (translations.value[key] ?? key) as T
  }

  const setLocale = (locale: Locale, dictionary?: Record<string, any>) => {
    currentLocale.value = locale
    if (dictionary) {
      translations.value = { ...en_US, ...dictionary }
    }
  }

  return {
    locale: computed(() => currentLocale.value),
    t,
    tm,
    setLocale
  }
}
