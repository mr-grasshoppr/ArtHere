import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyMagicLinkToken } from '@/lib/magic-link';

const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  const base = req.nextUrl.origin;

  if (!token) {
    return NextResponse.redirect(
      `${base}/profile/link-error?msg=${encodeURIComponent('No token found in this link. Please check your email and try again.')}`
    );
  }

  let result: Awaited<ReturnType<typeof verifyMagicLinkToken>>;
  try {
    result = await verifyMagicLinkToken(token);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'This link is invalid.';
    return NextResponse.redirect(`${base}/profile/link-error?msg=${encodeURIComponent(msg)}`);
  }

  const userId = result.artist?.userId ?? result.place?.userId;
  if (!userId) {
    return NextResponse.redirect(
      `${base}/profile/link-error?msg=${encodeURIComponent('This link is not associated with a valid account.')}`
    );
  }

  const sessionToken = crypto.randomUUID();
  const expires = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  await prisma.session.create({ data: { sessionToken, userId, expires } });

  const isProd = process.env.NODE_ENV === 'production';
  const cookieName = isProd ? '__Secure-authjs.session-token' : 'authjs.session-token';

  const destination = result.place ? '/place/edit' : '/profile';
  const response = NextResponse.redirect(`${base}${destination}`);
  response.cookies.set(cookieName, sessionToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    expires,
  });

  return response;
}
