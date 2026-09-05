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
</script>

<template>
  <div class="admin-login-page">
    <div class="admin-login-brand">
      <img src="/images/logo1.png" alt="TailorBoost">
      <h1>{{ site.name || 'TailorBoost' }}</h1>
      <p>{{ t('admin.login.brandDesc') }}</p>
    </div>

    <div class="admin-login-form-wrap">
      <div class="admin-login-card">
        <div class="admin-login-card-header">
          <h2>{{ t('admin.login.title') }}</h2>
          <p>{{ t('admin.login.subtitle') }}</p>
        </div>

        <form class="space-y-4" @submit.prevent="onSubmit">
          <UFormField :label="t('admin.login.email')" name="email" required>
            <UInput
              v-model="state.email"
              type="email"
              autocomplete="username"
              placeholder="admin@tailorboost.com"
              class="w-full"
              size="lg"
            />
          </UFormField>
          <UFormField :label="t('admin.login.password')" name="password" required>
            <UInput
              v-model="state.password"
              type="password"
              autocomplete="current-password"
              class="w-full"
              size="lg"
            />
          </UFormField>
          <label class="admin-verify-box">
            <input
              v-model="verified"
              type="checkbox"
              class="w-5 h-5 rounded border-2 border-gray-300 accent-primary"
            >
            <span class="text-sm text-gray-600 dark:text-gray-300">
              {{ t('admin.login.verifyLabel') }}
            </span>
          </label>
          <UButton
            type="submit"
            block
            size="lg"
            :loading="loading"
            :disabled="!verified"
            icon="i-lucide-log-in"
          >
            {{ t('admin.login.submit') }}
          </UButton>
        </form>

        <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <UButton
            :to="localePath('/')"
            variant="link"
            color="neutral"
            size="sm"
            icon="i-lucide-arrow-left"
          >
            {{ t('common.backToHome') }}
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
