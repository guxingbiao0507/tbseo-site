<template>
  <div class="public-site min-h-screen" style="background-color: var(--tb-bg); color: var(--tb-text)">
    <AppNavbar />
    <main>
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
