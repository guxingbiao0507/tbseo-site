import { buildSitemapUrls } from '../../utils/sitemap-urls'

export default defineEventHandler(async (event) => {
  return buildSitemapUrls(event, 'cn')
})
