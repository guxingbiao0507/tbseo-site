import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineNuxtConfig({
  extends: ['nuxtcms'],

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || 'https://tailorboost.com',
    name: 'TailorBoost',
  },

  sitemap: {
    sitemaps: {
      en: {
        sources: ['/api/__sitemap__/urls'],
        include: ['/**'],
        exclude: ['/cn/**', '/admin/**', '/setup', '/api/**', '/my/**', '/th/**'],
      },
      cn: {
        sources: ['/api/__sitemap__/urls'],
        include: ['/cn/**'],
      },
    },
  },

  i18n: {
    strategy: 'prefix_except_default',
    defaultLocale: 'en',
    lazy: false,
    langDir: 'locales',
    locales: [
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
      { code: 'cn', language: 'zh-CN', name: '简体中文', file: 'cn.json' },
    ],
    customRoutes: 'config',
    pages: {
      index: { en: '/', cn: '/cn' },
      about: { en: '/about', cn: '/cn/about' },
      blog: { en: '/blog', cn: '/cn/blog' },
      'blog/[slug]': { en: '/blog/[slug]', cn: '/cn/blog/[slug]' },
      cases: { en: '/cases', cn: '/cn/cases' },
      services: { en: '/services', cn: '/cn/services' },
      contact: { en: '/contact', cn: '/cn/contact' },
    },
  },

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      titleTemplate: '%s | TailorBoost',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'TailorBoost – Your Trusted Partner for International Expansion. Professional SEO optimization, website development, and security protection with 15+ years of experience.' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css' },
      ],
    },
  },

  nitro: {
    alias: process.env.NITRO_PRESET === 'cloudflare_pages'
      ? { 'better-sqlite3': resolve(__dirname, 'server/utils/better-sqlite3-stub') }
      : {},
  },

  routeRules: {
    '/api/public/posts': { cache: false },
    '/api/public/posts/**': { cache: false },
    '/**': {
      headers: {
        'Content-Security-Policy': [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://www.clarity.ms https://ssl.bing.com https://cdn.jsdelivr.net",
          "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com",
          "font-src 'self' data: https://cdn.jsdelivr.net https://fonts.gstatic.com",
          "img-src 'self' data: blob: https:",
          "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://www.clarity.ms https://c.clarity.ms https://cdn.jsdelivr.net",
          "worker-src 'self' blob:",
          "frame-ancestors 'none'",
        ].join('; '),
      },
    },
  },
})
