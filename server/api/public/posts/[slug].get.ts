import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { useDb, schema } from '../../../database'

const slugQuerySchema = z.object({
  locale: z.string().max(10).optional(),
})

/** Published post by slug, optionally filtered by locale. */
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Missing slug' })

  const query = getQuerySafe(event, slugQuerySchema)
  const db = useDb(event)

  const conditions = [
    eq(schema.posts.slug, slug),
    eq(schema.posts.status, 'published'),
    eq(schema.posts.type, 'post'),
  ]

  if (query.locale) {
    conditions.push(eq(schema.posts.locale, query.locale))
  }

  const post = await db
    .select({
      id: schema.posts.id,
      title: schema.posts.title,
      slug: schema.posts.slug,
      locale: schema.posts.locale,
      excerpt: schema.posts.excerpt,
      content: schema.posts.content,
      coverImage: schema.posts.coverImage,
      tags: schema.posts.tags,
      publishedAt: schema.posts.publishedAt,
      updatedAt: schema.posts.updatedAt,
      categoryName: schema.categories.name,
      categorySlug: schema.categories.slug,
      authorName: schema.users.name,
      metaDescription: schema.posts.metaDescription,
      ogImage: schema.posts.ogImage,
      canonicalUrl: schema.posts.canonicalUrl,
      focusKeyword: schema.posts.focusKeyword,
      robots: schema.posts.robots,
    })
    .from(schema.posts)
    .leftJoin(schema.categories, eq(schema.posts.categoryId, schema.categories.id))
    .leftJoin(schema.users, eq(schema.posts.authorId, schema.users.id))
    .where(and(...conditions))
    .get()

  if (!post) throw createError({ statusCode: 404, statusMessage: 'Post not found' })

  return {
    ...post,
    coverImage: mediaUrl(post.coverImage),
    ogImage: mediaUrl(post.ogImage),
  }
})
