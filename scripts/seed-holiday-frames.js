#!/usr/bin/env node

/**
 * Seed USA holiday frames into Firestore + Storage and set featured schedules.
 *
 * Usage:
 *   TEST_SERVICE_ACCOUNT_PATH=./test-service-account.json node scripts/seed-holiday-frames.js
 *   node scripts/seed-holiday-frames.js --project test
 */

const admin = require('firebase-admin');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { RgbaImage, bakeFrameOverlay, DEFAULT_CUTOUT } = require('./lib/rgbaImage');
const { HOLIDAY_FRAMES, buildBuilderRecipe } = require('./lib/holidayFrameCatalog');

const PROJECTS = {
  test: 'lil-magnet-memories-test',
  prod: 'lil-magnet-memories',
};

const STORAGE_BUCKETS = {
  test: 'lil-magnet-memories-test.firebasestorage.app',
  prod: 'lil-magnet-memories.firebasestorage.app',
};

function resolveServiceAccount(projectKey) {
  const envKey =
    projectKey === 'test' ? process.env.TEST_SERVICE_ACCOUNT_PATH : process.env.PROD_SERVICE_ACCOUNT_PATH;
  const candidates = [
    envKey,
    projectKey === 'test' ? './test-service-account.json' : './prod-service-account.json',
  ].filter(Boolean);

  for (const candidate of candidates) {
    const resolved = path.resolve(candidate);
    if (fs.existsSync(resolved)) return resolved;
  }
  throw new Error(`Service account not found. Set TEST_SERVICE_ACCOUNT_PATH or PROD_SERVICE_ACCOUNT_PATH.`);
}

function initAdmin(projectKey) {
  const accountPath = resolveServiceAccount(projectKey);
  const serviceAccount = JSON.parse(fs.readFileSync(accountPath, 'utf8'));
  const projectId = PROJECTS[projectKey] || serviceAccount.project_id;
  const storageBucket = STORAGE_BUCKETS[projectKey] || `${projectId}.firebasestorage.app`;
  return admin.initializeApp(
    {
      credential: admin.credential.cert(serviceAccount),
      storageBucket,
    },
    `seed-holiday-${projectKey}`
  );
}

async function uploadBuffer(bucket, storagePath, buffer, contentType) {
  const file = bucket.file(storagePath);
  const token = crypto.randomUUID();
  await file.save(buffer, {
    metadata: {
      contentType,
      metadata: { firebaseStorageDownloadTokens: token },
    },
    resumable: false,
  });
  const encodedPath = encodeURIComponent(storagePath);
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${token}`;
}

async function seedHolidayFrames(projectKey = 'test') {
  const app = initAdmin(projectKey);
  const db = admin.firestore(app);
  const bucket = admin.storage(app).bucket();

  console.log(`\n🎨 Seeding holiday frames to ${PROJECTS[projectKey] || projectKey}\n`);

  const featuredSchedules = [];
  let created = 0;
  let skipped = 0;
  let sortOrder = 100;

  for (const def of HOLIDAY_FRAMES) {
    const frameRef = db.collection('frames').doc(def.id);
    const existing = await frameRef.get();
    if (existing.exists && !process.env.FORCE_HOLIDAY_RESEED) {
      console.log(`   ↷ Skipping existing: ${def.name}`);
      skipped += 1;
      featuredSchedules.push({
        frameId: def.id,
        startDate: def.schedule.startDate,
        endDate: def.schedule.endDate,
        priority: def.schedule.priority,
      });
      continue;
    }

    const sourceImg = new RgbaImage();
    def.draw(sourceImg);
    const overlayImg = bakeFrameOverlay(sourceImg, DEFAULT_CUTOUT);

    const sourcePath = `frames/${def.id}/source.png`;
    const framePath = `frames/${def.id}/frame.png`;
    const sourceBuffer = sourceImg.toPngBuffer();
    const frameBuffer = overlayImg.toPngBuffer();

    const [imageUrl, sourceUrl] = await Promise.all([
      uploadBuffer(bucket, framePath, frameBuffer, 'image/png'),
      uploadBuffer(bucket, sourcePath, sourceBuffer, 'image/png'),
    ]);

    const builderRecipe = buildBuilderRecipe(DEFAULT_CUTOUT);
    builderRecipe.sourceImagePath = sourcePath;

    const frameRecord = {
      id: def.id,
      name: def.name,
      imageUrl,
      storagePath: framePath,
      thumbnailUrl: imageUrl,
      isPublic: true,
      sortOrder: sortOrder++,
      tags: def.tags,
      sourceType: 'built',
      builderRecipe,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: 'seed-holiday-frames',
    };

    await frameRef.set(frameRecord, { merge: true });
    created += 1;
    console.log(`   ✓ ${def.name}`);

    featuredSchedules.push({
      frameId: def.id,
      startDate: def.schedule.startDate,
      endDate: def.schedule.endDate,
      priority: def.schedule.priority,
    });
  }

  const configRef = db.doc('frameCatalog/config');
  const existingConfig = await configRef.get();
  const manualSchedules = existingConfig.exists
    ? (existingConfig.data().featuredSchedules || []).filter(
        (s) => !String(s.frameId || '').startsWith('holiday_')
      )
    : [];

  await configRef.set(
    {
      featuredSchedules: [...manualSchedules, ...featuredSchedules],
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  console.log(`\n✅ Done: ${created} created, ${skipped} skipped`);
  console.log(`📅 Featured schedules: ${featuredSchedules.length} holiday entries\n`);
}

const projectArg = process.argv.includes('--project')
  ? process.argv[process.argv.indexOf('--project') + 1]
  : 'test';

seedHolidayFrames(projectArg).catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
