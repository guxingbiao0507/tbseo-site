<template>
  <PagesContactPage />
</template>

<script setup lang="ts">
const { t } = useI18n()
useUrlLocale()
useHead({ title: t('contact.email') })
</script>
