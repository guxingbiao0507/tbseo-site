<template>
  <div id="demo" class="section-padding pt-32">
    <div class="container-custom max-w-[1280px]">
      <div class="text-center mb-12">
        <h1 class="text-3xl md:text-4xl font-bold mb-4">{{ $t('nav.demo') }}</h1>
        <p class="text-gray-500 max-w-3xl mx-auto">{{ $t('demo.subtitle') }}</p>
      </div>
      <div class="flex flex-col gap-8">
        <div
          v-for="(c, i) in demoCases"
          :key="i"
          class="demo-item flex flex-col items-center gap-4"
        >
          <p class="demo-item-title">{{ c.title }}</p>
          <p class="demo-item-description whitespace-pre-line">{{ c.desc }}</p>
          <p class="demo-meta">🔹 {{ c.period }}</p>
          <p class="demo-meta">🔹 {{ c.goal }}</p>
          <p class="demo-meta">🔹 {{ c.result }}</p>
          <img :src="img(`demo${i + 1}.png`)" :alt="c.title" class="w-full rounded-lg">
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { resolvePath } = useResolveLocale()
const { img } = useSiteAsset()

interface DemoCase {
  title: string
  desc: string
  period: string
  goal: string
  result: string
}

const demoCases = computed(() => resolvePath<DemoCase[]>('demo.cases') ?? [])
</script>
