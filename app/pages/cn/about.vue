<template>
  <PagesAboutPage />
</template>

<script setup lang="ts">
const { t } = useI18n()
useUrlLocale()
useHead({ title: t('nav.about') })
</script>
