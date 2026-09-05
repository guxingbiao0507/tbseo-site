import { ensureBlogPosts } from '../database/seed-blog'
import { useDb } from '../database'

export default defineNitroPlugin(async () => {
  if (!import.meta.dev) return
  try {
    await ensureBlogPosts(useDb())
  } catch (e) {
    console.warn('[seed-blog] Skipped:', (e as Error).message)
  }
})
