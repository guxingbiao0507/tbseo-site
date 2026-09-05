<template>
  <PagesContactPage />
</template>

<script setup lang="ts">
const { t } = useI18n()
useHead({ title: t('contact.email') })
</script>
