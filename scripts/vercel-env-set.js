#!/usr/bin/env node
/**
 * Set Vercel environment variables from .env / .env.local via Vercel REST API.
 * Use for Preview (test site). Requires VERCEL_TOKEN.
 *
 * Usage (from repo root):
 *   VERCEL_TOKEN=xxx node scripts/vercel-env-set.js [--preview] [--branch test-environment]
 *   VERCEL_TOKEN=xxx node scripts/vercel-env-set.js --production
 *
 * Reads VITE_* from .env and .env.local (.env.local overrides .env).
 * For --preview (default), also sets VITE_IS_TEST_ENVIRONMENT=true and uses gitBranch if given.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const repoRoot = path.resolve(__dirname, '..');

function loadEnv(filePath) {
  const full = path.join(repoRoot, filePath);
  if (!fs.existsSync(full)) return {};
  const content = fs.readFileSync(full, 'utf8');
  const out = {};
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
      val = val.slice(1, -1).replace(/\\"/g, '"');
    out[m[1]] = val;
  }
  return out;
}

function getEnv() {
  const env = { ...loadEnv('.env'), ...loadEnv('.env.local') };
  return env;
}

function parseArgs() {
  const args = process.argv.slice(2);
  let target = 'preview';
  let gitBranch = 'test-environment';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--production') target = 'production';
    if (args[i] === '--preview') target = 'preview';
    if (args[i] === '--branch' && args[i + 1]) gitBranch = args[++i];
  }
  return { target, gitBranch };
}

function getProjectName() {
  const p = path.join(repoRoot, '.vercel', 'project.json');
  if (fs.existsSync(p)) {
    try {
      const j = JSON.parse(fs.readFileSync(p, 'utf8'));
      if (j.projectId || j.name) return j.projectId || j.name;
    } catch (_) {}
  }
  return 'lil-magnet-memories';
}

const VITE_KEYS = [
  'VITE_IS_TEST_ENVIRONMENT',
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_API_KEY_TEST',
  'VITE_FIREBASE_AUTH_DOMAIN_TEST',
  'VITE_FIREBASE_PROJECT_ID_TEST',
  'VITE_FIREBASE_STORAGE_BUCKET_TEST',
  'VITE_FIREBASE_MESSAGING_SENDER_ID_TEST',
  'VITE_FIREBASE_APP_ID_TEST',
  'VITE_SQUARE_APPLICATION_ID',
  'VITE_SQUARE_LOCATION_ID',
  'VITE_GOOGLE_PLACES_API_KEY',
  'VITE_GOOGLE_PLACE_ID',
  'VITE_GOOGLE_REVIEW_URL',
  'VITE_EMAILJS_SERVICE_ID',
  'VITE_EMAILJS_TEMPLATE_ID',
  'VITE_EMAILJS_PUBLIC_KEY',
  'VITE_FIREBASE_APPCHECK_SITE_KEY',
];

function httpsRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (ch) => (data += ch));
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          if (res.statusCode >= 400) reject(new Error(json.error?.message || data || res.statusCode));
          else resolve(json);
        } catch (e) {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

async function main() {
  const token = process.env.VERCEL_TOKEN;
  if (!token) {
    console.error('Error: Set VERCEL_TOKEN (create at https://vercel.com/account/tokens)');
    process.exit(1);
  }

  const { target, gitBranch } = parseArgs();
  const env = getEnv();
  const projectName = getProjectName();
  const teamId = process.env.VERCEL_TEAM_ID;

  const payload = [];
  for (const key of VITE_KEYS) {
    let value = env[key];
    if (key === 'VITE_IS_TEST_ENVIRONMENT' && target === 'preview') value = value || 'true';
    if (value === undefined || value === '') continue;
    payload.push({
      key,
      value: String(value),
      type: 'plain',
      target: [target],
      ...(target === 'preview' && gitBranch ? { gitBranch } : {}),
    });
  }

  if (payload.length === 0) {
    console.error('No VITE_* variables found in .env or .env.local. Add at least one to sync.');
    process.exit(1);
  }

  let url = `https://api.vercel.com/v10/projects/${encodeURIComponent(projectName)}/env?upsert=true`;
  if (teamId) url += `&teamId=${encodeURIComponent(teamId)}`;

  const options = {
    hostname: 'api.vercel.com',
    path: new URL(url).pathname + new URL(url).search,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  console.log(`Project: ${projectName}`);
  console.log(`Target: ${target}${target === 'preview' && gitBranch ? ` (branch: ${gitBranch})` : ''}`);
  console.log(`Setting ${payload.length} variable(s)...`);

  try {
    const result = await httpsRequest(options, payload);
    const created = Array.isArray(result) ? result : result.envs || [result];
    console.log(`Done. ${created.length} env var(s) set/updated.`);
  } catch (err) {
    console.error('API error:', err.message);
    process.exit(1);
  }
}

main();
