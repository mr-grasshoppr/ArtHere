import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { placeAccessWhere } from '@/lib/place-access';
import { saveEventFromForm } from '@/lib/event-save';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const place = await prisma.place.findFirst({ where: placeAccessWhere(session.user.id), select: { id: true, slug: true } });
  if (!place) return NextResponse.json({ error: 'No place found for this account' }, { status: 404 });
  return saveEventFromForm(await req.formData(), place);
}
