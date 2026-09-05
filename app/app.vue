<script setup lang="ts">
const { locale } = useI18n()

const htmlLang = computed(() => {
  const map: Record<string, string> = { en: 'en-US', cn: 'zh-CN' }
  return map[locale.value] || 'en-US'
})

useHead(() => ({
  htmlAttrs: { lang: htmlLang.value },
  meta: [
    { name: 'google-site-verification', content: 'vTlCwi7aR1KIiK_bYP-lBwWIspwnONuIMKB2OFnpLDY' },
  ],
  link: [
    { rel: 'icon', type: 'image/png', href: '/images/logo1.png', key: 'favicon' },
    { rel: 'apple-touch-icon', href: '/images/logo1.png', key: 'apple-touch-icon' },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'TailorBoost',
        url: 'https://tailorboost.com',
        description: locale.value === 'cn'
          ? 'TailorBoost – 您值得信赖的出海增长伙伴，15+年SEO优化经验'
          : 'TailorBoost – Your Trusted Partner for International Expansion, 15+ years SEO experience',
        contactPoint: [
          { '@type': 'ContactPoint', email: 'tailorboost@outlook.com', contactType: 'sales' },
          { '@type': 'ContactPoint', email: 'tailorboost@gmail.com', contactType: 'customer service' },
        ],
      }),
    },
    {
      key: 'clarity',
      innerHTML: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","rrkm4zjn1o");`,
    },
  ],
}))
</script>

<template>
  <UApp>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
