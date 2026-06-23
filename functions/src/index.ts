import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';
import * as cors from 'cors';
import * as nodemailer from 'nodemailer';
import { SquareClient, SquareEnvironment } from 'square';
import { createHash, randomUUID } from 'crypto';
import {
  DEFAULT_INSTAGRAM_PROFILE_URL,
  normalizeInstagramPostUrl,
  scrapeInstagramPostPage,
  scrapeInstagramProfilePosts,
  ScrapedInstagramPost,
} from './instagramScrape';

// Initialize Firebase Admin
admin.initializeApp();

/**
 * Nodemailer (Gmail) credentials: legacy `firebase functions:config:set email.*`
 * or environment variables on the deployed function (GCP Console → Cloud Functions → edit → Variables).
 */
function getEmailConfig(): { user: string; password: string; service: string } {
  const cfg = functions.config().email || {};
  const user = String(
    process.env.EMAIL_USER ||
      process.env.GMAIL_USER ||
      cfg.user ||
      ''
  ).trim();
  const password = String(
    process.env.EMAIL_PASSWORD ||
      process.env.GMAIL_APP_PASSWORD ||
      cfg.password ||
      ''
  ).trim();
  const service = String(
    process.env.EMAIL_SERVICE || cfg.service || 'gmail'
  ).trim();

  if (!user || !password) {
    throw new Error(
      'Email not configured: set `firebase functions:config:set email.user` and `email.password`, or set EMAIL_USER + EMAIL_PASSWORD on the api function in Google Cloud Console.'
    );
  }
  return { user, password, service };
}

function escapeHtmlAttr(value: string): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Avoid undefined access when Firestore has fewer quantities than photos. */
function normalizeQuantitiesForPhotos(
  photos: any[],
  quantities: number[] | undefined | null
): number[] {
  const n = Array.isArray(photos) ? photos.length : 0;
  const q = Array.isArray(quantities) ? quantities.slice() : [];
  while (q.length < n) {
    q.push(1);
  }
  return q.slice(0, n);
}

const BLOG_POSTS_COLLECTION = 'blog_posts';
const USER_ROLES_COLLECTION = 'user_roles';
const USER_ROLES_CONFIG_DOC = 'roles_config';
const META_GRAPH_API_VERSION = 'v20.0';
const INITIAL_ADMIN_EMAILS = [
  'michael.helmandarley@gmail.com',
  'amy.helmandarley@gmail.com',
  'info@lilmagnetmemories.com',
];

type InstagramMediaItem = {
  id: string;
  caption?: string;
  media_type?: string;
  media_url?: string;
  permalink?: string;
  timestamp?: string;
  thumbnail_url?: string;
  children?: {
    data?: Array<{
      media_type?: string;
      media_url?: string;
      thumbnail_url?: string;
    }>;
  };
};

function slugifyBlogText(text: string): string {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function hashString(value: string): string {
  return createHash('sha256').update(value || '').digest('hex');
}

function getMetaInstagramConfig(): { instagramUserId: string; pageAccessToken: string } {
  const metaCfg = functions.config().meta || {};
  const instagramCfg = functions.config().instagram || {};

  const instagramUserId = String(
    process.env.INSTAGRAM_USER_ID ||
      process.env.META_INSTAGRAM_USER_ID ||
      instagramCfg.user_id ||
      metaCfg.instagram_user_id ||
      ''
  ).trim();
  const pageAccessToken = String(
    process.env.META_PAGE_ACCESS_TOKEN ||
      process.env.INSTAGRAM_ACCESS_TOKEN ||
      metaCfg.page_access_token ||
      instagramCfg.access_token ||
      ''
  ).trim();

  if (!instagramUserId || !pageAccessToken) {
    throw new Error(
      'Instagram sync is not configured. Set INSTAGRAM_USER_ID and META_PAGE_ACCESS_TOKEN in function environment variables.'
    );
  }

  return { instagramUserId, pageAccessToken };
}

async function getAuthorizedRoleEmail(req: express.Request): Promise<string | null> {
  const authHeader = String(req.headers.authorization || '');
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }

  const idToken = authHeader.slice('Bearer '.length).trim();
  if (!idToken) {
    return null;
  }

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const email = String(decoded.email || '').toLowerCase().trim();
    return email || null;
  } catch (error) {
    console.warn('[BLOG/INSTAGRAM-SYNC] Invalid auth token:', error);
    return null;
  }
}

async function isOperatorOrAdmin(email: string): Promise<boolean> {
  const normalizedEmail = String(email || '').toLowerCase().trim();
  if (!normalizedEmail) return false;

  if (INITIAL_ADMIN_EMAILS.includes(normalizedEmail)) {
    return true;
  }

  const rolesDoc = await admin
    .firestore()
    .collection(USER_ROLES_COLLECTION)
    .doc(USER_ROLES_CONFIG_DOC)
    .get();

  if (!rolesDoc.exists) {
    return false;
  }

  const role = String(rolesDoc.data()?.[normalizedEmail] || '').toLowerCase().trim();
  return role === 'admin' || role === 'operator';
}

function collectInstagramMediaUrls(media: InstagramMediaItem): string[] {
  const urls: string[] = [];
  const add = (url?: string | null) => {
    const next = String(url || '').trim();
    if (next && !urls.includes(next)) {
      urls.push(next);
    }
  };

  if (media.media_type === 'VIDEO') {
    add(media.thumbnail_url);
  }
  add(media.media_url);
  add(media.thumbnail_url);

  const children = Array.isArray(media.children?.data) ? media.children.data : [];
  for (const child of children) {
    if (child.media_type === 'VIDEO') {
      add(child.thumbnail_url);
    }
    add(child.media_url);
    add(child.thumbnail_url);
  }

  return urls;
}

