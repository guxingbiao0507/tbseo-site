<template>
  <div class="blog-page">
    <div class="blog-header">
      <div
        class="blog-header-inner"
        :style="{ backgroundImage: `url(${img('blog-header.png')})` }"
      >
        <p class="blog-header-title">{{ $t('blog.title') }}</p>
        <p class="blog-header-sub">{{ $t('blog.subtitle') }}</p>
      </div>
    </div>

    <div class="blog-list-wrap">
      <div v-if="pending" class="blog-loading">
        <div class="loading-spinner" />
        <p>{{ $t('blog.loading') }}</p>
      </div>

      <div v-else-if="posts.length" class="blog-list">
        <article v-for="post in posts" :key="post.id" class="blog-item">
          <NuxtLink :to="blogPostLink(post.slug)">
            <img
              v-if="post.coverImage"
              class="blog-item-img"
              :src="asset(post.coverImage)"
              :alt="post.title"
            >
            <div v-else class="blog-item-img blog-item-img--placeholder" />
          </NuxtLink>

          <section class="blog-item-body">
            <p class="blog-item-title">
              <NuxtLink :to="blogPostLink(post.slug)">
                {{ post.title }}
              </NuxtLink>
            </p>
            <div v-if="post.excerpt" class="blog-item-des">
              {{ post.excerpt }}
            </div>
          </section>

          <div class="blog-item-date">
            {{ formatDate(post.publishedAt) }}
          </div>
        </article>
      </div>

      <div v-else class="blog-empty">
        <p>{{ $t('blog.empty') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { locale, t } = useI18n()
const localePath = useLocalePath()
const { img, asset } = useSiteAsset()

interface BlogPost {
  id: number
  title: string
  slug: string
  excerpt?: string
  coverImage?: string
  publishedAt?: number | string
}

const { data, pending } = await useFetch<{ items: BlogPost[] }>('/api/public/posts', {
  query: computed(() => ({ locale: locale.value, limit: 50 })),
  watch: [locale],
  default: () => ({ items: [] }),
})

const posts = computed(() => data.value?.items ?? [])

function blogPostLink(slug: string) {
  return localePath(`/blog/${encodeURIComponent(slug)}`)
}

function formatDate(value?: number | string | null) {
  if (!value) return ''
  return new Date(value).toLocaleDateString(locale.value === 'cn' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

useHead({ title: t('nav.blog') })
</script>
