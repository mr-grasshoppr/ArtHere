import { put } from '@vercel/blob';
import { prisma } from '@/lib/db';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://artishere.org';
const LOCAL_CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

/**
 * Renders the live public page for an artist or place in headless Chromium and
 * stores the result in Vercel Blob (public URL, so an email can embed it).
 * Captures the top of the page at desktop width — what a visitor sees first.
 */
export async function captureProfileScreenshot(kind: 'artist' | 'place', id: string): Promise<string> {
  const record =
    kind === 'artist'
      ? await prisma.artist.findUnique({ where: { id }, select: { slug: true } })
      : await prisma.place.findUnique({ where: { id }, select: { slug: true } });
  if (!record) throw new Error('Profile not found');

  const url = `${BASE_URL}/${kind === 'artist' ? 'artists' : 'places'}/${record.slug}`;

  const puppeteer = (await import('puppeteer-core')).default;
  let executablePath = LOCAL_CHROME;
  let args: string[] = [];
  if (process.env.VERCEL) {
    const chromium = (await import('@sparticuz/chromium')).default;
    executablePath = await chromium.executablePath();
    args = chromium.args;
  }

  const browser = await puppeteer.launch({ executablePath, args, headless: true });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1500, deviceScaleFactor: 1 });
    const res = await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    if (!res || !res.ok()) throw new Error(`Page returned ${res?.status() ?? 'no response'}`);
    const buf = Buffer.from(await page.screenshot({ type: 'jpeg', quality: 82 }));
    const blob = await put(`screenshots/${kind}-${record.slug}-${Date.now()}.jpg`, buf, {
      access: 'public',
      addRandomSuffix: true,
      contentType: 'image/jpeg',
    });
    return blob.url;
  } finally {
    await browser.close();
  }
}
