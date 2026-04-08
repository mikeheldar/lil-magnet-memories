/**
 * Cloudflare Worker: route crawler User-Agents to Prerender.io for Firebase Hosting SPAs.
 * Source: Prerender.io Firebase integration (maintained gist).
 * @see https://docs.prerender.io/docs/firebase
 *
 * Deploy: Cloudflare Dashboard → Workers → create worker → paste this file →
 * add route (e.g. lilmagnetmemories.com/*) → set secret PRERENDER_TOKEN.
 *
 * Or: wrangler deploy (see wrangler.toml.example).
 */

// User agents handled by Prerender
const BOT_AGENTS = [
  'googlebot',
  'yahoo! slurp',
  'bingbot',
  'yandex',
  'baiduspider',
  'facebookexternalhit',
  'twitterbot',
  'rogerbot',
  'linkedinbot',
  'embedly',
  'quora link preview',
  'showyoubot',
  'outbrain',
  'pinterest/0.',
  'developers.google.com/+/web/snippet',
  'slackbot',
  'vkshare',
  'w3c_validator',
  'redditbot',
  'applebot',
  'whatsapp',
  'flipboard',
  'tumblr',
  'bitlybot',
  'skypeuripreview',
  'nuzzel',
  'discordbot',
  'google page speed',
  'qwantify',
  'pinterestbot',
  'bitrix link preview',
  'xing-contenttabreceiver',
  'chrome-lighthouse',
  'telegrambot',
  'integration-test',
  'google-inspectiontool',
];

const IGNORE_EXTENSIONS = [
  '.js',
  '.css',
  '.xml',
  '.less',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.pdf',
  '.doc',
  '.txt',
  '.ico',
  '.rss',
  '.zip',
  '.mp3',
  '.rar',
  '.exe',
  '.wmv',
  '.avi',
  '.ppt',
  '.mpg',
  '.mpeg',
  '.tif',
  '.wav',
  '.mov',
  '.psd',
  '.ai',
  '.xls',
  '.mp4',
  '.m4a',
  '.swf',
  '.dat',
  '.dmg',
  '.iso',
  '.flv',
  '.m4v',
  '.torrent',
  '.woff',
  '.ttf',
  '.svg',
  '.webmanifest',
];

export default {
  /**
   * @param {Request} request
   * @param {{ PRERENDER_TOKEN: string }} env
   */
  async fetch(request, env) {
    return await handleRequest(request, env).catch(
      (err) => new Response(err.stack, { status: 500 })
    );
  },
};

/**
 * @param {Request} request
 * @param {{ PRERENDER_TOKEN: string }} env
 */
async function handleRequest(request, env) {
  const url = new URL(request.url);
  const userAgent = request.headers.get('User-Agent')?.toLowerCase() || '';
  const isPrerender = request.headers.get('X-Prerender');
  const pathName = url.pathname.toLowerCase();
  const dot = pathName.lastIndexOf('.');
  const extension = dot >= 0 ? pathName.slice(dot) : '';

  if (
    isPrerender ||
    !BOT_AGENTS.some((bot) => userAgent.includes(bot)) ||
    (extension.length && IGNORE_EXTENSIONS.includes(extension))
  ) {
    return fetch(request);
  }

  const token = env.PRERENDER_TOKEN;
  if (!token) {
    return new Response('PRERENDER_TOKEN is not set on the Worker', {
      status: 500,
    });
  }

  const newURL = `https://service.prerender.io/${request.url}`;
  const newHeaders = new Headers(request.headers);
  newHeaders.set('X-Prerender-Token', token);

  return fetch(
    new Request(newURL, {
      headers: newHeaders,
      redirect: 'manual',
    })
  );
}
