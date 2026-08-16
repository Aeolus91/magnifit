import { computed, type Component } from 'vue'
import { useI18n, type TranslationKey } from '../lib/i18n'

export interface FooterObjectItem {
  label: string
  href?: string
  icon?: Component | any
  domain?: string
  external?: boolean
}

export type FooterConfigItem = string | FooterObjectItem

export interface NormalizedFooterItem {
  label: string
  href?: string
  icon?: Component | any
  faviconUrl?: string
  isExternal: boolean
}

export function useFooter(footerKey: TranslationKey | string = 'landing.footer') {
  const { tm } = useI18n()

  const rawFooterConfig = computed<FooterConfigItem[]>(() => {
    const cfg = tm<FooterConfigItem[]>(footerKey)
    return Array.isArray(cfg) ? cfg : []
  })

  const normalizedFooterItems = computed<NormalizedFooterItem[]>(() => {
    return rawFooterConfig.value.map((item) => {
      if (typeof item === 'string') {
        return { label: item, isExternal: false }
      }

      let faviconUrl: string | undefined
      if (item.domain) {
        faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(item.domain)}&sz=64`
      } else if (item.href) {
        try {
          const host = new URL(item.href).hostname
          faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`
        } catch {
          faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(item.label.toLowerCase())}&sz=64`
        }
      }

      return {
        label: item.label,
        href: item.href,
        icon: item.icon,
        faviconUrl,
        isExternal: item.external ?? (!!item.href && /^https?:\/\//.test(item.href))
      }
    })
  })

  return {
    rawFooterConfig,
    normalizedFooterItems
  }
}