function buildInstagramDraft(media: InstagramMediaItem): {
  slugBase: string;
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  featuredImage: string | null;
  mediaUrls: string[];
  instagramSync: Record<string, any>;
  sourceUrl: string | null;
  eventDate: Date | null;
} {
  const caption = String(media.caption || '').trim();
  const firstLine = caption.split('\n').map((line) => line.trim()).find(Boolean) || '';
  const timestampDate = media.timestamp ? new Date(media.timestamp) : null;
  const isTimestampValid = !!timestampDate && !Number.isNaN(timestampDate.getTime());
  const dateLabel = isTimestampValid
    ? timestampDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
    : 'Instagram Update';

  const title = firstLine
    ? firstLine.slice(0, 120)
    : `Instagram Update - ${dateLabel}`;

  const excerpt = (caption || title).slice(0, 220);

  const contentParts = [caption || title];
  if (media.permalink) {
    contentParts.push(`Original Instagram post: ${media.permalink}`);
  }
  const content = contentParts.filter(Boolean).join('\n\n');

  const hashtagMatches = Array.from(caption.matchAll(/#([a-z0-9_]+)/gi)).map(
    (m) => m[1].toLowerCase()
  );
  const tags = Array.from(
    new Set(['instagram', 'custom magnets', ...hashtagMatches])
  ).slice(0, 20);

  const mediaUrls = collectInstagramMediaUrls(media);
  const featuredImage = mediaUrls[0] || null;

  const hashInput = JSON.stringify({
    caption,
    media_type: media.media_type || '',
    media_urls: mediaUrls,
    permalink: media.permalink || '',
    timestamp: media.timestamp || '',
  });

  return {
    slugBase: slugifyBlogText(`${title}-${media.id}`),
    title,
    excerpt,
    content,
    tags,
    featuredImage,
    mediaUrls,
    sourceUrl: media.permalink || null,
    eventDate: isTimestampValid ? timestampDate : null,
    instagramSync: {
      instagramPostId: media.id,
      mediaType: media.media_type || '',
      mediaUrl: mediaUrls[0] || media.media_url || null,
      mediaUrls,
      permalink: media.permalink || null,
      syncedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastSyncHash: hashString(hashInput),
      lastCaption: caption,
      timestamp: media.timestamp || null,
      syncMethod: 'graph_api',
    },
  };
}

function buildScrapedInstagramDraft(post: ScrapedInstagramPost): {
  slugBase: string;
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  featuredImage: string | null;
  mediaUrls: string[];
  instagramSync: Record<string, any>;
  sourceUrl: string;
} {
  const caption = String(post.caption || post.altText || '').trim();
  const firstLine = caption.split('\n').map((line) => line.trim()).find(Boolean) || '';
  const title = firstLine
    ? firstLine.slice(0, 120)
    : `Instagram Update - ${post.shortCode}`;

  const excerpt = (caption || title).slice(0, 220);
  const contentParts = [caption || title, `View this post on Instagram: ${post.url}`];
  const content = contentParts.filter(Boolean).join('\n\n');

  const hashtagMatches = Array.from(caption.matchAll(/#([a-z0-9_]+)/gi)).map(
    (m) => m[1].toLowerCase()
  );
  const tags = Array.from(
    new Set(['instagram', 'custom magnets', ...hashtagMatches])
  ).slice(0, 20);

  const mediaUrls = Array.isArray(post.mediaUrls) ? post.mediaUrls.filter(Boolean) : [];
  const hashInput = JSON.stringify({
    caption,
    media_urls: mediaUrls,
    permalink: post.url,
    shortCode: post.shortCode,
  });

  return {
    slugBase: slugifyBlogText(`instagram-${post.shortCode}`),
    title,
    excerpt,
    content,
    tags,
    featuredImage: post.featuredImage || mediaUrls[0] || null,
    mediaUrls,
    sourceUrl: post.url,
    instagramSync: {
      instagramPostId: post.shortCode,
      syncMethod: 'scrape',
      mediaUrl: mediaUrls[0] || null,
      mediaUrls,
      permalink: post.url,
      syncedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastSyncHash: hashString(hashInput),
      lastCaption: caption,
      timestamp: null,
    },
  };
}

async function requireBlogAdmin(
  req: express.Request,
  res: express.Response
): Promise<string | null> {
  const callerEmail = await getAuthorizedRoleEmail(req);
  if (!callerEmail) {
    res.status(401).json({ error: 'Unauthorized. Missing or invalid auth token.' });
    return null;
  }

  const allowed = await isOperatorOrAdmin(callerEmail);
  if (!allowed) {
    res.status(403).json({ error: 'Forbidden. Operator or admin access required.' });
    return null;
  }

  return callerEmail;
}

async function upsertScrapedInstagramDrafts(
  posts: ScrapedInstagramPost[],
  callerEmail: string
): Promise<{
  created: number;
  updated: number;
  skipped: number;
  processed: Array<{ postId: string; action: string; instagramPostId: string }>;
}> {
  const db = admin.firestore();
  const blogColl = db.collection(BLOG_POSTS_COLLECTION);

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const processed: Array<{ postId: string; action: string; instagramPostId: string }> = [];

  for (const scrapedPost of posts) {
    if (!scrapedPost?.shortCode) {
      skipped += 1;
      continue;
    }

    const draft = buildScrapedInstagramDraft(scrapedPost);
    const existingSnap = await blogColl
      .where('instagramSync.instagramPostId', '==', scrapedPost.shortCode)
      .limit(1)
      .get();

    if (existingSnap.empty) {
      const now = admin.firestore.FieldValue.serverTimestamp();
      const docRef = await blogColl.add({
        title: draft.title,
        slug: draft.slugBase,
        excerpt: draft.excerpt,
        content: draft.content,
        featuredImage: draft.featuredImage,
        mediaUrls: draft.mediaUrls,
        tags: draft.tags,
        status: 'draft',
        sourceType: 'instagram',
        sourceUrl: draft.sourceUrl,
        locationTargets: ['Dunwoody', 'Sandy Springs', 'Atlanta'],
        seoDescription: draft.excerpt,
        seoKeywords: 'instagram, custom magnets, gift ideas, photo magnets',
        eventDate: null,
        instagram: {
          publishRequested: false,
          publishStatus: 'already_on_instagram',
          publishedUrl: draft.sourceUrl,
          lastRequestedAt: null,
          caption: scrapedPost.caption || '',
        },
        instagramSync: draft.instagramSync,
        createdAt: now,
        updatedAt: now,
        publishedAt: null,
        authorEmail: callerEmail,
      });
      created += 1;
      processed.push({
        postId: docRef.id,
        action: 'created',
        instagramPostId: scrapedPost.shortCode,
      });
      continue;
    }

    const existingDoc = existingSnap.docs[0];
    const existingData = existingDoc.data() || {};
    if (String(existingData.status || '').toLowerCase() === 'published') {
      skipped += 1;
      continue;
    }

    const existingHash = String(existingData?.instagramSync?.lastSyncHash || '');
    const nextHash = String(draft.instagramSync.lastSyncHash || '');
    if (existingHash && nextHash && existingHash === nextHash) {
      skipped += 1;
      continue;
    }

    await existingDoc.ref.update({
      title: draft.title,
      excerpt: draft.excerpt,
      content: draft.content,
      featuredImage: draft.featuredImage,
      mediaUrls: draft.mediaUrls,
      tags: draft.tags,
      sourceType: 'instagram',
      sourceUrl: draft.sourceUrl,
      seoDescription: draft.excerpt,
      instagramSync: draft.instagramSync,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    updated += 1;
    processed.push({
      postId: existingDoc.id,
      action: 'updated',
      instagramPostId: scrapedPost.shortCode,
    });
  }

  return { created, updated, skipped, processed };
}

function scrapedDraftToPreview(draft: ReturnType<typeof buildScrapedInstagramDraft>) {
  return {
    title: draft.title,
    slug: draft.slugBase,
    excerpt: draft.excerpt,
    content: draft.content,
    featuredImage: draft.featuredImage,
    mediaUrls: draft.mediaUrls,
    tags: draft.tags,
    sourceType: 'instagram',
    sourceUrl: draft.sourceUrl,
    seoDescription: draft.excerpt,
    seoKeywords: 'instagram, custom magnets, gift ideas, photo magnets',
    instagramCaption: draft.instagramSync.lastCaption || '',
    instagramSync: draft.instagramSync,
  };
}

// Create Express app
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const squareConfig = functions.config().square || {};
const squareEnvironment =
  squareConfig.environment === 'production'
    ? SquareEnvironment.Production
    : SquareEnvironment.Sandbox;

let squareClient: SquareClient | null = null;

const getSquareClient = (): SquareClient => {
  if (!squareConfig.access_token) {
    throw new Error('Square access token is not configured.');
  }

  if (!squareClient) {
    squareClient = new SquareClient({
      environment: squareEnvironment,
      token: squareConfig.access_token,
    });
  }

  return squareClient;
};

const getSquareLocationId = (): string | null => {
  if (squareConfig.location_id) {
    return squareConfig.location_id as string;
  }
  return null;
};

const normalizeSquareAddress = (address?: any) => {
  if (!address) {
    return undefined;
  }

  const streetValue =
    address.addressLine1 || address.street || address.address1 || null;

  if (!streetValue) {
    return undefined;
  }

  const normalized: any = {
    addressLine1: String(streetValue).slice(0, 500),
  };

  if (address.addressLine2) {
    normalized.addressLine2 = String(address.addressLine2).slice(0, 500);
  } else if (address.address2) {
    normalized.addressLine2 = String(address.address2).slice(0, 500);
  }

  if (address.city || address.locality) {
    normalized.locality = String(address.city || address.locality).slice(
      0,
      200
    );
  }

  if (address.state || address.administrativeDistrictLevel1) {
    normalized.administrativeDistrictLevel1 = String(
      address.state || address.administrativeDistrictLevel1
    )
      .slice(0, 2)
      .toUpperCase();
  }

  if (address.zip || address.postalCode) {
    normalized.postalCode = String(address.zip || address.postalCode).slice(
      0,
      20
    );
  }

  normalized.country = String(address.country || 'US')
    .slice(0, 2)
    .toUpperCase();

  return normalized;
};

// Helper function to serialize payment object, converting BigInt to string
const serializePayment = (payment: any): any => {
  if (!payment) {
    return null;
  }

  // Recursively convert BigInt values to strings
  const convertBigInt = (obj: any): any => {
    if (obj === null || obj === undefined) {
      return obj;
    }
    if (typeof obj === 'bigint') {
      return obj.toString();
    }
    if (Array.isArray(obj)) {
      return obj.map(convertBigInt);
    }
    if (typeof obj === 'object') {
      const converted: any = {};
      for (const key in obj) {
        converted[key] = convertBigInt(obj[key]);
      }
      return converted;
    }
    return obj;
  };

  return convertBigInt(payment);
};

// ===== LIL MAGNET MEMORIES API =====

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'Lil Magnet Memories API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/',
      sendOrderEmail: '/send-order-email',
      sendStatusUpdateEmail: '/send-status-update-email',
      sendContactEmail: '/send-contact-email',
      createPayment: '/payments/create',
      updateOrderPaymentStatus: '/orders/update-payment-status',
    },
  });
});

