/**
 * Blog tag helpers — keep the tag→URL slug rules identical everywhere a tag
 * link is written (BlogPage, BlogPostPage) and read (BlogTagPage), so the
 * crawlable `/blog/tag/:tag` links and the archive page never drift.
 *
 * Mirrors firebaseService.slugify so a tag slug looks like a post slug.
 */
export function tagSlug(tag) {
  return String(tag || '')
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

/**
 * @param {{tags?: string[]}} post
 * @param {string} slug tag slug from the route
 * @returns {boolean} true when any of the post's tags slugifies to `slug`
 */
export function postHasTagSlug(post, slug) {
  return (post?.tags || []).some((t) => tagSlug(t) === slug);
}

/**
 * Best display label for a tag slug: the actual tag text as authors wrote it
 * (from the first post that carries it), falling back to a de-slugged title.
 * @param {string} slug
 * @param {Array<{tags?: string[]}>} posts
 * @returns {string}
 */
export function tagLabelForSlug(slug, posts) {
  for (const post of posts || []) {
    for (const t of post?.tags || []) {
      if (tagSlug(t) === slug) return String(t);
    }
  }
  return String(slug || '')
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
