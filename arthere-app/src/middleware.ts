import { NextRequest, NextResponse } from 'next/server';

// Token required to access the Portland city pages during the demo.
// Share the URL with ?key=<DEMO_TOKEN> — anyone without it gets redirected home.
const DEMO_TOKEN = process.env.DEMO_TOKEN ?? 'J3xqN8vM';

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  if (pathname.startsWith('/cities/portland')) {
    if (searchParams.get('key') !== DEMO_TOKEN) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/cities/portland', '/cities/portland/:path*'],
};
