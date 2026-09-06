import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** Cloudflare Pages build — stub native sqlite (D1 at runtime). */
const isCloudflareBuild =
  process.env.NITRO_PRESET === 'cloudflare_pages' || process.env.CF_PAGES === '1'

export default defineNuxtConfig({
  extends: ['nuxtcms'],

  hooks: {
    'config:resolved'(config) {
      const sitemaps = config.sitemap?.sitemaps as Record<string, { sources?: string[] }> | undefined
      if (!sitemaps) return
      if (sitemaps.en) sitemaps.en.sources = ['/api/__sitemap__/en']
      if (sitemaps.cn) sitemaps.cn.sources = ['/api/__sitemap__/cn']
    },
  },

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || 'https://tailorboost.com',
    name: 'TailorBoost',
  },

  sitemap: {
    autoLastmod: true,
    autoI18n: false,
    excludeAppSources: true,
    sitemaps: {
      en: {
        sources: ['/api/__sitemap__/en'],
        include: ['/us/**'],
        exclude: ['/cn/**', '/admin/**', '/setup', '/api/**', '/my/**', '/th/**', '/docs/**', '/products/**'],
      },
      cn: {
        sources: ['/api/__sitemap__/cn'],
        include: ['/cn/**'],
        exclude: ['/cn/admin/**', '/cn/setup/**', '/cn/docs/**', '/cn/products/**'],
      },
    },
  },

  i18n: {
    strategy: 'no_prefix',
    defaultLocale: 'en',
    lazy: false,
    langDir: 'locales',
    locales: [
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
      { code: 'cn', language: 'zh-CN', name: '简体中文', file: 'cn.json' },
    ],
  },

  css: ['~/assets/css/main.css', '~/assets/css/admin.css'],

  colorMode: {
    preference: 'light',
    fallback: 'light',
  },

  app: {
    head: {
      titleTemplate: '%s | TailorBoost',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'TailorBoost – Your Trusted Partner for International Expansion. Professional SEO optimization, website development, and security protection with 15+ years of experience.' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/images/logo1.png' },
        { rel: 'apple-touch-icon', href: '/images/logo1.png' },
        { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css' },
      ],
    },
  },

  nitro: {
    preset: isCloudflareBuild ? 'cloudflare_pages' : undefined,
    alias: isCloudflareBuild
      ? { 'better-sqlite3': resolve(__dirname, 'server/utils/better-sqlite3-stub') }
      : {},
  },

  runtimeConfig: {
    public: {
      /** Set NUXT_PUBLIC_USE_R2_MEDIA=true in production to serve images via /api/media/ */
      useR2Media: process.env.NUXT_PUBLIC_USE_R2_MEDIA === 'true',
    },
  },

  routeRules: {
    '/api/public/posts': { cache: false },
    '/api/public/posts/**': { cache: false },
    '/api/__sitemap__/**': { cache: { maxAge: 300, swr: true } },
    '/__sitemap__/**': { cache: { maxAge: 300, swr: true } },
    '/sitemap_index.xml': { cache: { maxAge: 300, swr: true } },
    '/sitemap.xml': { redirect: { to: '/sitemap_index.xml', statusCode: 301 } },
    '/sitemap_en.xml': { redirect: { to: '/__sitemap__/en.xml', statusCode: 301 } },
    '/sitemap_cn.xml': { redirect: { to: '/__sitemap__/cn.xml', statusCode: 301 } },
    '/en/sitemap.xml': { redirect: { to: '/__sitemap__/en.xml', statusCode: 301 } },
    '/cn/sitemap.xml': { redirect: { to: '/__sitemap__/cn.xml', statusCode: 301 } },
    '/images/**': {
      headers: { 'cache-control': 'public, max-age=31536000, immutable' },
    },
    '/uploads/**': {
      headers: { 'cache-control': 'public, max-age=31536000, immutable' },
    },
    '/favicon.ico': { redirect: { to: '/images/logo1.png', statusCode: 301 } },
    '/favicon.svg': { redirect: { to: '/images/logo1.png', statusCode: 301 } },
    '/favicon.png': { redirect: { to: '/images/logo1.png', statusCode: 301 } },
    '/**': {
      headers: {
        'Content-Security-Policy': [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://www.clarity.ms https://ssl.bing.com https://cdn.jsdelivr.net",
          "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com",
          "font-src 'self' data: https://cdn.jsdelivr.net https://fonts.gstatic.com",
          "img-src 'self' data: blob: https:",
          "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://www.clarity.ms https://c.clarity.ms https://cdn.jsdelivr.net",
          "worker-src 'self' blob:",
          "frame-ancestors 'none'",
        ].join('; '),
      },
    },
  },
})
