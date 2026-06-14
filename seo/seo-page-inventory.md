# SEO Page Inventory (Quasar + Prerender)

## Public marketing pages indexed

- `/`  
  **Intent:** custom magnets, gift ideas, family memory keepsakes, local discovery  
  **Focus terms:** custom photo magnets, holiday gift ideas, team magnets, Dunwoody, Sandy Springs
- `/products/custom`  
  **Intent:** conversion page for personalized magnet ordering  
  **Focus terms:** custom photo magnets, team gifts, graduation gifts, party favors
- `/products/designer`  
  **Intent:** ready-made product discovery  
  **Focus terms:** designer magnets, gift ideas, holiday magnets, event keepsakes
- `/products/specialty`  
  **Intent:** niche / high-intent specialty shoppers  
  **Focus terms:** specialty magnets, unique custom magnets, event gifts
- `/event-calendar`  
  **Intent:** local geo/event search traffic  
  **Focus terms:** Dunwoody events, Sandy Springs events, custom magnets near me
- `/about`  
  **Intent:** local trust/brand/authority  
  **Focus terms:** Dunwoody small business, personalized photo magnets
- `/contact-us`  
  **Intent:** near-me service and lead capture  
  **Focus terms:** custom magnets near me, Dunwoody custom gifts, Sandy Springs photo magnets
- `/shipping-info`, `/returns`, `/faq`  
  **Intent:** trust + policy pages that improve merchant quality signals
- `/newsletter-signup`  
  **Intent:** retention / recurring audience
- `/leave-review`  
  **Intent:** social proof / review flow
- `/blog`  
  **Intent:** long-tail informational and local topical authority

## Dynamic public pages indexed

- `/product/:productType/:productId`  
  **Structured data:** `Product` + `BreadcrumbList` JSON-LD  
  **Canonical/OG/Twitter:** generated via SEO composable
- `/blog/:slug`  
  **Canonical/OG/Twitter:** per-post metadata  
  **Content type:** article-style local + gift-intent content

## SEO stack in use

- Canonical tags
- Open Graph tags
- Twitter card tags
- Sitewide JSON-LD (`LocalBusiness`, `WebSite`)
- Product JSON-LD + breadcrumbs on product detail
- `robots.txt` + `sitemap.xml`
- Build-time prerender for key marketing routes (Quasar SPA preserved)

## Content targets to attract search intent

- Custom magnets for teams, families, parties, and local events
- Gift ideas for holidays and milestone moments
- Local intent around Dunwoody / Sandy Springs / Atlanta north metro
- Event-driven content from market calendar + Instagram posts

