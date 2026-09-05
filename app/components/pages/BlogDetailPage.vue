<template>
  <div v-if="pending" class="blog-detail-loading">
    <div class="loading-spinner" />
    <p>{{ $t('blog.loading') }}</p>
  </div>

  <div v-else-if="post" class="blog-detail-page">
    <header class="blog-detail-header">
      <div class="container-custom blog-detail-header-inner">
        <nav class="blog-detail-breadcrumb" aria-label="Breadcrumb">
          <NuxtLink :to="localePath('/')">{{ $t('blog.home') }}</NuxtLink>
          <span aria-hidden="true">/</span>
          <NuxtLink :to="localePath('/blog')">{{ $t('nav.blog') }}</NuxtLink>
        </nav>
        <h1 class="blog-detail-title">{{ post.title }}</h1>
        <div class="blog-detail-meta">
          <time class="blog-detail-date" :datetime="publishedIso">{{ formatDate(post.publishedAt) }}</time>
        </div>
      </div>
    </header>

    <article class="blog-detail-body">
      <div class="container-custom">
        <div class="blog-detail-layout">
          <div class="blog-detail-main">
            <img
              v-if="post.coverImage"
              :src="asset(post.coverImage)"
              :alt="post.title"
              class="blog-detail-cover"
            >

            <div class="blog-prose" v-html="normalizeContent(post.content)" />

            <div class="blog-detail-back">
              <NuxtLink :to="localePath('/blog')" class="blog-detail-back-link">
                ← {{ $t('nav.blog') }}
              </NuxtLink>
            </div>

            <nav v-if="prev || next" class="blog-nav" aria-label="Post navigation">
              <NuxtLink
                v-if="prev"
                :to="blogPostLink(prev.slug)"
                class="blog-nav-item"
              >
                <span class="blog-nav-label">← {{ $t('blog.prev') }}</span>
                <span class="blog-nav-title">{{ prev.title }}</span>
              </NuxtLink>
              <div v-else class="blog-nav-spacer" />
              <NuxtLink
                v-if="next"
                :to="blogPostLink(next.slug)"
                class="blog-nav-item blog-nav-item--next"
              >
                <span class="blog-nav-label">{{ $t('blog.next') }} →</span>
                <span class="blog-nav-title">{{ next.title }}</span>
              </NuxtLink>
            </nav>
          </div>

          <aside class="blog-detail-sidebar">
            <div class="blog-detail-sidebar-card">
              <NuxtLink :to="localePath('/blog')" class="blog-sidebar-link">
                ← {{ $t('nav.blog') }}
              </NuxtLink>
              <p class="blog-sidebar-label">{{ $t('blog.published') }}</p>
              <time class="blog-sidebar-date" :datetime="publishedIso">{{ formatDate(post.publishedAt) }}</time>
            </div>
            <div v-if="prev || next" class="blog-detail-sidebar-card">
              <p class="blog-sidebar-label">{{ $t('blog.morePosts') }}</p>
              <NuxtLink
                v-if="prev"
                :to="blogPostLink(prev.slug)"
                class="blog-sidebar-post"
              >
                <span class="blog-sidebar-post-dir">← {{ $t('blog.prev') }}</span>
                <span class="blog-sidebar-post-title">{{ prev.title }}</span>
              </NuxtLink>
              <NuxtLink
                v-if="next"
                :to="blogPostLink(next.slug)"
                class="blog-sidebar-post"
              >
                <span class="blog-sidebar-post-dir">{{ $t('blog.next') }} →</span>
                <span class="blog-sidebar-post-title">{{ next.title }}</span>
              </NuxtLink>
            </div>
          </aside>
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
const { asset } = useSiteAsset()

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

const publishedIso = computed(() => {
  const v = post.value?.publishedAt
  if (!v) return undefined
  return new Date(v).toISOString()
})

useHead({
  title: () => post.value?.title || t('nav.blog'),
})

useSeoMeta({
  description: () => post.value?.metaDescription || post.value?.excerpt,
  ogTitle: () => post.value?.title,
  ogDescription: () => post.value?.metaDescription || post.value?.excerpt,
  ogImage: () => {
    const img = post.value?.ogImage || post.value?.coverImage
    return img ? asset(img) : undefined
  },
  ogType: 'article',
})
</script>
