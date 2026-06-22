import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, '..', 'assets');
const brandColor = '#004E64';
const logoSvgPath = path.join(assetsDir, 'CestaJustaLogo.svg');
const logoSvg = fs.readFileSync(logoSvgPath);

async function solidBackground(size, color) {
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: color,
    },
  })
    .png()
    .toBuffer();
}

async function logoPng(maxWidth) {
  return sharp(logoSvg).resize(maxWidth, null, { fit: 'inside' }).png().toBuffer();
}

async function writeComposite(outputName, size, logoWidth) {
  const background = await solidBackground(size, brandColor);
  const logo = await logoPng(logoWidth);

  await sharp(background)
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(path.join(assetsDir, outputName));

  console.log(`✓ ${outputName}`);
}

async function writeSplashIcon() {
  const logo = await logoPng(280);
  await sharp(logo).png().toFile(path.join(assetsDir, 'splash-icon.png'));
  console.log('✓ splash-icon.png');
}

async function writeMonochrome(size) {
  const logo = await logoPng(640);
  await sharp(logo)
    .flatten({ background: '#FFFFFF' })
    .negate()
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(assetsDir, 'android-icon-monochrome.png'));
  console.log('✓ android-icon-monochrome.png');
}

async function main() {
  await writeComposite('icon.png', 1024, 820);
  await writeComposite('android-icon-foreground.png', 1024, 720);
  await writeSplashIcon();

  const background = await solidBackground(1024, brandColor);
  await sharp(background).png().toFile(path.join(assetsDir, 'android-icon-background.png'));
  console.log('✓ android-icon-background.png');

  await sharp(await logoPng(48))
    .png()
    .toFile(path.join(assetsDir, 'favicon.png'));
  console.log('✓ favicon.png');

  await writeMonochrome(1024);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
