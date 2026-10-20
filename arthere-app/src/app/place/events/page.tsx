import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { placeAccessWhere } from '@/lib/place-access';
import { formatEventWhen } from '@/lib/events';
import DeleteEventButton from './DeleteEventButton';

const STATUS_LABEL = { PENDING: 'Awaiting review', PUBLISHED: 'Live', HIDDEN: 'Not shown' } as const;

export default async function PlaceEventsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/my-art-here');
  const { saved } = await searchParams;

  const place = await prisma.place.findFirst({
    where: placeAccessWhere(session.user.id),
    select: { name: true, events: { orderBy: { startsAt: 'desc' } } },
  });
  if (!place) redirect('/my-art-here');

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/place/edit" className="text-sm text-[#888] hover:text-[#1a1a1a]">← Back to {place.name}</Link>
        <div className="flex items-center justify-between mt-4 mb-6">
          <h1 className="text-2xl font-semibold">Events</h1>
          <Link href="/place/events/new" className="px-5 py-2 rounded-full bg-[#1a1a1a] text-white text-sm font-medium hover:opacity-80">+ Add an event</Link>
        </div>
        {saved && <p className="mb-4 text-sm text-green-700">Thanks! Your event was saved and will go live once the Art Here team has looked it over.</p>}
        {place.events.length === 0 ? (
          <p className="text-sm text-[#888]">No events yet. Add your next show, opening or workshop.</p>
        ) : (
          <ul className="divide-y divide-[#eee]">
            {place.events.map((e) => (
              <li key={e.id} className="py-4 flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{e.name}</p>
                  <p className="text-sm text-[#777]">{formatEventWhen(e)}</p>
                  <p className="text-xs text-[#aaa] mt-1">{STATUS_LABEL[e.status]}</p>
                </div>
                <div className="flex items-center gap-4 text-sm shrink-0">
                  <Link href={`/place/events/${e.id}`} className="underline">Edit</Link>
                  <DeleteEventButton id={e.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
