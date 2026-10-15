import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { trackEventSchema, parseBody } from '@/lib/schemas';
import { getAdminSession } from '@/lib/admin';
import { sessionCookieName } from '@/lib/auth';
import { isBotUserAgent, isUntrackedPath } from '@/lib/analytics';

// Receives usage events from the browser tracker. Always answers 204 — the
// beacon doesn't read the response, and a quiet "ignored" keeps bots and
// filtered visitors from learning what's counted.
const IGNORED = () => new NextResponse(null, { status: 204 });

const MAX_META_CHARS = 1000;

export async function POST(req: NextRequest) {
  // Only the live site records. Previews and local dev share production's
  // database, so they'd otherwise mix test clicks into the real numbers.
  const forced = process.env.NEXT_PUBLIC_ANALYTICS_FORCE === '1';
  const live = process.env.VERCEL_ENV ? process.env.VERCEL_ENV === 'production' : process.env.NODE_ENV === 'production';
  if (!live && !forced) return IGNORED();

  if (isBotUserAgent(req.headers.get('user-agent'))) return IGNORED();

  const limited = rateLimit(req, 'track', { limit: 120, windowSeconds: 60 });
  if (limited) return IGNORED();

  const raw = await req.json().catch(() => null);
  const event = parseBody(trackEventSchema, raw);
  if (!event || isUntrackedPath(event.path)) return IGNORED();

  const meta = event.meta && JSON.stringify(event.meta).length <= MAX_META_CHARS ? event.meta : undefined;

  // Leave the admin's own browsing out. Anonymous visitors (nearly everyone)
  // have no session cookie, so they skip the database lookup entirely.
  const jar = await cookies();
  if (jar.has(sessionCookieName()) && (await getAdminSession())) return IGNORED();

  try {
    await prisma.analyticsEvent.create({
      data: {
        type: event.type,
        kind: event.kind,
        targetId: event.targetId ?? null,
        path: event.path,
        source: event.source ?? null,
        meta: meta as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (err) {
    console.error('[track] failed to record event', err);
  }
  return IGNORED();
}
