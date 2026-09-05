export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  const path = url.pathname

  if (path.startsWith('/us/') || path === '/us') {
    const newPath = path.slice(3) || '/'
    return sendRedirect(event, newPath + url.search, 301)
  }

  if (path.startsWith('/en/') || path === '/en') {
    const newPath = path.slice(3) || '/'
    return sendRedirect(event, newPath + url.search, 301)
  }
})