// Health check for payments endpoint
app.get('/payments/health', (req, res) => {
  res.json({
    status: 'Payments endpoint is accessible',
    timestamp: new Date().toISOString(),
  });
});

// Helper endpoint to list Square locations (for debugging)
app.get('/payments/locations', async (req, res) => {
  try {
    console.log('🔵 [PAYMENTS/LOCATIONS] Listing Square locations...');
    const client = getSquareClient();

    const response = await client.locations.list();

    console.log('✅ [PAYMENTS/LOCATIONS] Locations retrieved:', {
      count: response.locations?.length || 0,
    });

    return res.json({
      success: true,
      locations:
        response.locations?.map((loc) => ({
          id: loc.id,
          name: loc.name,
          address: loc.address,
          status: loc.status,
          capabilities: loc.capabilities,
        })) || [],
    });
  } catch (error: any) {
    console.error('❌ [PAYMENTS/LOCATIONS] Error listing locations:', error);
    return res.status(500).json({
      error: 'Failed to list locations',
      details: error?.message || 'Unknown error',
    });
  }
});

// Send order email endpoint
app.post('/send-order-email', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      specialInstructions,
      photos,
      quantities,
      orderNumber,
      totalMagnets,
      subtotal,
      shipping,
      tax,
      totalAmount,
      shippingOption,
      paymentOption,
      cartItems,
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !orderNumber) {
      return res.status(400).json({
        error:
          'Missing required fields: firstName, lastName, email, orderNumber',
      });
    }

    console.log('📧 Lil Magnet Memories order email request:', {
      orderNumber,
      customerName: `${firstName} ${lastName}`,
      email,
      totalMagnets,
    });

    // Send the order email
    const result = await sendLilMagnetOrderEmail({
      firstName,
      lastName,
      email,
      phone: phone || '',
      specialInstructions: specialInstructions || '',
      photos: photos || [],
      quantities: quantities || [],
      orderNumber,
      totalMagnets: totalMagnets || 0,
      subtotal: subtotal || 0,
      shipping: shipping || 0,
      tax: tax || 0,
      totalAmount: totalAmount || 0,
      shippingOption: shippingOption || null,
      paymentOption: paymentOption || null,
      cartItems: cartItems || [],
    });

    return res.json({ success: true, messageId: result });
  } catch (error) {
    console.error('Send Lil Magnet order email error:', error);

    // Provide more specific error messages
    if (error.code === 'EAUTH') {
      return res.status(500).json({
        error:
          'Gmail authentication failed. Please check the app password configuration.',
        details:
          'Invalid login credentials. The Gmail app password may be expired or incorrect.',
      });
    }

    return res.status(500).json({
      error: 'Failed to send order email',
      details: error.message || 'Unknown error occurred',
    });
  }
});

// Send order status update email endpoint
app.post('/send-status-update-email', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      orderNumber,
      status,
      photos,
      quantities,
      totalMagnets,
      shippingOption,
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !orderNumber || !status) {
      return res.status(400).json({
        error:
          'Missing required fields: firstName, lastName, email, orderNumber, status',
      });
    }

    console.log('📧 Lil Magnet Memories status update email request:', {
      orderNumber,
      customerName: `${firstName} ${lastName}`,
      email,
      status,
    });

    // Send the status update email
    const result = await sendLilMagnetStatusUpdateEmail({
      firstName,
      lastName,
      email,
      orderNumber,
      status,
      photos: photos || [],
      quantities: quantities || [],
      totalMagnets: totalMagnets || 0,
      shippingOption: shippingOption || null,
    });

    return res.json({ success: true, messageId: result });
  } catch (error) {
    console.error('Send Lil Magnet status update email error:', error);

    // Provide more specific error messages
    if (error.code === 'EAUTH') {
      return res.status(500).json({
        error:
          'Gmail authentication failed. Please check the app password configuration.',
        details:
          'Invalid login credentials. The Gmail app password may be expired or incorrect.',
      });
    }

    return res.status(500).json({
      error: 'Failed to send status update email',
      details: error.message || 'Unknown error occurred',
    });
  }
});

// Send contact form email endpoint
app.post('/send-contact-email', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        error: 'Missing required fields: name, email, subject, message',
      });
    }

    console.log('📧 Lil Magnet Memories contact form email request:', {
      name,
      email,
      subject,
    });

    // Send the contact email
    const result = await sendLilMagnetContactEmail({
      name,
      email,
      subject,
      message,
    });

    return res.json({ success: true, messageId: result });
  } catch (error) {
    console.error('Send Lil Magnet contact email error:', error);

    // Provide more specific error messages
    if (error.code === 'EAUTH') {
      return res.status(500).json({
        error:
          'Gmail authentication failed. Please check the app password configuration.',
        details:
          'Invalid login credentials. The Gmail app password may be expired or incorrect.',
      });
    }

    return res.status(500).json({
      error: 'Failed to send contact email',
      details: error.message || 'Unknown error occurred',
    });
  }
});

