import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';

// Typeahead for the artist profile venue field. Returns existing venue PAGES
// whose name matches the query, so an artist links to a real page rather than
// creating a near-duplicate by free-typing. Powers the "did you mean…"
// disambiguation prompt.
//
//   GET /api/places/search?q=multnomah
export async function GET(req: NextRequest) {
  const limited = rateLimit(req, 'places-search', { limit: 60, windowSeconds: 600 });
  if (limited) return limited;

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) return NextResponse.json({ places: [] });

  const places = await prisma.place.findMany({
    where: {
      inDirectory: true,
      isArchived: false,
      name: { contains: q, mode: 'insensitive' },
    },
    select: { id: true, name: true, slug: true },
    orderBy: { name: 'asc' },
    take: 6,
  });

  return NextResponse.json({ places });
}
