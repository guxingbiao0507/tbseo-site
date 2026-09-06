<script setup lang="ts">
const { user, logout: doLogout } = useAuth()
const route = useRoute()
const { t } = useI18n()
const site = useSite()
const localePath = useLocalePath()

const contentLinks = computed(() => [
  { label: t('admin.nav.dashboard'), icon: 'i-lucide-layout-dashboard', to: localePath('/admin') },
  { label: t('admin.nav.posts'), icon: 'i-lucide-file-text', to: localePath('/admin/posts') },
  { label: t('admin.nav.pages'), icon: 'i-lucide-files', to: localePath('/admin/pages') },
  { label: t('admin.nav.categories'), icon: 'i-lucide-folder-tree', to: localePath('/admin/categories') },
  { label: t('admin.nav.media'), icon: 'i-lucide-image', to: localePath('/admin/media') },
  { label: t('admin.nav.contacts'), icon: 'i-lucide-mail', to: localePath('/admin/contacts') },
])

const systemLinks = computed(() => [
  { label: t('admin.nav.users'), icon: 'i-lucide-users', to: localePath('/admin/users'), adminOnly: true as const },
  { label: t('admin.nav.seo'), icon: 'i-lucide-search', to: localePath('/admin/seo'), adminOnly: true as const },
  { label: t('admin.nav.email'), icon: 'i-lucide-mail-check', to: localePath('/admin/email'), adminOnly: true as const },
  { label: t('admin.nav.settings'), icon: 'i-lucide-settings', to: localePath('/admin/settings'), adminOnly: true as const },
  { label: t('admin.nav.translations'), icon: 'i-lucide-languages', to: localePath('/admin/translations'), adminOnly: true as const },
  { label: t('admin.nav.languages'), icon: 'i-lucide-globe', to: localePath('/admin/languages'), adminOnly: true as const },
])

type NavLink = { label: string; icon: string; to: string; adminOnly?: boolean }

function filterAdminLinks(items: NavLink[]) {
  return items.filter(l => !l.adminOnly || user.value?.role === 'admin')
}

const visibleSystemLinks = computed(() => filterAdminLinks(systemLinks.value))

function isActive(to: string) {
  const adminPath = localePath('/admin')
  return to === adminPath ? route.path === adminPath : route.path.startsWith(to)
}

async function logout() {
  await doLogout()
  await navigateTo(localePath('/admin/login'))
}
</script>

<template>
  <div class="admin-shell">
    <aside class="admin-sidebar">
      <div class="admin-brand">
        <img src="/images/logo1.png" alt="TailorBoost">
        <div>
          <span class="admin-brand-name">{{ site.name || 'TailorBoost' }}</span>
          <span class="admin-brand-sub">{{ t('admin.brandSubtitle') }}</span>
        </div>
      </div>

      <nav class="admin-nav">
        <div class="admin-nav-group">
          <p class="admin-nav-group-label">{{ t('admin.navGroup.content') }}</p>
          <NuxtLink
            v-for="link in contentLinks"
            :key="link.to"
            :to="link.to"
            class="admin-nav-link"
            :class="{ 'is-active': isActive(link.to) }"
          >
            <UIcon :name="link.icon" class="icon" />
            {{ link.label }}
          </NuxtLink>
        </div>

        <div v-if="visibleSystemLinks.length" class="admin-nav-group">
          <p class="admin-nav-group-label">{{ t('admin.navGroup.system') }}</p>
          <NuxtLink
            v-for="link in visibleSystemLinks"
            :key="link.to"
            :to="link.to"
            class="admin-nav-link"
            :class="{ 'is-active': isActive(link.to) }"
          >
            <UIcon :name="link.icon" class="icon" />
            {{ link.label }}
          </NuxtLink>
        </div>
      </nav>

      <div class="admin-sidebar-foot">
        <UButton
          :to="'/us'"
          target="_blank"
          icon="i-lucide-external-link"
          variant="soft"
          color="neutral"
          size="sm"
          block
          class="!text-slate-300 hover:!text-white"
        >
          {{ t('admin.nav.viewSite') }}
        </UButton>
      </div>
    </aside>

    <div class="admin-main">
      <header class="admin-topbar">
        <span class="admin-topbar-title">{{ t('admin.brandSubtitle') }}</span>
        <div class="admin-topbar-actions">
          <LanguageSwitcher />
          <UColorModeButton />
          <UDropdownMenu
            :items="[[
              { label: user?.name || '', type: 'label' },
              { label: t('admin.nav.logout'), icon: 'i-lucide-log-out', onSelect: logout },
            ]]"
          >
            <UButton variant="ghost" color="neutral" trailing-icon="i-lucide-chevron-down">
              <UAvatar :alt="user?.name" size="2xs" />
              <span class="hidden sm:inline">{{ user?.name }}</span>
            </UButton>
          </UDropdownMenu>
        </div>
      </header>

      <div class="admin-content">
        <slot />
      </div>
    </div>
  </div>
</template>
