import dns from 'node:dns/promises';
import net from 'node:net';

/** True for loopback, private, link-local and other non-public addresses. */
export function isPrivateAddress(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return (
      a === 0 || a === 10 || a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    );
  }
  const v6 = ip.toLowerCase();
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(v6);
  if (mapped) return isPrivateAddress(mapped[1]);
  return v6 === '::' || v6 === '::1' || v6.startsWith('fc') || v6.startsWith('fd') || v6.startsWith('fe8') || v6.startsWith('fe9') || v6.startsWith('fea') || v6.startsWith('feb');
}

export interface SafeFetchResult {
  finalUrl: string;
  contentType: string;
  body: Buffer;
}

const MAX_REDIRECTS = 4;

/**
 * Fetch a user-supplied URL without letting it reach our own network:
 * http(s) only, every hop's host must resolve to public addresses, bounded
 * time and size. Throws a user-presentable Error on any problem.
 */
export async function safeFetch(rawUrl: string, opts: { maxBytes?: number; timeoutMs?: number } = {}): Promise<SafeFetchResult> {
  const maxBytes = opts.maxBytes ?? 8 * 1024 * 1024;
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error('That doesn’t look like a web address.');
  }

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('Only web addresses (http/https) can be used.');
    if (url.port && !['80', '443'].includes(url.port)) throw new Error('That address can’t be used.');
    const host = url.hostname.replace(/^\[|\]$/g, '');
    const addrs = net.isIP(host) ? [{ address: host }] : await dns.lookup(host, { all: true }).catch(() => []);
    if (addrs.length === 0 || addrs.some((a) => isPrivateAddress(a.address))) throw new Error('We couldn’t reach that address.');

    const res = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(opts.timeoutMs ?? 12_000),
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; ArtHereBot/1.0; +https://artishere.org)', accept: 'text/html,application/pdf,image/*;q=0.9,*/*;q=0.5' },
    }).catch(() => null);
    if (!res) throw new Error('We couldn’t reach that address.');

    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      url = new URL(res.headers.get('location')!, url);
      continue;
    }
    if (!res.ok) throw new Error(`That page wouldn’t open for us (error ${res.status}).`);

    const declared = Number(res.headers.get('content-length') ?? 0);
    if (declared > maxBytes) throw new Error('That file is too large.');
    const reader = res.body?.getReader();
    if (!reader) throw new Error('That page was empty.');
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > maxBytes) {
        await reader.cancel();
        throw new Error('That file is too large.');
      }
      chunks.push(value);
    }
    return { finalUrl: url.toString(), contentType: (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase(), body: Buffer.concat(chunks) };
  }
  throw new Error('That address redirected too many times.');
}
