<template>
  <div class="section-padding pt-32">
    <div class="container-custom">
      <div class="text-center mb-12">
        <h1 class="text-3xl md:text-4xl font-bold mb-4">{{ $t('advantage.title') }}</h1>
        <p class="text-gray-400">{{ $t('advantage.subtitle') }}</p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div v-for="(adv, i) in advantageItems" :key="i" class="advantage-card shadow-sm">
          <p class="advantage-card-title">{{ adv.title }}</p>
          <img :src="img('advantage1.png')" :alt="adv.title" class="w-full">
          <p class="advantage-card-desc">{{ adv.desc }}</p>
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8">
        <div v-for="(item, i) in summaryItems" :key="i" class="flex flex-col items-center">
          <div class="summary-card w-full">
            <img :src="img(`summary${i + 1}.png`)" :alt="item.title" class="h-16 object-contain">
            <p class="summary-title text-center">{{ item.title }}</p>
            <p class="text-sm text-center text-gray-700">{{ item.subtitle }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { resolvePath } = useResolveLocale()
const { img } = useSiteAsset()

const summaryKeys = ['team', 'tech', 'experience', 'results'] as const
const summaryItems = computed(() =>
  summaryKeys.map(key => ({
    title: t(`summary.${key}.title`),
    subtitle: t(`summary.${key}.subtitle`),
  })),
)

interface AdvantageItem {
  title: string
  desc: string
}

const advantageItems = computed(() => resolvePath<AdvantageItem[]>('advantage.items') ?? [])
</script>
