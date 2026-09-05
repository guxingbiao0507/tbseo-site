<template>
  <div>
    <!-- Hero -->
    <section
      class="content-header"
      :style="{ backgroundImage: `url(${img('cloud.png')})` }"
    >
      <div class="container-custom content-header-inner">
        <div class="content-header-left">
          {{ $t('hero.line1') }}
        </div>
        <div class="content-header-spacer" />
        <div class="content-header-right">
          {{ $t('hero.line2') }}
        </div>
      </div>
    </section>

    <!-- Summary -->
    <section class="summary-section">
      <div class="container-custom">
        <div class="summary-grid">
          <div v-for="(item, i) in summaryItems" :key="i" class="summary-item">
            <div class="summary-card">
              <img :src="img(`summary${i + 1}.png`)" :alt="item.title">
              <p class="summary-title">{{ item.title }}</p>
              <p class="summary-subtitle">{{ item.subtitle }}</p>
            </div>
            <p class="summary-des">
              <template v-for="(line, j) in item.items" :key="j">
                • {{ line }}<br v-if="j < item.items.length - 1">
              </template>
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Feature / Implementation Results -->
    <section
      class="feature-section feature-section--column"
      :style="{ backgroundImage: `url(${img('feature-bg.png')})` }"
    >
      <div class="container-custom feature-section-inner">
        <div class="feature-left">
          <p class="feature-title-1">{{ $t('feature.title') }}</p>
          <p class="feature-title-2">{{ $t('feature.subtitle') }}</p>
          <img :src="img('logo2.png')" alt="TailorBoost" class="feature-img">
        </div>
        <div class="feature-right">
          <div v-for="feat in featureItems" :key="feat.title" class="feature-item">
            <i class="bi bi-award-fill feature-item-icon" />
            <p class="feature-item-title">{{ feat.title }}</p>
            <p class="feature-item-des">
              <template v-for="(line, j) in feat.items" :key="j">
                ✅ {{ line }}<br v-if="j < feat.items.length - 1">
              </template>
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Demo / Case Studies -->
    <section id="demo" class="demo-section">
      <div class="container-custom">
        <div class="demo-intro">
          <p class="demo-title1">{{ $t('demo.title') }}</p>
          <p class="demo-title2">{{ $t('demo.subtitle') }}</p>
          <p class="demo-title3">{{ $t('demo.desc') }}</p>
        </div>
      </div>
      <div class="demo-scroll-wrap">
        <div class="demo-scroll-inner">
          <div
            v-for="(c, i) in demoCases"
            :key="i"
            class="demo-item"
          >
            <p class="demo-item-title">{{ c.title }}</p>
            <p class="demo-item-description whitespace-pre-line">{{ c.desc }}</p>
            <p class="demo-item-meta">🔹 {{ c.period }}</p>
            <p class="demo-item-meta">🔹 {{ c.goal }}</p>
            <p class="demo-item-meta">🔹 {{ c.result }}</p>
            <img :src="img(`demo${i + 1}.png`)" :alt="c.title">
          </div>
        </div>
      </div>
    </section>

    <!-- Advantages -->
    <section
      class="advantage-section"
      :style="{ backgroundImage: `url(${img('advandge-bg.png')})` }"
    >
      <div class="container-custom">
        <div class="advantage-header">
          <p class="advantage-header-title">{{ $t('advantage.title') }}</p>
          <p class="advantage-header-sub">{{ $t('advantage.subtitle') }}</p>
        </div>
        <div class="advantage-grid">
          <div v-for="(adv, i) in advantageItems" :key="i" class="advantage-card">
            <p class="advantage-card-title">{{ adv.title }}</p>
            <img :src="img('advantage1.png')" :alt="adv.title">
            <p class="advantage-card-desc">{{ adv.desc }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { resolvePath } = useResolveLocale()
const { img } = useSiteAsset()

const summaryKeys = ['team', 'tech', 'experience', 'results'] as const

const summaryItems = computed(() =>
  summaryKeys.map((key) => ({
    title: t(`summary.${key}.title`),
    subtitle: t(`summary.${key}.subtitle`),
    items: resolvePath<string[]>(`summary.${key}.items`) ?? [],
  })),
)

const featureKeys = ['seo', 'website', 'security', 'growth'] as const

const featureItems = computed(() =>
  featureKeys.map((key) => ({
    title: t(`feature.${key}.title`),
    items: resolvePath<string[]>(`feature.${key}.items`) ?? [],
  })),
)

interface DemoCase {
  title: string
  desc: string
  period: string
  goal: string
  result: string
}

const demoCases = computed(() => resolvePath<DemoCase[]>('demo.cases') ?? [])

interface AdvantageItem {
  title: string
  desc: string
}

const advantageItems = computed(() => resolvePath<AdvantageItem[]>('advantage.items') ?? [])
</script>
