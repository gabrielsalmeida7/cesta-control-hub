import { writeFileSync, copyFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const assetsDir = join(__dirname, '..', 'assets');

// Minimal 1x1 PNG with primary color (#004E64) - valid PNG
const pngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const pngBuffer = Buffer.from(pngBase64, 'base64');
const files = [
  'icon.png',
  'favicon.png',
  'android-icon-foreground.png',
  'android-icon-background.png',
  'android-icon-monochrome.png',
  'splash-icon.png',
];

for (const file of files) {
  writeFileSync(join(assetsDir, file), pngBuffer);
}

console.log('Assets created in', assetsDir);
