// Reusable image backup — downloads every file in Blob storage to a dated
// local folder outside the repo. Safe to run anytime; it only reads.
//
//   BLOB_READ_WRITE_TOKEN=... node scripts/backup-images.mjs
//
// The token is read from the environment, or from arthere-app/.env.local if not
// already set (so a scheduled job doesn't need it inlined). Backups land in
// ~/ArtHere-image-backups/<YYYY-MM-DD>/, mirroring the storage folder layout.
import { list } from '@vercel/blob';
import { mkdir, writeFile, readFile } from 'fs/promises';
import path from 'path';
import os from 'os';

async function loadToken() {
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN;
  try {
    const env = await readFile(path.join(process.cwd(), '.env.local'), 'utf8');
    const m = env.match(/^BLOB_READ_WRITE_TOKEN\s*=\s*"?([^"\n]+)"?/m);
    if (m) return (process.env.BLOB_READ_WRITE_TOKEN = m[1]);
  } catch { /* fall through */ }
  throw new Error('BLOB_READ_WRITE_TOKEN not set and not found in .env.local');
}

async function main() {
  await loadToken();
  const date = new Date().toISOString().slice(0, 10);
  const dest = path.join(os.homedir(), 'ArtHere-image-backups', date);

  let cursor, all = [];
  do {
    const res = await list({ cursor, limit: 1000 });
    all.push(...res.blobs);
    cursor = res.cursor;
  } while (cursor);

  console.log(`[${new Date().toISOString()}] Backing up ${all.length} files -> ${dest}`);
  let done = 0, failed = 0;
  for (const b of all) {
    const out = path.join(dest, b.pathname);
    await mkdir(path.dirname(out), { recursive: true });
    try {
      const r = await fetch(b.url);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      await writeFile(out, Buffer.from(await r.arrayBuffer()));
      done++;
    } catch (e) {
      failed++;
      console.error('FAILED', b.pathname, e.message);
    }
  }
  console.log(`Done: ${done} downloaded, ${failed} failed.`);
  if (failed > 0) process.exitCode = 1;
}

main().catch(err => { console.error(err); process.exit(1); });