app.post('/blog/sync-instagram', async (req, res) => {
  try {
    const callerEmail = await getAuthorizedRoleEmail(req);
    if (!callerEmail) {
      return res.status(401).json({ error: 'Unauthorized. Missing or invalid auth token.' });
    }

    const allowed = await isOperatorOrAdmin(callerEmail);
    if (!allowed) {
      return res.status(403).json({ error: 'Forbidden. Operator or admin access required.' });
    }

    const { instagramUserId, pageAccessToken } = getMetaInstagramConfig();
    const requestedLimit = Number(req.body?.limit || 20);
    const limit = Math.max(1, Math.min(50, Number.isFinite(requestedLimit) ? requestedLimit : 20));

    const graphUrl =
      `https://graph.facebook.com/${META_GRAPH_API_VERSION}/${encodeURIComponent(instagramUserId)}/media` +
      `?fields=id,caption,media_type,media_url,permalink,timestamp,thumbnail_url,children{media_type,media_url,thumbnail_url}` +
      `&limit=${limit}&access_token=${encodeURIComponent(pageAccessToken)}`;

    const fetchFn = (globalThis as any).fetch;
    if (typeof fetchFn !== 'function') {
      return res.status(500).json({
        error: 'Global fetch is unavailable in this runtime. Please upgrade the Cloud Functions runtime.',
      });
    }

    const graphResponse = await fetchFn(graphUrl);
    const graphPayload = await graphResponse.json();

    if (!graphResponse.ok) {
      console.error('[BLOG/INSTAGRAM-SYNC] Meta API error:', graphPayload);
      return res.status(502).json({
        error: 'Failed to fetch Instagram posts from Meta Graph API.',
        details: graphPayload?.error?.message || graphPayload,
      });
    }

    const mediaItems = Array.isArray(graphPayload?.data)
      ? (graphPayload.data as InstagramMediaItem[])
      : [];

    const db = admin.firestore();
    const blogColl = db.collection(BLOG_POSTS_COLLECTION);

    let created = 0;
    let updated = 0;
    let skipped = 0;
    const processed: Array<{ postId: string; action: string; instagramPostId: string }> = [];

    for (const media of mediaItems) {
      if (!media?.id) {
        skipped += 1;
        continue;
      }

      const draft = buildInstagramDraft(media);
      const existingSnap = await blogColl
        .where('instagramSync.instagramPostId', '==', media.id)
        .limit(1)
        .get();

      if (existingSnap.empty) {
        const now = admin.firestore.FieldValue.serverTimestamp();
        const docRef = await blogColl.add({
          title: draft.title,
          slug: draft.slugBase || `instagram-${media.id}`,
          excerpt: draft.excerpt,
          content: draft.content,
          featuredImage: draft.featuredImage,
          mediaUrls: draft.mediaUrls,
          tags: draft.tags,
          status: 'draft',
          sourceType: 'instagram',
          sourceUrl: draft.sourceUrl,
          locationTargets: ['Dunwoody', 'Sandy Springs', 'Atlanta'],
          seoDescription: draft.excerpt,
          seoKeywords: 'instagram, custom magnets, gift ideas, photo magnets',
          eventDate: draft.eventDate ? admin.firestore.Timestamp.fromDate(draft.eventDate) : null,
          instagram: {
            publishRequested: false,
            publishStatus: 'not_requested',
            publishedUrl: null,
            lastRequestedAt: null,
            caption: String(media.caption || '').trim(),
          },
          instagramSync: draft.instagramSync,
          createdAt: now,
          updatedAt: now,
          publishedAt: null,
          authorEmail: callerEmail,
        });
        created += 1;
        processed.push({
          postId: docRef.id,
          action: 'created',
          instagramPostId: media.id,
        });
        continue;
      }

      const existingDoc = existingSnap.docs[0];
      const existingData = existingDoc.data() || {};
      if (String(existingData.status || '').toLowerCase() === 'published') {
        skipped += 1;
        continue;
      }

      const existingHash = String(existingData?.instagramSync?.lastSyncHash || '');
      const nextHash = String(draft.instagramSync.lastSyncHash || '');
      if (existingHash && nextHash && existingHash === nextHash) {
        skipped += 1;
        continue;
      }

      await existingDoc.ref.update({
        title: draft.title,
        excerpt: draft.excerpt,
        content: draft.content,
        featuredImage: draft.featuredImage,
        mediaUrls: draft.mediaUrls,
        tags: draft.tags,
        sourceType: 'instagram',
        sourceUrl: draft.sourceUrl,
        seoDescription: draft.excerpt,
        eventDate: draft.eventDate ? admin.firestore.Timestamp.fromDate(draft.eventDate) : null,
        instagramSync: draft.instagramSync,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      updated += 1;
      processed.push({
        postId: existingDoc.id,
        action: 'updated',
        instagramPostId: media.id,
      });
    }

    return res.json({
      success: true,
      importedCount: created + updated,
      createdCount: created,
      updatedCount: updated,
      skippedCount: skipped,
      fetchedCount: mediaItems.length,
      processed,
    });
  } catch (error: any) {
    console.error('[BLOG/INSTAGRAM-SYNC] Error:', error);
    return res.status(500).json({
      error: 'Failed to sync Instagram posts to blog drafts.',
      details: error?.message || 'Unknown error',
    });
  }
});

app.post('/blog/sync-instagram-scrape', async (req, res) => {
  try {
    const callerEmail = await requireBlogAdmin(req, res);
    if (!callerEmail) {
      return res;
    }

    const requestedLimit = Number(req.body?.limit || 20);
    const limit = Math.max(1, Math.min(50, Number.isFinite(requestedLimit) ? requestedLimit : 20));
    const profileUrl = String(req.body?.profileUrl || DEFAULT_INSTAGRAM_PROFILE_URL).trim();

    const scrapedPosts = await scrapeInstagramProfilePosts(profileUrl, limit);
    const { created, updated, skipped, processed } = await upsertScrapedInstagramDrafts(
      scrapedPosts,
      callerEmail
    );

    return res.json({
      success: true,
      method: 'scrape',
      importedCount: created + updated,
      createdCount: created,
      updatedCount: updated,
      skippedCount: skipped,
      fetchedCount: scrapedPosts.length,
      processed,
    });
  } catch (error: any) {
    console.error('[BLOG/INSTAGRAM-SCRAPE] Profile sync error:', error);
    return res.status(500).json({
      error: 'Failed to sync Instagram posts via public profile scrape.',
      details: error?.message || 'Unknown error',
    });
  }
});

app.post('/blog/import-instagram-url', async (req, res) => {
  try {
    const callerEmail = await requireBlogAdmin(req, res);
    if (!callerEmail) {
      return res;
    }

    const rawUrl = String(req.body?.url || '').trim();
    const normalizedUrl = normalizeInstagramPostUrl(rawUrl);
    if (!normalizedUrl) {
      return res.status(400).json({
        error: 'Invalid Instagram post URL.',
        details: 'Use a link like https://www.instagram.com/p/ABC123/ or /reel/ABC123/',
      });
    }

    const scrapedPost = await scrapeInstagramPostPage(normalizedUrl);
    const draft = buildScrapedInstagramDraft(scrapedPost);
    const preview = scrapedDraftToPreview(draft);
    const saveDraft = req.body?.saveDraft !== false;

    if (!saveDraft) {
      return res.json({
        success: true,
        method: 'scrape',
        preview,
      });
    }

    const { created, updated, skipped, processed } = await upsertScrapedInstagramDrafts(
      [scrapedPost],
      callerEmail
    );

    return res.json({
      success: true,
      method: 'scrape',
      preview,
      createdCount: created,
      updatedCount: updated,
      skippedCount: skipped,
      postId: processed[0]?.postId || null,
      action: processed[0]?.action || (skipped ? 'skipped' : null),
    });
  } catch (error: any) {
    console.error('[BLOG/INSTAGRAM-SCRAPE] URL import error:', error);
    return res.status(500).json({
      error: 'Failed to import Instagram post.',
      details: error?.message || 'Unknown error',
    });
  }
});

// Update order payment status - uses Admin SDK to bypass Firestore security rules
// Required for guest checkout where client cannot update orders directly
app.post('/orders/update-payment-status', async (req, res) => {
  try {
    const { orderId, paymentOption, status, error } = req.body;

    if (!orderId || typeof orderId !== 'string') {
      return res.status(400).json({
        error: 'Missing or invalid orderId',
      });
    }

    const updateData: Record<string, any> = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (paymentOption !== undefined) {
      updateData.paymentOption = paymentOption;
    }
    if (status !== undefined) {
      updateData.status = status;
    }
    if (error !== undefined) {
      updateData.paymentError = error;
    }

    // Optionally verify payment with Square when paymentId is present AND Square is configured
    // Skip verification if Square isn't configured (e.g. test project) - payment already succeeded via production API
    if (paymentOption?.paymentId && squareConfig.access_token) {
      try {
        const client = getSquareClient();
        const getPaymentResponse = await client.payments.get({
          paymentId: paymentOption.paymentId,
        });
        const payment = getPaymentResponse.payment;
        if (!payment || payment.status !== 'COMPLETED') {
          console.warn(
            `[ORDERS/UPDATE-PAYMENT] Payment ${paymentOption.paymentId} not completed:`,
            payment?.status
          );
          return res.status(400).json({
            error: 'Payment verification failed - payment not completed',
          });
        }
      } catch (verifyError: any) {
        console.error(
          '[ORDERS/UPDATE-PAYMENT] Square payment verification failed:',
          verifyError?.message
        );
        return res.status(400).json({
          error: 'Payment verification failed',
          details: verifyError?.message,
        });
      }
    } else if (paymentOption?.paymentId && !squareConfig.access_token) {
      console.log(
        '[ORDERS/UPDATE-PAYMENT] Skipping Square verification (not configured) - proceeding with update'
      );
    }

    const orderRef = admin.firestore().collection('orders').doc(orderId);

    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) {
      return res.status(404).json({
        error: 'Order not found',
        orderId,
      });
    }

    await orderRef.update(updateData);

    console.log('✅ [ORDERS/UPDATE-PAYMENT] Order updated:', orderId, {
      status: updateData.status,
      hasPaymentOption: !!updateData.paymentOption,
    });

    return res.json({ success: true, orderId });
  } catch (error: any) {
    console.error('[ORDERS/UPDATE-PAYMENT] Error:', error?.message);
    return res.status(500).json({
      error: 'Failed to update order payment status',
      details: error?.message,
    });
  }
});

// Square payment endpoint
app.post('/payments/create', async (req, res) => {
  console.log('🔵 [PAYMENTS/CREATE] Request received:', {
    method: req.method,
    path: req.path,
    headers: {
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent'],
    },
    bodyKeys: Object.keys(req.body || {}),
    timestamp: new Date().toISOString(),
  });

  try {
    console.log('🔵 [PAYMENTS/CREATE] Checking Square configuration...');
    const locationId = getSquareLocationId() || req.body.locationId;
    console.log(
      '🔵 [PAYMENTS/CREATE] Location ID:',
      locationId ? '✅ Found' : '❌ Missing'
    );

    if (!locationId) {
      console.error(
        '❌ [PAYMENTS/CREATE] Square location ID is not configured'
      );
      return res.status(500).json({
        error: 'Square location ID is not configured',
      });
    }

    const {
      sourceId,
      amount,
      currency = 'USD',
      orderNumber,
      buyerEmail,
      customerName,
      billingAddress,
      shippingAddress,
      verificationToken,
      note,
    } = req.body;

    console.log('🔵 [PAYMENTS/CREATE] Request data:', {
      sourceId: sourceId ? `${sourceId.substring(0, 10)}...` : 'missing',
      amount,
      currency,
      orderNumber,
      buyerEmail,
      customerName,
      hasBillingAddress: !!billingAddress,
      hasShippingAddress: !!shippingAddress,
    });

    if (!sourceId) {
      console.error('❌ [PAYMENTS/CREATE] Missing payment source (sourceId)');
      return res
        .status(400)
        .json({ error: 'Missing payment source (sourceId).' });
    }

    if (amount === undefined || amount === null) {
      console.error('❌ [PAYMENTS/CREATE] Missing payment amount');
      return res.status(400).json({ error: 'Missing payment amount.' });
    }

    const amountNumber = Number(amount);
    if (Number.isNaN(amountNumber) || amountNumber <= 0) {
      console.error('❌ [PAYMENTS/CREATE] Invalid amount:', amountNumber);
      return res
        .status(400)
        .json({ error: 'Amount must be a positive number.' });
    }

    console.log('🔵 [PAYMENTS/CREATE] Initializing Square client...');
    const client = getSquareClient();
    console.log('✅ [PAYMENTS/CREATE] Square client initialized');

    const idempotencyKey = req.body.idempotencyKey || randomUUID();
    const amountMoney = {
      amount: BigInt(Math.round(amountNumber * 100)),
      currency: String(currency || 'USD').toUpperCase(),
    };

    console.log('🔵 [PAYMENTS/CREATE] Preparing payment request:', {
      idempotencyKey,
      amountMoney,
      locationId,
    });

    const requestBody: any = {
      sourceId,
      idempotencyKey,
      amountMoney,
      locationId,
      autocomplete: true,
    };

    if (orderNumber) {
      requestBody.referenceId = orderNumber;
      requestBody.note = note || `Lil Magnet Memories order ${orderNumber}`;
    } else if (note) {
      requestBody.note = note;
    }

    if (buyerEmail) {
      requestBody.buyerEmailAddress = buyerEmail;
    }

    if (customerName) {
      requestBody.statementDescriptionIdentifier = customerName
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 20);
    }

    if (verificationToken) {
      requestBody.verificationToken = verificationToken;
    }

    const normalizedBilling = normalizeSquareAddress(billingAddress);
    if (normalizedBilling) {
      requestBody.billingAddress = normalizedBilling;
    }

    const normalizedShipping = normalizeSquareAddress(shippingAddress);
    if (normalizedShipping) {
      requestBody.shippingAddress = normalizedShipping;
    }

    console.log('🔵 [PAYMENTS/CREATE] Calling Square API...', {
      requestBodyKeys: Object.keys(requestBody),
      amountCents: requestBody.amountMoney.amount,
    });

    const response = await client.payments.create(requestBody);

    console.log('✅ [PAYMENTS/CREATE] Square payment created:', {
      id: response.payment?.id,
      status: response.payment?.status,
      orderNumber,
      errors: response.errors,
    });

    if (response.errors && response.errors.length > 0) {
      console.error(
        '⚠️ [PAYMENTS/CREATE] Square returned errors:',
        response.errors
      );
      return res.status(400).json({
        error: 'Square payment failed',
        details: response.errors,
        payment: response.payment ? serializePayment(response.payment) : null,
      });
    }

    // Serialize payment to convert BigInt values to strings for JSON
    const serializedPayment = response.payment
      ? serializePayment(response.payment)
      : null;

    return res.json({ success: true, payment: serializedPayment });
  } catch (error: any) {
    console.error('❌ [PAYMENTS/CREATE] Square payment error:', {
      message: error?.message,
      statusCode: error?.statusCode,
      errors: error?.errors,
      stack: error?.stack,
    });
    const statusCode = error?.statusCode || 500;
    const message =
      error?.message ||
      error?.errors?.[0]?.detail ||
      'Failed to process Square payment.';
    return res.status(statusCode).json({
      error: message,
      details: error?.errors || error,
    });
  }
});

