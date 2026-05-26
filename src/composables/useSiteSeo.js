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
 * Reactive SEO via Quasar Meta (re-runs when dependencies inside getter change).
 * @param {() => object} getter returns { title, description, keywords?, path, ogType?, image? }
 */
export function useSiteSeo(getter) {
  useMeta(() => buildSiteSeoPayload(getter()));
}
