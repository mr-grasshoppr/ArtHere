import { NextRequest, NextResponse } from 'next/server';

const DEMO_TOKEN = process.env.DEMO_TOKEN ?? 'J3xqN8vM';
const COOKIE = 'portland_demo';

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  if (pathname.startsWith('/cities/portland')) {
    const keyFromUrl = searchParams.get('key');
    const keyFromCookie = req.cookies.get(COOKIE)?.value;

    if (keyFromUrl === DEMO_TOKEN) {
      // Valid key in URL — grant access and set a session cookie
      const res = NextResponse.next();
      res.cookies.set(COOKIE, DEMO_TOKEN, { httpOnly: true, sameSite: 'lax', path: '/' });
      return res;
    }

    if (keyFromCookie === DEMO_TOKEN) {
      // Already authenticated via cookie
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/cities/portland', '/cities/portland/:path*'],
};
