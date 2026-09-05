<template>
  <PagesServicesPage />
</template>

<script setup lang="ts">
const { t } = useI18n()
useUrlLocale()
useHead({ title: t('advantage.title') })
</script>