// ===== HELPER FUNCTIONS =====

// Helper function to send Lil Magnet Memories order emails
async function sendLilMagnetOrderEmail(params: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialInstructions: string;
  photos: any[];
  quantities: number[];
  orderNumber: string;
  totalMagnets: number;
  subtotal?: number;
  shipping?: number;
  tax?: number;
  totalAmount?: number;
  shippingOption?: any;
  paymentOption?: any;
  cartItems?: any[];
}): Promise<string> {
  const {
    firstName,
    lastName,
    email,
    phone,
    specialInstructions,
    photos,
    quantities,
    orderNumber,
    totalMagnets,
    subtotal = 0,
    shipping = 0,
    tax = 0,
    totalAmount = 0,
    shippingOption = null,
    paymentOption = null,
    cartItems = [],
  } = params;

  const emailConfig = getEmailConfig();

  console.log('📧 Using email config:', {
    service: emailConfig.service,
    user: emailConfig.user,
  });

  // Create nodemailer transporter
  const transporter = nodemailer.createTransport({
    service: emailConfig.service,
    auth: {
      user: emailConfig.user,
      pass: emailConfig.password,
    },
  });

  // Helper functions for formatting
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatAddress = (address: any): string => {
    if (!address) return 'N/A';
    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.zip) parts.push(address.zip);
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  const getPaymentMethodLabel = (paymentOption: any): string => {
    if (!paymentOption) return 'Not specified';
    const type = paymentOption.type;
    switch (type) {
      case 'square_card':
        return 'Credit/Debit Card';
      case 'apple_pay':
        return 'Apple Pay';
      case 'google_pay':
        return 'Google Pay';
      case 'paypal':
        return 'PayPal';
      case 'pay_at_event':
        return 'Pay at Event';
      default:
        return type ? type.replace(/_/g, ' ') : 'Payment';
    }
  };

  const getDeliveryOptionLabel = (shippingOption: any): string => {
    if (!shippingOption) return 'Not specified';
    if (shippingOption.type === 'pickup') {
      return 'Pickup at Market Event';
    }
    return shippingOption.label || shippingOption.value?.replace(/_/g, ' ') || 'Shipping';
  };

  const isPayAtEvent = paymentOption?.type === 'pay_at_event';
  const finalTotalAmount = totalAmount > 0 ? totalAmount : subtotal + shipping + tax;

  // Format photo details
  const photoDetails = photos
    .map(
      (photo, index) =>
        `${photo.name} (${quantities[index]} magnet${
          quantities[index] > 1 ? 's' : ''
        })`
    )
    .join('\n');

  // Format cart items
  const cartItemsDetails = cartItems
    .map((item) => {
      const quantity = item.quantity || 1;
      const productName = item.productName || item.name || 'Product';
      return `${productName} (${quantity} magnet${quantity > 1 ? 's' : ''})`;
    })
    .join('\n');

  const subject = `lil-order ${orderNumber}`;

  // Create HTML email content
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1976d2; margin: 0;">🎯 Lil Magnet Memories</h1>
        <h2 style="color: #333; margin: 10px 0;">New Order Received!</h2>
      </div>

      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #1976d2; margin-top: 0;">Order Details</h3>
        <p><strong>Order Number:</strong> ${orderNumber}</p>
        <p><strong>Customer Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Customer Email:</strong> ${email}</p>
        <p><strong>Customer Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Total Magnets:</strong> ${totalMagnets}</p>
        ${specialInstructions ? `<p><strong>Special Instructions:</strong> ${specialInstructions}</p>` : ''}
        <p><strong>Order Date:</strong> ${new Date().toLocaleString()}</p>
      </div>

      ${
        cartItems.length > 0
          ? `
        <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #1976d2;">
          <h3 style="color: #1976d2; margin-top: 0;">Order Items</h3>
          <ul style="list-style: none; padding: 0;">
            ${cartItems
              .map(
                (item) => `
              <li style="padding: 10px; margin: 5px 0; border-bottom: 1px solid #eee;">
                <strong>${item.productName || item.name || 'Product'}</strong><br>
                <span style="color: #666;">Quantity: ${item.quantity || 1} magnet${(item.quantity || 1) > 1 ? 's' : ''}</span>
              </li>
            `
              )
              .join('')}
          </ul>
        </div>
      `
          : photos.length > 0
          ? `
        <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #1976d2;">
          <h3 style="color: #1976d2; margin-top: 0;">📸 Your Custom Magnets</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">
            ${photos
              .map(
                (photo, index) => `
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                ${photo.url ? `
                  <img src="${photo.url}" alt="${photo.name}" style="max-width: 100%; height: auto; border-radius: 4px; margin-bottom: 10px; max-height: 200px; object-fit: cover;" />
                ` : ''}
                <div style="margin-top: 10px;">
                  <strong style="font-size: 14px; color: #333;">${photo.name}</strong><br>
                  <span style="color: #666; font-size: 13px;">Quantity: ${
                    quantities[index]
                  } magnet${quantities[index] > 1 ? 's' : ''}</span>
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      `
          : ''
      }

      <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #1976d2;">
        <h3 style="color: #1976d2; margin-top: 0;">Receipt Summary</h3>
        <div style="display: flex; justify-content: space-between; margin: 10px 0;">
          <span>Subtotal:</span>
          <strong>${formatCurrency(subtotal)}</strong>
        </div>
        ${shipping > 0 ? `
        <div style="display: flex; justify-content: space-between; margin: 10px 0;">
          <span>Shipping:</span>
          <strong>${formatCurrency(shipping)}</strong>
        </div>
        ` : ''}
        ${tax > 0 ? `
        <div style="display: flex; justify-content: space-between; margin: 10px 0;">
          <span>Tax:</span>
          <strong>${formatCurrency(tax)}</strong>
        </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between; margin: 15px 0; padding-top: 15px; border-top: 2px solid #1976d2; font-size: 18px;">
          <span><strong>${isPayAtEvent ? 'Total to pay at tent' : 'Total Paid'}:</strong></span>
          <strong style="color: #1976d2;">${formatCurrency(finalTotalAmount)}</strong>
        </div>
      </div>

      <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #1976d2;">
        <h3 style="color: #1976d2; margin-top: 0;">Delivery & Payment</h3>
        <div style="margin: 10px 0;">
          <strong>Delivery Option:</strong> ${getDeliveryOptionLabel(shippingOption)}
        </div>
        ${shippingOption?.address ? `
        <div style="margin: 10px 0; padding-left: 20px; color: #666;">
          <strong>Shipping Address:</strong><br>
          ${formatAddress(shippingOption.address)}
        </div>
        ` : ''}
        <div style="margin: 10px 0;">
          <strong>Payment Method:</strong> ${getPaymentMethodLabel(paymentOption)}
        </div>
        ${paymentOption?.billingAddress ? `
        <div style="margin: 10px 0; padding-left: 20px; color: #666;">
          <strong>Billing Address:</strong><br>
          ${formatAddress(paymentOption.billingAddress)}
        </div>
        ` : ''}
      </div>

      <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
        <p>Best regards,<br>Lil Magnet Memories System</p>
        <p style="font-size: 12px;">This email was automatically generated from your website order form.</p>
      </div>
    </div>
  `;

  // Create plain text version
  const textContent = `
LIL MAGNET MEMORIES - New Order Received!

Order Number: ${orderNumber}
Customer Name: ${firstName} ${lastName}
Customer Email: ${email}
Customer Phone: ${phone || 'Not provided'}
Total Magnets: ${totalMagnets}
${specialInstructions ? `Special Instructions: ${specialInstructions}\n` : ''}
Order Date: ${new Date().toLocaleString()}

${cartItems.length > 0 ? `Order Items:\n${cartItemsDetails}\n` : ''}
${photos.length > 0 && cartItems.length === 0 ? `Photo Details:\n${photoDetails}\n` : ''}

Receipt Summary:
Subtotal: ${formatCurrency(subtotal)}
${shipping > 0 ? `Shipping: ${formatCurrency(shipping)}\n` : ''}${tax > 0 ? `Tax: ${formatCurrency(tax)}\n` : ''}${isPayAtEvent ? 'Total to pay at tent' : 'Total Paid'}: ${formatCurrency(finalTotalAmount)}

Delivery & Payment:
Delivery Option: ${getDeliveryOptionLabel(shippingOption)}
${shippingOption?.address ? `Shipping Address: ${formatAddress(shippingOption.address)}\n` : ''}Payment Method: ${getPaymentMethodLabel(paymentOption)}
${paymentOption?.billingAddress ? `Billing Address: ${formatAddress(paymentOption.billingAddress)}\n` : ''}

Best regards,
Lil Magnet Memories System

This email was automatically generated from your website order form.
  `;

  // Send directly to the admin inbox to avoid Cloudflare forwarding
  // loop/suppression for Gmail-authenticated app mail.
  const info = await transporter.sendMail({
    from: '"Lil Magnet Memories Orders" <orders@lilmagnetmemories.com>',
    replyTo: 'info@lilmagnetmemories.com',
    to: emailConfig.user,
    subject: subject,
    text: textContent,
    html: htmlContent,
  });

  console.log('✅ Lil Magnet order email sent successfully:', info.messageId);
  return info.messageId;
}

// Helper function to format status display
function formatStatusDisplay(status: string): string {
  const s = status == null ? '' : String(status);
  switch (s) {
    case 'new':
      return 'NEW ORDER SUBMITTED';
    case 'in_progress':
      return 'IN PROGRESS';
    case 'completed':
      return 'COMPLETED';
    case 'cancelled':
      return 'CANCELLED';
    default:
      return s ? s.toUpperCase() : 'UNKNOWN';
  }
}

// Helper function to send Lil Magnet Memories status update emails
async function sendLilMagnetStatusUpdateEmail(params: {
  firstName: string;
  lastName: string;
  email: string;
  orderNumber: string;
  status: string;
  photos: any[];
  quantities: number[];
  totalMagnets: number;
  shippingOption?: any;
}): Promise<string> {
  const {
    firstName,
    lastName,
    email,
    orderNumber,
    status,
    photos,
    quantities,
    totalMagnets,
    shippingOption,
  } = params;

  const safePhotos = Array.isArray(photos) ? photos : [];
  const qty = normalizeQuantitiesForPhotos(safePhotos, quantities);

  const emailConfig = getEmailConfig();

  console.log('📧 Using email config:', {
    service: emailConfig.service,
    user: emailConfig.user,
  });

  // Create nodemailer transporter
  const transporter = nodemailer.createTransport({
    service: emailConfig.service,
    auth: {
      user: emailConfig.user,
      pass: emailConfig.password,
    },
  });

  // Format photo details
  const photoDetails = safePhotos
    .map(
      (photo, index) =>
        `${photo?.name ?? 'Photo'} (${qty[index]} magnet${
          qty[index] > 1 ? 's' : ''
        })`
    )
    .join('\n');

  // Status-specific messaging
  let statusMessage = '';
  let statusEmoji = '';
  let excitementLevel = '';

  switch (status) {
    case 'new':
      statusMessage = 'Your order has been received.';
      statusEmoji = '✨';
      excitementLevel = 'Thank you for your order';
      break;
    case 'in_progress':
      statusMessage = 'Your magnets are being created right now! 🎨';
      statusEmoji = '🛠️';
      excitementLevel = 'Great progress';
      break;
    case 'completed':
      // Customize message based on delivery method
      if (shippingOption?.type === 'shipping') {
        const shippingMethod = shippingOption.rawLabel || shippingOption.label || 'shipping';
        statusMessage = `Your custom magnets are created and ready to be shipped/delivered via ${shippingMethod}! 🎊`;
      } else if (shippingOption?.type === 'pickup' || shippingOption?.type === 'arranged_pickup') {
        statusMessage = 'Your custom magnets are completed and ready for pickup! 🎊';
      } else {
        // Default fallback
        statusMessage = 'Your custom magnets are completed and ready! 🎊';
      }
      statusEmoji = '🎯';
      excitementLevel = 'Amazing news';
      break;
    case 'cancelled':
      statusMessage = 'Your order has been cancelled';
      statusEmoji = '❌';
      excitementLevel = 'Order update';
      break;
    default:
      statusMessage = `Your order status has been updated to: ${status}`;
      statusEmoji = '📋';
      excitementLevel = 'Order update';
  }

  const subject = `${statusEmoji} ${excitementLevel} - Order ${orderNumber} Status Update!`;

  // Create HTML email content
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1976d2; margin: 0;">🎯 Lil Magnet Memories</h1>
        <h2 style="color: #333; margin: 10px 0;">${statusEmoji} ${excitementLevel}!</h2>
        <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #2e7d32; margin: 0;">${statusMessage}</h3>
        </div>
      </div>

      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #1976d2; margin-top: 0;">Order Information</h3>
        <p><strong>Order Number:</strong> ${orderNumber}</p>
        <p><strong>Customer Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Total Magnets:</strong> ${totalMagnets}</p>
        <p><strong>Current Status:</strong> <span style="color: #1976d2; font-weight: bold;">${formatStatusDisplay(
          status
        )}</span></p>
        <p><strong>Photos Submitted:</strong> ${safePhotos.length}</p>
      </div>

      ${
        safePhotos.length > 0
          ? `
        <div style="margin-bottom: 20px;">
          <h3 style="color: #1976d2;">📸 Your Custom Magnets</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">
            ${safePhotos
              .map(
                (photo, index) => `
              <div style="background-color: #fff; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #1976d2; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center;">
                ${photo?.url ? `
                  <img src="${escapeHtmlAttr(String(photo.url))}" alt="${escapeHtmlAttr(String(photo?.name ?? 'Photo'))}" style="max-width: 100%; height: auto; border-radius: 4px; margin-bottom: 10px; max-height: 200px; object-fit: cover;" />
                ` : ''}
                <div style="margin-top: 10px;">
                  <strong style="font-size: 14px;">${escapeHtmlAttr(String(photo?.name ?? 'Photo'))}</strong><br>
                  <span style="color: #666; font-size: 13px;">Quantity: ${
                    qty[index]
                  } magnet${qty[index] > 1 ? 's' : ''}</span>
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      `
          : ''
      }

      <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #1976d2;">
        <h4 style="margin-top: 0; color: #1976d2;">What's Next?</h4>
        <p style="margin: 0;">${
          status === 'new'
            ? "We're excited to start working on your custom magnets! You'll receive updates as we progress."
            : status === 'in_progress'
            ? "We're carefully crafting your magnets right now! You'll be notified when they're ready."
            : status === 'completed'
            ? shippingOption?.type === 'shipping'
              ? (() => {
                  const shippingMethod = shippingOption.rawLabel || shippingOption.label || 'shipping';
                  return `Your magnets are ready! We'll ship them to you via ${shippingMethod} soon.`;
                })()
              : shippingOption?.type === 'pickup' || shippingOption?.type === 'arranged_pickup'
              ? 'Your magnets are ready! Please contact us to arrange pickup.'
              : 'Your magnets are ready!'
            : 'Thank you for your business!'
        }</p>
      </div>

      <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
        <p>Thank you for choosing Lil Magnet Memories! 🎯</p>
        <p style="font-size: 12px;">This email was automatically generated from your order status update.</p>
      </div>
    </div>
  `;

  // Create plain text version
  const textContent = `
🎯 LIL MAGNET MEMORIES - ${excitementLevel.toUpperCase()}!

${statusMessage}

Order Number: ${orderNumber}
Customer Name: ${firstName} ${lastName}
Total Magnets: ${totalMagnets}
Current Status: ${formatStatusDisplay(status)}
Photos Submitted: ${safePhotos.length}

${safePhotos.length > 0 ? `Your Custom Magnets:\n${photoDetails}\n` : ''}

What's Next: ${
    status === 'new'
      ? "We're excited to start working on your custom magnets! You'll receive updates as we progress."
      : status === 'in_progress'
      ? "We're carefully crafting your magnets right now! You'll be notified when they're ready."
      : status === 'completed'
      ? shippingOption?.type === 'shipping'
        ? (() => {
            const shippingMethod = shippingOption.rawLabel || shippingOption.label || 'shipping';
            return `Your magnets are ready! We'll ship them to you via ${shippingMethod} soon.`;
          })()
        : shippingOption?.type === 'pickup' || shippingOption?.type === 'arranged_pickup'
        ? 'Your magnets are ready! Please contact us to arrange pickup.'
        : 'Your magnets are ready!'
      : 'Thank you for your business!'
  }

Thank you for choosing Lil Magnet Memories! 🎯

This email was automatically generated from your order status update.
  `;

  // Send the email
  const info = await transporter.sendMail({
    from: `"Lil Magnet Memories" <${emailConfig.user}>`,
    to: email, // Send to customer, not admin
    subject: subject,
    text: textContent,
    html: htmlContent,
  });

  console.log(
    '✅ Lil Magnet status update email sent successfully:',
    info.messageId
  );
  return info.messageId;
}

// Helper function to send Lil Magnet Memories contact form emails
async function sendLilMagnetContactEmail(params: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<string> {
  const { name, email, subject, message } = params;

  const emailConfig = getEmailConfig();

  console.log('📧 Using email config:', {
    service: emailConfig.service,
    user: emailConfig.user,
  });

  // Create nodemailer transporter
  const transporter = nodemailer.createTransport({
    service: emailConfig.service,
    auth: {
      user: emailConfig.user,
      pass: emailConfig.password,
    },
  });

  const emailSubject = `Contact Form: ${subject}`;

  // Create HTML email content
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1976d2; margin: 0;">🎯 Lil Magnet Memories</h1>
        <h2 style="color: #333; margin: 10px 0;">New Contact Form Submission</h2>
      </div>

      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #1976d2; margin-top: 0;">Contact Information</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
      </div>

      <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #1976d2;">
        <h3 style="color: #1976d2; margin-top: 0;">Message</h3>
        <div style="white-space: pre-wrap; color: #333; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</div>
      </div>

      <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
        <p>You can reply directly to this email to respond to ${name}.</p>
        <p style="font-size: 12px;">This email was automatically generated from the contact form on your website.</p>
      </div>
    </div>
  `;

  // Create plain text version
  const textContent = `
LIL MAGNET MEMORIES - New Contact Form Submission

Contact Information:
Name: ${name}
Email: ${email}
Subject: ${subject}
Submitted: ${new Date().toLocaleString()}

Message:
${message}

---
You can reply directly to this email to respond to ${name}.
This email was automatically generated from the contact form on your website.
  `;

  // Send the email
  const info = await transporter.sendMail({
    from: `"Lil Magnet Memories Contact Form" <${emailConfig.user}>`,
    to: emailConfig.user,
    replyTo: email, // Allow replying directly to the customer
    subject: emailSubject,
    text: textContent,
    html: htmlContent,
  });

  console.log('✅ Lil Magnet contact email sent successfully:', info.messageId);
  return info.messageId;
}

function getOrderTimestampValue(order: any): number | null {
  const candidates = [
    order?.submissionDateClient,
    order?.submissionDate,
    order?.createdAt,
    order?.timestamp,
    order?.updatedAt,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;

    if (typeof candidate?.toDate === 'function') {
      const asDate = candidate.toDate();
      if (asDate instanceof Date && !Number.isNaN(asDate.getTime())) {
        return asDate.getTime();
      }
    }

    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return candidate;
    }

    if (typeof candidate === 'string') {
      const asDate = new Date(candidate);
      if (!Number.isNaN(asDate.getTime())) {
        return asDate.getTime();
      }
    }
  }

  return null;
}

