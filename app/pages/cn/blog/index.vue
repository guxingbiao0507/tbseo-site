<template>
  <PagesBlogPage />
</template>

<script setup lang="ts">
useUrlLocale()
const { t } = useI18n()
useHead({ title: t('nav.blog') })
</script>
