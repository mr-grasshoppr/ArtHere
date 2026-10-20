import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { notFound, redirect } from 'next/navigation';
import { placeAccessWhere } from '@/lib/place-access';
import { utcToZoned } from '@/lib/events';
import EventForm from '../EventForm';
import { listCreditableArtists } from '../artists';

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/my-art-here');
  const { id } = await params;
  const place = await prisma.place.findFirst({ where: placeAccessWhere(session.user.id), select: { id: true, name: true } });
  if (!place) redirect('/my-art-here');
  const event = await prisma.event.findFirst({ where: { id, placeId: place.id }, include: { artists: true } });
  if (!event) notFound();
  const artists = await listCreditableArtists();

  const start = utcToZoned(event.startsAt);
  const end = event.endsAt ? utcToZoned(event.endsAt) : null;
  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-1">Edit event</h1>
        <p className="text-sm text-[#888] mb-6">at {place.name}</p>
        <EventForm
          artists={artists}
          initial={{
            id: event.id,
            name: event.name,
            startDate: start.date,
            startTime: event.allDay ? '' : start.time,
            endDate: end?.date ?? '',
            endTime: end && !(event.allDay && end.time === '23:59') ? end.time : '',
            description: event.description ?? '',
            coverImageUrl: event.coverImageUrl,
            artistIds: event.artists.map((a) => a.artistId),
          }}
        />
      </div>
    </div>
  );
}
