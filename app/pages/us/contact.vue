<template>
  <PagesContactPage />
</template>

<script setup lang="ts">
useUrlLocale()
const { t } = useI18n()
useHead({ title: t('contact.title') })
</script>
