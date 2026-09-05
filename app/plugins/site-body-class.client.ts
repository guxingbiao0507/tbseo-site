export default defineNuxtPlugin(() => {
  if (!import.meta.client) return

  const route = useRoute()

  function syncBodyClass(path: string) {
    const isAdmin = path.startsWith('/admin') || path.startsWith('/cn/admin') || path === '/setup'
    document.body.classList.toggle('public-site', !isAdmin)
    document.body.classList.toggle('admin-site', isAdmin)
  }

  syncBodyClass(route.path)
  watch(() => route.path, syncBodyClass)
})
