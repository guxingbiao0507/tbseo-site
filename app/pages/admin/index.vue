<script setup lang="ts">
definePageMeta({ layout: 'admin', i18n: { defaultLocale: 'cn' } })

const { t } = useI18n()
const localePath = useLocalePath()
const { user } = useAuth()
const { data: stats } = await useFetch('/api/admin/stats')

const cards = computed(() => [
  { label: t('admin.posts'), value: stats.value?.counts.posts ?? 0, icon: 'i-lucide-file-text', to: localePath('/admin/posts'), bg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400' },
  { label: t('admin.pages'), value: stats.value?.counts.pages ?? 0, icon: 'i-lucide-files', to: localePath('/admin/pages'), bg: 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400' },
  { label: t('admin.published'), value: stats.value?.counts.published ?? 0, icon: 'i-lucide-check-circle', to: localePath('/admin/posts'), bg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' },
  { label: t('admin.drafts'), value: stats.value?.counts.drafts ?? 0, icon: 'i-lucide-pencil', to: localePath('/admin/posts'), bg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400' },
  { label: t('admin.categories'), value: stats.value?.counts.categories ?? 0, icon: 'i-lucide-folder-tree', to: localePath('/admin/categories'), bg: 'bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400' },
  { label: t('admin.media'), value: stats.value?.counts.media ?? 0, icon: 'i-lucide-image', to: localePath('/admin/media'), bg: 'bg-pink-50 text-pink-600 dark:bg-pink-950/40 dark:text-pink-400' },
])

function formatDate(value?: number | string | null) {
  if (!value) return ''
  return new Date(value).toLocaleString()
}
</script>

<template>
  <div>
    <div class="admin-page-header">
      <div>
        <h1>{{ t('admin.dashboard') }}</h1>
        <p>{{ t('admin.welcome', { name: user?.name || '' }) }}</p>
      </div>
      <UButton :to="localePath('/admin/posts/new')" icon="i-lucide-plus" size="lg">
        {{ t('admin.writePost') }}
      </UButton>
    </div>

    <div class="admin-stat-grid">
      <NuxtLink
        v-for="card in cards"
        :key="card.label"
        :to="card.to"
        class="admin-stat-card"
      >
        <span class="admin-stat-icon" :class="card.bg">
          <UIcon :name="card.icon" />
        </span>
        <div class="admin-stat-value">{{ card.value }}</div>
        <div class="admin-stat-label">{{ card.label }}</div>
      </NuxtLink>
    </div>

    <div class="admin-panel">
      <div class="admin-panel-header">
        {{ t('admin.recentUpdates') }}
      </div>
      <div class="admin-panel-body">
        <template v-if="stats?.recent?.length">
          <NuxtLink
            v-for="item in stats.recent"
            :key="item.id"
            :to="item.type === 'page' ? localePath(`/admin/pages/${item.id}`) : localePath(`/admin/posts/${item.id}`)"
            class="admin-recent-row"
          >
            <div class="admin-recent-title">
              <UIcon :name="item.type === 'page' ? 'i-lucide-files' : 'i-lucide-file-text'" class="text-gray-400 shrink-0" />
              <span>{{ item.title }}</span>
              <UBadge :color="item.status === 'published' ? 'success' : 'neutral'" variant="subtle" size="sm">
                {{ item.status === 'published' ? t('admin.published') : t('admin.drafts') }}
              </UBadge>
            </div>
            <span class="admin-recent-date">{{ formatDate(item.updatedAt) }}</span>
          </NuxtLink>
        </template>
        <p v-else class="py-6 text-sm text-gray-500">
          {{ t('admin.noContent') }}
        </p>
      </div>
    </div>
  </div>
</template>
