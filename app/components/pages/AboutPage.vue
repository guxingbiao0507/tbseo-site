<template>
  <div class="section-padding pt-32">
    <div class="container-custom max-w-4xl">
      <h1 class="text-3xl md:text-4xl font-bold mb-8">{{ $t('nav.about') }}</h1>
      <div class="space-y-6 text-base leading-relaxed" style="color: var(--tb-text-muted)">
        <p>{{ $t('demo.desc') }}</p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
          <div v-for="(item, i) in summaryItems" :key="i" class="p-6 rounded-lg bg-[var(--tb-bg-2)]">
            <h3 class="font-bold text-lg mb-2">{{ item.title }}</h3>
            <p class="text-sm">{{ item.subtitle }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t, tm } = useI18n()

const summaryKeys = ['team', 'tech', 'experience', 'results'] as const
const summaryItems = computed(() =>
  summaryKeys.map(key => ({
    title: t(`summary.${key}.title`),
    subtitle: t(`summary.${key}.subtitle`),
  }))
)
</script>