export const dailyOpenOrdersReminder = functions.pubsub
  .schedule('0 9 * * *')
  .timeZone('America/New_York')
  .onRun(async () => {
    try {
      const emailConfig = getEmailConfig();
      const db = admin.firestore();

      const openStatuses = ['new', 'paid', 'in_progress'];
      const snapshot = await db
        .collection('orders')
        .where('status', 'in', openStatuses)
        .get();

      if (snapshot.empty) {
        console.log('✅ [REMINDER] No open orders at 9:00am. No email sent.');
        return null;
      }

      const appBaseUrl = String(
        process.env.PUBLIC_APP_BASE_URL || 'https://www.lilmagnetmemories.com'
      ).replace(/\/+$/, '');
      const projectId = process.env.GCLOUD_PROJECT || 'lil-magnet-memories';
      const adminOrdersUrl = `${appBaseUrl}/orders`;

      const openOrders = snapshot.docs
        .map((doc) => ({ id: doc.id, ...(doc.data() || {}) }))
        .sort((a: any, b: any) => {
          const aTs = getOrderTimestampValue(a) || 0;
          const bTs = getOrderTimestampValue(b) || 0;
          return aTs - bTs; // oldest first
        });

      const now = Date.now();
      const itemsHtml = openOrders
        .map((order: any) => {
          const orderNumber = String(order.orderNumber || order.id);
          const customerName = `${order.firstName || ''} ${order.lastName || ''}`
            .trim()
            || 'Customer';
          const status = String(order.status || 'new');
          const orderTs = getOrderTimestampValue(order);
          const ageDays =
            orderTs != null
              ? Math.max(0, Math.floor((now - orderTs) / (1000 * 60 * 60 * 24)))
              : null;
          const firestoreLink = `https://console.firebase.google.com/project/${projectId}/firestore/data/~2Forders~2F${encodeURIComponent(order.id)}`;

          return `
            <li style="margin-bottom: 14px;">
              <strong>${orderNumber}</strong> — ${escapeHtmlAttr(customerName)}<br />
              <span>Status: <strong>${escapeHtmlAttr(status)}</strong>${ageDays != null ? ` • Age: ${ageDays} day${ageDays === 1 ? '' : 's'}` : ''}</span><br />
              <a href="${adminOrdersUrl}" target="_blank" rel="noopener noreferrer">Open admin orders list</a>
              &nbsp;|&nbsp;
              <a href="${firestoreLink}" target="_blank" rel="noopener noreferrer">Open Firestore record</a>
            </li>
          `;
        })
        .join('');

      const subject = `URGENT: ${openOrders.length} open order${openOrders.length === 1 ? '' : 's'} pending fulfillment`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 720px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #b91c1c; margin-top: 0;">Urgent order reminder</h2>
          <p style="font-size: 15px;">
            There are <strong>${openOrders.length}</strong> order${openOrders.length === 1 ? '' : 's'} still open as of ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}.
          </p>
          <p>
            <a href="${adminOrdersUrl}" target="_blank" rel="noopener noreferrer"><strong>Go to Orders Admin</strong></a>
          </p>
          <ul style="padding-left: 20px;">
            ${itemsHtml}
          </ul>
        </div>
      `;

      const textLines = openOrders.map((order: any) => {
        const orderNumber = String(order.orderNumber || order.id);
        const customerName = `${order.firstName || ''} ${order.lastName || ''}`
          .trim()
          || 'Customer';
        const status = String(order.status || 'new');
        const orderTs = getOrderTimestampValue(order);
        const ageDays =
          orderTs != null
            ? Math.max(0, Math.floor((now - orderTs) / (1000 * 60 * 60 * 24)))
            : null;
        const firestoreLink = `https://console.firebase.google.com/project/${projectId}/firestore/data/~2Forders~2F${encodeURIComponent(order.id)}`;

        return `- ${orderNumber} (${customerName}) | status=${status}${ageDays != null ? ` | age=${ageDays}d` : ''}\n  Orders: ${adminOrdersUrl}\n  Firestore: ${firestoreLink}`;
      });

      const text = `URGENT: ${openOrders.length} open order${openOrders.length === 1 ? '' : 's'} pending fulfillment\n\nOrders admin: ${adminOrdersUrl}\n\n${textLines.join('\n\n')}`;

      const transporter = nodemailer.createTransport({
        service: emailConfig.service,
        auth: {
          user: emailConfig.user,
          pass: emailConfig.password,
        },
      });

      const info = await transporter.sendMail({
        from: '"Lil Magnet Memories Alerts" <orders@lilmagnetmemories.com>',
        replyTo: 'info@lilmagnetmemories.com',
        to: 'lilmagnetmemories@gmail.com',
        cc: ['amy.helmandarley@gmail.com', 'michael.helmandarley@gmail.com'],
        subject,
        text,
        html,
      });

      console.log(
        `✅ [REMINDER] Sent open-order reminder for ${openOrders.length} orders:`,
        info.messageId
      );
      return null;
    } catch (error) {
      console.error('❌ [REMINDER] Failed to send daily open-order reminder:', error);
      return null;
    }
  });

// Export the Express app as a Firebase Function
export const api = functions.https.onRequest(app);
