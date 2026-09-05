<template>
  <header class="site-header">
    <div class="header-left">
      <NuxtLink :to="localePath('/')" aria-label="TailorBoost Home">
        <img :src="img('logo1.png')" alt="TailorBoost" class="h-[45px]">
      </NuxtLink>

      <NuxtLink :to="localePath('/')" class="nav-link hidden sm:inline">
        TailorBoost
      </NuxtLink>

      <nav class="header-mid hidden md:flex items-center gap-x-[50px]">
        <NuxtLink :to="demoLink" class="nav-link">{{ $t('nav.demo') }}</NuxtLink>
        <NuxtLink :to="localePath('/blog')" class="nav-link">{{ $t('nav.blog') }}</NuxtLink>
        <NuxtLink :to="localePath('/about')" class="nav-link">{{ $t('nav.about') }}</NuxtLink>
      </nav>
    </div>

    <NuxtLink
      :to="switchLocalePath(locale === 'cn' ? 'en' : 'cn')"
      class="btn-primary shrink-0"
    >
      {{ locale === 'cn' ? $t('nav.english') : $t('nav.chinese') }}
    </NuxtLink>

    <button
      class="md:hidden p-2 nav-link ml-2 shrink-0"
      aria-label="Menu"
      @click="mobileOpen = !mobileOpen"
    >
      <svg v-if="!mobileOpen" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
      <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>

    <div
      v-if="mobileOpen"
      class="absolute top-full left-0 right-0 bg-white shadow-lg md:hidden py-4 px-6 flex flex-col gap-3 border-t border-gray-100"
    >
      <NuxtLink :to="demoLink" class="nav-link py-2" @click="mobileOpen = false">{{ $t('nav.demo') }}</NuxtLink>
      <NuxtLink :to="localePath('/blog')" class="nav-link py-2" @click="mobileOpen = false">{{ $t('nav.blog') }}</NuxtLink>
      <NuxtLink :to="localePath('/about')" class="nav-link py-2" @click="mobileOpen = false">{{ $t('nav.about') }}</NuxtLink>
    </div>
  </header>
</template>

<script setup lang="ts">
const { locale } = useI18n()
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()
const { img } = useSiteAsset()

const demoLink = computed(() => localePath({ path: '/', hash: '#demo' }))

const mobileOpen = ref(false)
</script>
