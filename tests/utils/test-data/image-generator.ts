/**
 * Image Generator Utility
 * Creates test images programmatically for testing
 */

import { writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Generate a simple test image (1x1 pixel PNG)
 * In a real implementation, you might use a library like 'sharp' or 'jimp'
 * For now, we'll create a minimal valid PNG
 */
export function generateTestImage(
  filename: string,
  width: number = 100,
  height: number = 100
): string {
  const fixturesDir = join(process.cwd(), 'tests', 'fixtures', 'images');

  // Create a minimal valid PNG (1x1 red pixel)
  // This is a base64-encoded minimal PNG
  const minimalPNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );

  const filePath = join(fixturesDir, filename);
  writeFileSync(filePath, minimalPNG);
  return filePath;
}

/**
 * Generate multiple test images
 */
export function generateTestImages(
  count: number,
  prefix: string = 'test-photo'
): string[] {
  const paths: string[] = [];
  for (let i = 1; i <= count; i++) {
    const filename = `${prefix}-${i}.png`;
    paths.push(generateTestImage(filename));
  }
  return paths;
}

/**
 * Get path to test image fixture
 */
export function getTestImagePath(filename: string): string {
  return join(process.cwd(), 'tests', 'fixtures', 'images', filename);
}

