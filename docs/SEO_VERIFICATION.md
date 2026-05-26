# SEO and Prerender verification

After changing titles, meta tags, or JSON-LD, confirm what **Googlebot** receives (same path as **Prerender** when integrated).

## 1. Curl (terminal)

Replace the path with the page you care about:

```bash
curl -sS -A "Googlebot" "https://www.lilmagnetmemories.com/" | head -c 8000
curl -sS -A "Googlebot" "https://www.lilmagnetmemories.com/products/custom" | head -c 8000
```

Check for:

- `<title>...</title>` unique per page
- `<meta name="description" ...>`
- `<link rel="canonical" href="https://www.lilmagnetmemories.com/...">`
- `<meta property="og:url" ...>` matching canonical
- `<script type="application/ld+json">` (LocalBusiness / WebSite from layout; Product + BreadcrumbList on product detail)

Optional: confirm Prerender processed the response:

```bash
curl -sI -A "Googlebot" "https://www.lilmagnetmemories.com/" | grep -i prerender
```

## 2. Google Rich Results Test

1. Open [Rich Results Test](https://search.google.com/test/rich-results).
2. Enter a live URL (e.g. home and one `/product/custom/{id}` URL).
3. Confirm valid structured data where applicable.

## 3. URL Inspection (Search Console)

Use **URL Inspection** → **Test live URL** for key templates after deploy.

## 4. Prerender cache

After meta or JSON-LD changes, **recache** important URLs in the Prerender dashboard (or your workflow) so cached HTML matches the new build. See [Prerender testing](https://docs.prerender.io/docs/how-to-test-your-site-after-you-have-successfully-validated-your-prerender-integration).

## Code reference

- Shared tags: [`src/composables/useSiteSeo.js`](../src/composables/useSiteSeo.js)
- Sitewide JSON-LD: [`src/layouts/MainLayout.vue`](../src/layouts/MainLayout.vue)
- Product + breadcrumbs: [`src/pages/ProductDetailPage.vue`](../src/pages/ProductDetailPage.vue)
