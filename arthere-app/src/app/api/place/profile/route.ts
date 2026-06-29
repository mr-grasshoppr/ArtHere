import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const place = await prisma.place.findUnique({ where: { userId: session.user.id } });
  if (!place) return NextResponse.json({ error: 'No place found for this account' }, { status: 404 });

  const body = await req.json();
  const { name, neighborhood, description, website, heroImageUrl, galleryImages } = body;

  const updated = await prisma.place.update({
    where: { id: place.id },
    data: {
      name: typeof name === 'string' && name.trim() ? name.trim() : place.name,
      neighborhood: typeof neighborhood === 'string' ? neighborhood.trim() || null : undefined,
      description: typeof description === 'string' ? description.trim() || null : undefined,
      website: typeof website === 'string' ? website.trim() || null : undefined,
      heroImageUrl: typeof heroImageUrl === 'string' ? heroImageUrl || null : undefined,
      galleryImages: Array.isArray(galleryImages) ? galleryImages : undefined,
    },
  });

  return NextResponse.json({ ok: true, slug: updated.slug });
}
