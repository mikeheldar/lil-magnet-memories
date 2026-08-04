import { useMeta } from 'quasar';

/**
 * Canonical site origin for SEO (matches production www + HTTPS).
 */
export const SITE_ORIGIN = 'https://www.lilmagnetmemories.com';

/**
 * @param {string} pathOrUrl path starting with /, or full URL
 * @returns {string} absolute https URL on www host
 */
export function toAbsoluteUrl(pathOrUrl) {
  if (!pathOrUrl) return SITE_ORIGIN;
  if (/^https?:\/\//i.test(pathOrUrl)) {
    try {
      const u = new URL(pathOrUrl);
      if (u.hostname === 'lilmagnetmemories.com') {
        u.hostname = 'www.lilmagnetmemories.com';
      }
      return u.toString();
    } catch {
      return pathOrUrl;
    }
  }
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${SITE_ORIGIN}${path}`;
}

/**
 * @param {string} [path] public path for default OG image
 */
export function defaultOgImagePath(path = '/assets/lil-magnet-memories-logo.png') {
  return toAbsoluteUrl(path);
}

/**
 * Build Quasar Meta payload: canonical, Open Graph, Twitter.
 * @param {object} opts
 * @param {string} opts.title document title
 * @param {string} [opts.socialTitle] og/twitter title if different from `title`
 * @param {string} opts.description meta description (plain text)
 * @param {string} [opts.keywords] optional keywords meta
 * @param {string} opts.path pathname including leading slash (e.g. route.path)
 * @param {string} [opts.ogType] og:type, default 'website'
 * @param {string} [opts.image] absolute or site-relative image for og/twitter
 */
export function buildSiteSeoPayload(opts) {
  const {
    title,
    socialTitle,
    description,
    keywords,
    path,
    ogType = 'website',
    image,
  } = opts;

  const canonical = toAbsoluteUrl(path || '/');
  const ogImage = image ? toAbsoluteUrl(image) : defaultOgImagePath();
  const desc = (description || '').slice(0, 320);
  const ogTwitterTitle = socialTitle || title;

  const meta = {
    description: {
      name: 'description',
      content: desc,
    },
    ogTitle: {
      property: 'og:title',
      content: ogTwitterTitle,
    },
    ogDescription: {
      property: 'og:description',
      content: desc,
    },
    ogUrl: {
      property: 'og:url',
      content: canonical,
    },
    ogType: {
      property: 'og:type',
      content: ogType,
    },
    ogImage: {
      property: 'og:image',
      content: ogImage,
    },
    twitterCard: {
      name: 'twitter:card',
      content: 'summary_large_image',
    },
    twitterTitle: {
      name: 'twitter:title',
      content: ogTwitterTitle,
    },
    twitterDescription: {
      name: 'twitter:description',
      content: desc,
    },
    twitterImage: {
      name: 'twitter:image',
      content: ogImage,
    },
  };

  if (keywords) {
    meta.keywords = {
      name: 'keywords',
      content: keywords,
    };
  }

  return {
    title,
    meta,
    link: {
      canonical: {
        rel: 'canonical',
        href: canonical,
      },
    },
  };
}

/**
 * Build a schema.org BreadcrumbList JSON-LD object from an ordered list of crumbs.
 * Each crumb is { name, path } where path is site-relative (or absolute); positions
 * are assigned in order. Google renders this as the breadcrumb trail in the search
 * result (replaces the raw URL, lifts CTR) — a durable, no-deploy organic lever.
 * @param {Array<{name: string, path: string}>} items
 * @returns {object|null} BreadcrumbList LD, or null if there are no valid crumbs
 */
export function buildBreadcrumbLd(items) {
  const crumbs = (items || []).filter((c) => c && c.name && c.path);
  if (!crumbs.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: toAbsoluteUrl(c.path),
    })),
  };
}

/**
 * Reactive SEO via Quasar Meta (re-runs when dependencies inside getter change).
 * @param {() => object} getter returns { title, description, keywords?, path, ogType?,
 *   image?, breadcrumb? } — when `breadcrumb` (an array of { name, path }) is present,
 *   a BreadcrumbList JSON-LD script is injected alongside the meta.
 */
export function useSiteSeo(getter) {
  useMeta(() => {
    const opts = getter() || {};
    const payload = buildSiteSeoPayload(opts);
    const breadcrumbLd = buildBreadcrumbLd(opts.breadcrumb);
    if (breadcrumbLd) {
      payload.script = {
        ...(payload.script || {}),
        breadcrumbLd: {
          type: 'application/ld+json',
          innerHTML: JSON.stringify(breadcrumbLd),
        },
      };
    }
    return payload;
  });
}
