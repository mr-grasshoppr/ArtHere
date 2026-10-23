import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { placeAccessWhere } from '@/lib/place-access';
import EventForm from '../EventForm';
import { listCreditableArtists } from '../artists';

export default async function NewEventPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/my-art-here');
  const place = await prisma.place.findFirst({ where: placeAccessWhere(session.user.id), select: { name: true } });
  if (!place) redirect('/my-art-here');
  const artists = await listCreditableArtists();

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-1">Add an event</h1>
        <p className="text-sm text-[#888] mb-6">at {place.name}</p>
        <EventForm
          importable
          artists={artists}
          initial={{ name: '', startDate: '', startTime: '', endDate: '', endTime: '', description: '', link: '', price: '', audience: '', coverImageUrl: null, artistIds: [] }}
        />
      </div>
    </div>
  );
}
