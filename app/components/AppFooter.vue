<template>
  <footer class="site-footer">
    <div class="site-footer-inner">
      <div class="footer-left">
        <img :src="img('logo2.png')" alt="TailorBoost">
        <div class="footer-nav">
          <NuxtLink :to="demoLink">{{ $t('nav.demo') }}</NuxtLink>
          <NuxtLink :to="localePath('/blog')">{{ $t('nav.blog') }}</NuxtLink>
          <NuxtLink :to="localePath('/about')">{{ $t('nav.about') }}</NuxtLink>
        </div>
      </div>

      <form class="footer-form" @submit.prevent="handleSubmit">
        <div v-if="feedback" class="form-feedback" :class="`form-feedback--${feedback.type}`">
          {{ feedback.message }}
        </div>
        <div class="contact-form-row">
          <span class="contact-form-row-label">{{ $t('contact.email') }}*:</span>
          <input v-model="form.email" type="email" required :placeholder="$t('contact.emailPlaceholder')">
        </div>
        <div class="contact-form-row">
          <span class="contact-form-row-label">{{ $t('contact.name') }}*:</span>
          <input v-model="form.name" type="text" required :placeholder="$t('contact.namePlaceholder')">
        </div>
        <div class="contact-form-row">
          <span class="contact-form-row-label">{{ $t('contact.company') }}:</span>
          <input v-model="form.company" type="text" :placeholder="$t('contact.companyPlaceholder')">
        </div>
        <div class="contact-form-row">
          <span class="contact-form-row-label">{{ $t('contact.content') }}*:</span>
          <textarea v-model="form.content" required :placeholder="$t('contact.contentPlaceholder')" />
        </div>
        <button type="submit" class="footer-submit" :disabled="submitting">
          {{ submitting ? $t('contact.submitting') : $t('contact.submit') }}
        </button>
      </form>
    </div>

    <div class="footer-emails">
      <a href="mailto:tailorboost@outlook.com">tailorboost@outlook.com</a>
      <a href="mailto:tailorboost@hotmail.com">tailorboost@hotmail.com</a>
      <a href="mailto:tailorboost@gmail.com">tailorboost@gmail.com</a>
    </div>

    <div class="footer-copyright">
      <p>{{ $t('footer.copyright') }}</p>
    </div>
  </footer>
</template>

<script setup lang="ts">
const localePath = useLocalePath()
const demoLink = computed(() => localePath({ path: '/', hash: '#demo' }))
const { form, submitting, feedback, handleSubmit } = useContactForm()
const { img } = useSiteAsset()
</script>
