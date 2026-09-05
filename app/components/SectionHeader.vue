<template>
  <div class="text-center mb-12 lg:mb-16">
    <span class="inline-block text-xs font-semibold uppercase tracking-[0.2em] mb-3"
      :style="{ color: 'var(--tb-primary)' }">
      {{ tag }}
    </span>
    <h2 class="text-3xl lg:text-4xl font-bold mb-4 text-balance" :style="{ color: 'var(--tb-text)' }">
      {{ title }}
    </h2>
    <p class="text-base lg:text-lg max-w-2xl mx-auto text-balance" :style="{ color: 'var(--tb-text-dim)' }">
      {{ description }}
    </p>
  </div>
</template>

<script setup lang="ts">
defineProps<{ tag: string; title: string; description: string }>()
</script>
