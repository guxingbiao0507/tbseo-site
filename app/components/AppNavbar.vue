<template>
  <header class="site-header">
    <div class="container-custom header-inner">
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

      <div class="header-right">
        <div class="header-lang" role="group" aria-label="Language">
          <NuxtLink
            :to="localeLink('en')"
            class="lang-link"
            :class="{ 'lang-link--active': locale === 'en' }"
            :aria-current="locale === 'en' ? 'page' : undefined"
          >
            EN
          </NuxtLink>
          <NuxtLink
            :to="localeLink('cn')"
            class="lang-link"
            :class="{ 'lang-link--active': locale === 'cn' }"
            :aria-current="locale === 'cn' ? 'page' : undefined"
          >
            CN
          </NuxtLink>
        </div>

        <button
          class="md:hidden p-2 nav-link shrink-0"
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
      </div>

      <div
        v-if="mobileOpen"
        class="header-mobile-menu md:hidden"
      >
        <NuxtLink :to="demoLink" class="nav-link py-2" @click="mobileOpen = false">{{ $t('nav.demo') }}</NuxtLink>
        <NuxtLink :to="localePath('/blog')" class="nav-link py-2" @click="mobileOpen = false">{{ $t('nav.blog') }}</NuxtLink>
        <NuxtLink :to="localePath('/about')" class="nav-link py-2" @click="mobileOpen = false">{{ $t('nav.about') }}</NuxtLink>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
const { locale } = useI18n()
const localePath = useAppLocalePath()
const { localeLink } = useLocaleSwitch()
const { img } = useSiteAsset()

const demoLink = computed(() => localePath({ path: '/', hash: '#demo' }))

const mobileOpen = ref(false)
</script>
