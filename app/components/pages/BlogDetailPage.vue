<template>
  <div v-if="pending" class="blog-detail-loading">
    <div class="loading-spinner" />
    <p>{{ $t('blog.loading') }}</p>
  </div>

  <div v-else-if="post" class="blog-detail-page">
    <div class="blog-detail-header">
      <div class="container-custom">
        <nav class="blog-detail-breadcrumb">
          <NuxtLink :to="localePath('/')">{{ $t('blog.home') }}</NuxtLink>
          <span>/</span>
          <NuxtLink :to="localePath('/blog')">{{ $t('nav.blog') }}</NuxtLink>
        </nav>
        <h1 class="blog-detail-title">{{ post.title }}</h1>
        <time class="blog-detail-date">{{ formatDate(post.publishedAt) }}</time>
      </div>
    </div>

    <article class="blog-detail-body">
      <div class="container-custom blog-detail-inner">
        <img
          v-if="post.coverImage"
          :src="post.coverImage"
          :alt="post.title"
          class="blog-detail-cover"
        >

        <div class="blog-prose" v-html="normalizeContent(post.content)" />

        <div class="blog-detail-back">
          <NuxtLink :to="localePath('/blog')" class="blog-detail-back-link">
            ← {{ $t('nav.blog') }}
          </NuxtLink>
        </div>

        <div class="blog-nav">
          <NuxtLink
            v-if="prev"
            :to="blogPostLink(prev.slug)"
            class="blog-nav-item"
          >
            <span class="blog-nav-label">← {{ $t('blog.prev') }}</span>
            <span class="blog-nav-title">{{ prev.title }}</span>
          </NuxtLink>
          <div v-else />
          <NuxtLink
            v-if="next"
            :to="blogPostLink(next.slug)"
            class="blog-nav-item blog-nav-item--next"
          >
            <span class="blog-nav-label">{{ $t('blog.next') }} →</span>
            <span class="blog-nav-title">{{ next.title }}</span>
          </NuxtLink>
        </div>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import { normalizeContent } from '~/composables/normalizeContent'

const route = useRoute()
const { locale, t } = useI18n()
const localePath = useLocalePath()

const slug = computed(() => decodeURIComponent(String(route.params.slug ?? '')))

interface BlogPost {
  id: number
  title: string
  slug: string
  excerpt?: string
  content: string
  coverImage?: string
  tags?: string
  publishedAt?: number | string
  categoryName?: string
  authorName?: string
  metaDescription?: string
  ogImage?: string
}

const fetchKey = computed(() => `blog-post:${locale.value}:${slug.value}`)

const { data: post, error, pending } = await useFetch<BlogPost>(
  () => `/api/public/posts/${encodeURIComponent(slug.value)}`,
  {
    query: () => ({ locale: locale.value }),
    key: fetchKey,
    watch: [locale, slug],
  },
)

if (error.value || !post.value) {
  throw createError({ statusCode: 404, statusMessage: 'Post not found', fatal: true })
}

const { data: allPosts } = await useFetch<{ items: BlogPost[] }>(
  () => '/api/public/posts',
  {
    query: () => ({ locale: locale.value, limit: 50 }),
    key: computed(() => `blog-list:${locale.value}`),
    watch: [locale],
    default: () => ({ items: [] }),
  },
)

const currentIdx = computed(() =>
  (allPosts.value?.items ?? []).findIndex(p => p.slug === slug.value),
)

const prev = computed(() => {
  const items = allPosts.value?.items ?? []
  const idx = currentIdx.value
  return idx > 0 ? items[idx - 1] : null
})

const next = computed(() => {
  const items = allPosts.value?.items ?? []
  const idx = currentIdx.value
  return idx >= 0 && idx < items.length - 1 ? items[idx + 1] : null
})

function blogPostLink(postSlug: string) {
  return localePath(`/blog/${encodeURIComponent(postSlug)}`)
}

function formatDate(value?: number | string | null) {
  if (!value) return ''
  return new Date(value).toLocaleDateString(locale.value === 'cn' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

useHead({
  title: () => post.value?.title || t('nav.blog'),
})

useSeoMeta({
  description: () => post.value?.metaDescription || post.value?.excerpt,
  ogTitle: () => post.value?.title,
  ogDescription: () => post.value?.metaDescription || post.value?.excerpt,
  ogImage: () => post.value?.ogImage || post.value?.coverImage,
  ogType: 'article',
})
</script>
