<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const route = useRoute()
const { t, setLocale } = useI18n()
const localePath = useLocalePath()

if (route.path.startsWith('/cn')) {
  setLocale('cn')
}

const is404 = computed(() => props.error?.statusCode === 404)
const countdown = ref(10)
let timer: ReturnType<typeof setInterval> | null = null

function clearTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

async function goHome() {
  clearTimer()
  await clearError({ redirect: localePath('/') })
}

onMounted(() => {
  if (!is404.value) return
  timer = setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) goHome()
  }, 1000)
})

onUnmounted(clearTimer)

useHead({
  title: () => (is404.value ? t('notFound.title') : t('notFound.genericTitle')),
})
</script>

<template>
  <div class="not-found-main">
    <div class="container-custom not-found-inner">
      <p class="not-found-code">{{ is404 ? '404' : error.statusCode }}</p>
      <h1 class="not-found-heading">
        {{ is404 ? $t('notFound.heading') : $t('notFound.genericHeading') }}
      </h1>
      <p class="not-found-desc">
        <template v-if="is404">
          {{ $t('notFound.desc', { seconds: countdown }) }}
        </template>
        <template v-else>
          {{ $t('notFound.genericDesc') }}
        </template>
      </p>
      <button type="button" class="not-found-btn" @click="goHome">
        {{ $t('notFound.goHome') }}
      </button>
    </div>
  </div>
</template>
