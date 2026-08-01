// Regenerates the feathered, name-labeled slides AnimatedLogoMask scrolls
// through. Run from arthere-app/: node scripts/build-logo-mask-slides.mjs
import sharp from 'sharp';
import path from 'path';

const SRC = path.join(process.cwd(), 'public/images');
const OUT = path.join(process.cwd(), 'public/images');

const W = 1200;
const H = 1050;
const FEATHER = 110; // px, soft dissolve at each edge

const SLIDES = [
  { file: 'Kurtis_Piltz1.jpeg', name: 'Kurtis Piltz', out: 'mask-slide-kurtis.png' },
  { file: 'Kristin_Casaletto_LetItPullMeOut.jpg', name: 'Kristin Casaletto', out: 'mask-slide-kristin1.png' },
  { file: 'Kristin_Casaletto_SavingForLater.jpg', name: 'Kristin Casaletto', out: 'mask-slide-kristin2.png' },
];

const featherPct = (FEATHER / W) * 100;
const gradientSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="white" stop-opacity="0"/>
      <stop offset="${featherPct}%" stop-color="white" stop-opacity="1"/>
      <stop offset="${100 - featherPct}%" stop-color="white" stop-opacity="1"/>
      <stop offset="100%" stop-color="white" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
</svg>`;
const gradientMask = await sharp(Buffer.from(gradientSvg)).png().toBuffer();

for (const slide of SLIDES) {
  const label = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="black" stop-opacity="0"/>
      <stop offset="100%" stop-color="black" stop-opacity="0.55"/>
    </linearGradient>
  </defs>
  <rect x="${FEATHER}" y="${H - 130}" width="${W - FEATHER * 2}" height="130" fill="url(#shade)"/>
  <text x="${W - FEATHER - 34}" y="${H - 40}" text-anchor="end"
        font-family="Helvetica, Arial, sans-serif" font-size="28" font-weight="600"
        fill="white" opacity="0.92">${slide.name}</text>
</svg>`;

  const resized = await sharp(path.join(SRC, slide.file))
    .rotate()
    .resize(W, H, { fit: 'cover', position: 'attention' })
    .png()
    .toBuffer();

  await sharp(resized)
    .composite([
      { input: gradientMask, blend: 'dest-in' },
    ])
    .composite([
      { input: Buffer.from(label) },
    ])
    .png()
    .toFile(path.join(OUT, slide.out));

  console.log('wrote', slide.out);
}
