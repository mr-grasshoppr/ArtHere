'use client';

import { useRouter } from 'next/navigation';

export default function DeleteEventButton({ id }: { id: string }) {
  const router = useRouter();
  return (
    <button
      className="text-[#b33] underline"
      onClick={async () => {
        if (!confirm('Delete this event?')) return;
        const res = await fetch(`/api/place/events/${id}`, { method: 'DELETE' });
        if (res.ok) router.refresh();
        else alert('Could not delete the event. Please try again.');
      }}
    >
      Delete
    </button>
  );
}
