<template>
  <PagesAboutPage />
</template>

<script setup lang="ts">
useUrlLocale()
const { t } = useI18n()
useHead({ title: t('nav.about') })
</script>
