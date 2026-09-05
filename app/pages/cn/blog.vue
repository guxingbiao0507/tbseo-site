<template>
  <PagesBlogPage />
</template>

<script setup lang="ts">
const { t } = useI18n()
useUrlLocale()
useHead({ title: t('nav.blog') })
</script>
