export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  const path = url.pathname

  // Fix double locale prefix from legacy routing
  if (path.startsWith('/cn/cn')) {
    return sendRedirect(event, path.replace(/^\/cn\/cn/, '/cn') + url.search, 301)
  }

  // English home at /us (legacy / and /en redirect)
  if (path === '/') {
    return sendRedirect(event, '/us' + url.search, 301)
  }
  if (path.startsWith('/en/') || path === '/en') {
    const newPath = '/us' + (path.slice(3) || '')
    return sendRedirect(event, newPath + url.search, 301)
  }

  // Legacy unprefixed English pages → /us/*
  const legacyEnPaths = ['/about', '/blog', '/cases', '/services', '/contact']
  if (legacyEnPaths.includes(path)) {
    return sendRedirect(event, '/us' + path + url.search, 301)
  }
  if (path.startsWith('/blog/') && !path.startsWith('/us/') && !path.startsWith('/cn/')) {
    return sendRedirect(event, '/us' + path + url.search, 301)
  }
})
