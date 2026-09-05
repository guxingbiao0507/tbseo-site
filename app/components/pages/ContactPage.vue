<template>
  <div class="page-hero page-hero--compact">
    <div class="container-custom">
      <nav class="breadcrumb">
        <NuxtLink :to="localePath('/')">{{ $t('blog.home') }}</NuxtLink>
        <span>/</span>
        <span class="breadcrumb-current">{{ $t('contact.title') }}</span>
      </nav>
      <h1 class="page-hero-title">{{ $t('contact.title') }}</h1>
      <p class="page-hero-sub">{{ $t('contact.subtitle') }}</p>
    </div>
  </div>

  <section class="section-padding">
    <div class="container-custom max-w-xl mx-auto">
      <form class="contact-page-form" @submit.prevent="handleSubmit">
        <div v-if="feedback" class="form-feedback" :class="`form-feedback--${feedback.type}`">
          {{ feedback.message }}
        </div>
        <div class="form-group">
          <label>{{ $t('contact.email') }}*</label>
          <input v-model="form.email" type="email" required class="form-input" :placeholder="$t('contact.emailPlaceholder')">
        </div>
        <div class="form-group">
          <label>{{ $t('contact.name') }}*</label>
          <input v-model="form.name" type="text" required class="form-input" :placeholder="$t('contact.namePlaceholder')">
        </div>
        <div class="form-group">
          <label>{{ $t('contact.company') }}</label>
          <input v-model="form.company" type="text" class="form-input" :placeholder="$t('contact.companyPlaceholder')">
        </div>
        <div class="form-group">
          <label>{{ $t('contact.content') }}*</label>
          <textarea v-model="form.content" rows="5" required class="form-input form-textarea" :placeholder="$t('contact.contentPlaceholder')" />
        </div>
        <button type="submit" class="btn-primary w-full py-3" :disabled="submitting">
          {{ submitting ? $t('contact.submitting') : $t('contact.submit') }}
        </button>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const { form, submitting, feedback, handleSubmit } = useContactForm()

useHead({ title: t('contact.title') })
</script>
