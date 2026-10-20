import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { placeAccessWhere } from '@/lib/place-access';
import { saveEventFromForm } from '@/lib/event-save';

async function placeFor(userId: string) {
  return prisma.place.findFirst({ where: placeAccessWhere(userId), select: { id: true, slug: true } });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const place = await placeFor(session.user.id);
  if (!place) return NextResponse.json({ error: 'No place found for this account' }, { status: 404 });
  const { id } = await params;
  return saveEventFromForm(await req.formData(), place, id);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const place = await placeFor(session.user.id);
  if (!place) return NextResponse.json({ error: 'No place found for this account' }, { status: 404 });
  const { id } = await params;
  const { count } = await prisma.event.deleteMany({ where: { id, placeId: place.id } });
  return count ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'Event not found' }, { status: 404 });
}
