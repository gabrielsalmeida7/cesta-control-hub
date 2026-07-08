import sharp from "sharp";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const publicDir = path.join(rootDir, "public");
const iconsDir = path.join(publicDir, "icons");
const sourceSvg = path.join(publicDir, "CestaLogin.svg");
const backgroundColor = "#004E64";

const sizes = [
  { name: "icon-192.png", size: 192, maskable: false },
  { name: "icon-512.png", size: 512, maskable: false },
  { name: "icon-512-maskable.png", size: 512, maskable: true },
];

const extraOutputs = [
  { name: "apple-touch-icon.png", size: 180, maskable: false, dir: publicDir },
  { name: "favicon-32x32.png", size: 32, maskable: false, dir: publicDir },
  { name: "favicon-16x16.png", size: 16, maskable: false, dir: publicDir },
];

async function createIcon({ size, maskable }) {
  const logoScale = maskable ? 0.55 : 0.72;
  const logoSize = Math.round(size * logoScale);
  const logoOffset = Math.round((size - logoSize) / 2);

  const logoBuffer = await sharp(sourceSvg)
    .resize(logoSize, logoSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: backgroundColor,
    },
  })
    .composite([{ input: logoBuffer, top: logoOffset, left: logoOffset }])
    .png()
    .toBuffer();
}

async function main() {
  await mkdir(iconsDir, { recursive: true });
  await readFile(sourceSvg);

  for (const item of sizes) {
    const buffer = await createIcon(item);
    const outputPath = path.join(iconsDir, item.name);
    await sharp(buffer).toFile(outputPath);
    console.log(`Generated ${outputPath}`);
  }

  for (const item of extraOutputs) {
    const buffer = await createIcon(item);
    const outputPath = path.join(item.dir, item.name);
    await sharp(buffer).toFile(outputPath);
    console.log(`Generated ${outputPath}`);
  }

  const favicon32 = await sharp(path.join(publicDir, "favicon-32x32.png")).toBuffer();
  await sharp(favicon32).resize(16, 16).toFile(path.join(publicDir, "favicon.ico"));
  console.log(`Generated ${path.join(publicDir, "favicon.ico")}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
