<script setup lang="ts">
import { useFooter } from '../../composables/useFooter'

interface Props {
  footerKey?: string
}

const props = withDefaults(defineProps<Props>(), {
  footerKey: 'landing.footer'
})

const { normalizedFooterItems } = useFooter(props.footerKey)
</script>

<template>
  <footer
    v-if="normalizedFooterItems.length > 0"
    class="border-t border-slate-900 px-6 py-6 text-center text-xs text-slate-400 font-mono flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-2"
  >
    <template v-for="(item, index) in normalizedFooterItems" :key="index">
      <span v-if="index > 0" class="hidden md:inline text-slate-600 select-none">•</span>

      <component
        :is="item.href ? 'a' : 'span'"
        :href="item.href"
        :target="item.isExternal ? '_blank' : undefined"
        :rel="item.isExternal ? 'noopener noreferrer' : undefined"
        :class="[
          'inline-flex items-center gap-1.5 transition duration-200',
          item.href ? 'group text-slate-400 hover:text-emerald-400 cursor-pointer' : 'text-slate-400'
        ]"
      >
        <img
          v-if="item.faviconUrl"
          :src="item.faviconUrl"
          :alt="item.label"
          class="w-3.5 h-3.5 rounded-xs shrink-0 grayscale opacity-60 invert group-hover:opacity-100 group-hover:brightness-125 transition duration-200"
          loading="lazy"
        />
        <component :is="item.icon" v-else-if="item.icon" class="w-3.5 h-3.5" />
        <span>{{ item.label }}</span>
      </component>
    </template>
  </footer>
</template>
