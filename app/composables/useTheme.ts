export const useTheme = () => {
  const theme = useState<'dark' | 'light'>('theme', () => 'dark')

  const initTheme = () => {
    if (process.client) {
      const saved = localStorage.getItem('tb-theme') as 'dark' | 'light' | null
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      theme.value = saved || (prefersDark ? 'dark' : 'dark')
      applyTheme(theme.value)
    }
  }

  const applyTheme = (t: 'dark' | 'light') => {
    const html = document.documentElement
    if (t === 'light') {
      html.classList.add('light')
      html.classList.remove('dark')
    } else {
      html.classList.add('dark')
      html.classList.remove('light')
    }
  }

  const toggleTheme = () => {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    applyTheme(theme.value)
    if (process.client) {
      localStorage.setItem('tb-theme', theme.value)
    }
  }

  return { theme, initTheme, toggleTheme }
}
