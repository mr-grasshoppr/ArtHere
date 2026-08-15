import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { placeAccessWhere } from '@/lib/place-access';
import { sendPlaceMagicLink } from '@/lib/magic-link';

// Self-service team management — any current editor (owner or member) can
// invite or remove another. Admin has the equivalent via
// admin/organizations/actions.ts (addPlaceTeamMember / removePlaceTeamMember).

async function currentPlace(userId: string) {
  return prisma.place.findFirst({
    where: placeAccessWhere(userId),
    select: {
      id: true,
      name: true,
      userId: true,
      user: { select: { email: true } },
      members: {
        select: { userId: true, user: { select: { email: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const place = await currentPlace(session.user.id);
  if (!place) return NextResponse.json({ error: 'No place found for this account' }, { status: 404 });

  const team = [
    ...(place.userId && place.user ? [{ userId: place.userId, email: place.user.email, role: 'owner' as const }] : []),
    ...place.members.map((m) => ({ userId: m.userId, email: m.user.email, role: 'member' as const })),
  ];

  return NextResponse.json({ team });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const place = await currentPlace(session.user.id);
  if (!place) return NextResponse.json({ error: 'No place found for this account' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email) return NextResponse.json({ error: 'An email is required' }, { status: 400 });

  const user = await prisma.user.upsert({ where: { email }, create: { email }, update: {} });

  if (user.id === place.userId) {
    return NextResponse.json({ error: `${email} already has access to this page.` }, { status: 400 });
  }

  await prisma.placeMember.upsert({
    where: { placeId_userId: { placeId: place.id, userId: user.id } },
    create: { placeId: place.id, userId: user.id },
    update: {},
  });

  await sendPlaceMagicLink({ email, placeId: place.id, placeName: place.name, variant: 'welcome' });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const place = await currentPlace(session.user.id);
  if (!place) return NextResponse.json({ error: 'No place found for this account' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const userId = typeof body?.userId === 'string' ? body.userId : '';
  if (!userId) return NextResponse.json({ error: 'A userId is required' }, { status: 400 });

  if (userId === place.userId) {
    return NextResponse.json({ error: "The page's owner can't be removed here." }, { status: 400 });
  }

  await prisma.placeMember.deleteMany({ where: { placeId: place.id, userId } });

  return NextResponse.json({ ok: true });
}
