<script setup lang="ts">
definePageMeta({ layout: false, i18n: { defaultLocale: 'cn' } })

const localePath = useLocalePath()
const route = useRoute()
const toast = useToast()
const { t } = useI18n()
const site = useSite()
const loading = ref(false)
const verified = ref(false)
const state = reactive({ email: '', password: '' })

const features = computed(() => [
  { icon: 'i-lucide-file-text', text: t('admin.login.feature1') },
  { icon: 'i-lucide-image', text: t('admin.login.feature2') },
  { icon: 'i-lucide-shield-check', text: t('admin.login.feature3') },
])

async function onSubmit() {
  if (!verified.value) {
    toast.add({
      title: t('admin.login.failed'),
      description: t('admin.login.verifyRequired'),
      color: 'warning',
    })
    return
  }

  loading.value = true
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        email: state.email,
        password: state.password,
      },
    })

    const redirect = (route.query.redirect as string) || ''
    const localePrefix = localePath('/')
    const target = redirect.startsWith(localePrefix) ? redirect : localePath('/admin')
    await navigateTo(target)
  }
  catch (err: any) {
    const status = err?.statusCode || err?.data?.statusCode
    let desc = err?.data?.statusMessage || err?.message || ''
    if (status === 401) desc = t('admin.login.invalidCredentials')
    else if (status === 429) desc = t('admin.login.tooManyAttempts')
    else if (!desc) desc = t('admin.login.networkError')
    toast.add({ title: t('admin.login.failed'), description: desc, color: 'error' })
    verified.value = false
  }
  finally {
    loading.value = false
  }
}

useHead({ title: () => t('admin.login.title') })
</script>

<template>
  <div class="admin-login-page">
    <aside class="admin-login-brand">
      <div class="admin-login-brand-glow admin-login-brand-glow--1" />
      <div class="admin-login-brand-glow admin-login-brand-glow--2" />
      <div class="admin-login-brand-content">
        <img src="/images/logo1.png" alt="TailorBoost" class="admin-login-brand-logo">
        <h1>{{ site.name || 'TailorBoost' }}</h1>
        <p>{{ t('admin.login.brandDesc') }}</p>
        <ul class="admin-login-features">
          <li v-for="(item, i) in features" :key="i">
            <span class="admin-login-feature-icon">
              <UIcon :name="item.icon" />
            </span>
            {{ item.text }}
          </li>
        </ul>
      </div>
    </aside>

    <main class="admin-login-form-wrap">
      <div class="admin-login-toolbar">
        <NuxtLink :to="localePath('/')" class="admin-login-home-link">
          <UIcon name="i-lucide-arrow-left" />
          {{ t('common.backToHome') }}
        </NuxtLink>
        <div class="admin-login-toolbar-actions">
          <LanguageSwitcher />
          <UColorModeButton />
        </div>
      </div>

      <div class="admin-login-card">
        <div class="admin-login-card-badge">
          <img src="/images/logo1.png" alt="">
        </div>
        <div class="admin-login-card-header">
          <h2>{{ t('admin.login.title') }}</h2>
          <p>{{ t('admin.login.subtitle') }}</p>
        </div>

        <form class="admin-login-form" @submit.prevent="onSubmit">
          <UFormField :label="t('admin.login.email')" name="email" required>
            <UInput
              v-model="state.email"
              type="email"
              autocomplete="username"
              placeholder="admin@tailorboost.com"
              icon="i-lucide-mail"
              class="w-full"
              size="lg"
            />
          </UFormField>
          <UFormField :label="t('admin.login.password')" name="password" required>
            <UInput
              v-model="state.password"
              type="password"
              autocomplete="current-password"
              icon="i-lucide-lock"
              class="w-full"
              size="lg"
            />
          </UFormField>

          <label class="admin-verify-box" :class="{ 'is-checked': verified }">
            <input v-model="verified" type="checkbox" class="admin-verify-checkbox">
            <UIcon name="i-lucide-shield-check" class="admin-verify-icon" />
            <span>{{ t('admin.login.verifyLabel') }}</span>
          </label>

          <UButton
            type="submit"
            block
            size="xl"
            :loading="loading"
            :disabled="!verified"
            icon="i-lucide-log-in"
            class="admin-login-submit"
          >
            {{ t('admin.login.submit') }}
          </UButton>
        </form>
      </div>

      <p class="admin-login-footer">
        {{ t('footer.copyright') }}
      </p>
    </main>
  </div>
</template>
