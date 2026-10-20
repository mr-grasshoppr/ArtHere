import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { formatEventWhen } from "@/lib/events";
import { EventModeration } from "./EventModeration";
import { SendPromptPanel } from "./SendPromptPanel";
import { SubmissionActions } from "./SubmissionActions";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  await requireAdmin();
  const [events, places, sends, submissions] = await Promise.all([
    prisma.event.findMany({
      orderBy: [{ status: "asc" }, { startsAt: "asc" }],
      include: { place: { select: { name: true } }, artists: { include: { artist: { select: { name: true } } } } },
    }),
    prisma.place.findMany({
      where: { isArchived: false },
      orderBy: { name: "asc" },
      select: { id: true, name: true, user: { select: { email: true } } },
    }),
    prisma.outreachRecipient.findMany({
      where: { message: { subject: { startsWith: "Have an event coming up" } }, status: "sent" },
      orderBy: { sentAt: "desc" },
      select: { email: true, sentAt: true },
    }),
    prisma.eventSubmission.findMany({
      where: { handledAt: null },
      orderBy: { createdAt: "asc" },
      include: { place: { select: { name: true } } },
    }),
  ]);

  const lastByEmail = new Map<string, Date>();
  for (const s of sends) if (s.sentAt && !lastByEmail.has(s.email)) lastByEmail.set(s.email, s.sentAt);

  const pending = events.filter((e) => e.status === "PENDING");
  const rest = events.filter((e) => e.status !== "PENDING");

  const row = (e: (typeof events)[number]) => (
    <li key={e.id} className="py-3 flex items-start justify-between gap-4">
      <div className="text-sm">
        <p className="font-medium">{e.name} <span className="text-[#999] font-normal">· {e.place.name}</span></p>
        <p className="text-[#777]">{formatEventWhen(e)}</p>
        {e.artists.length > 0 && <p className="text-xs text-[#999]">With {e.artists.map((a) => a.artist.name).join(", ")}</p>}
        {e.description && <p className="text-xs text-[#888] mt-1 max-w-xl">{e.description}</p>}
        <p className="text-xs text-[#aaa] mt-1">{e.status === "HIDDEN" ? "Hidden" : e.status === "PUBLISHED" ? "Live" : "Awaiting review"}</p>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {e.coverImageUrl && <img src={e.coverImageUrl} alt="" className="w-28 aspect-[16/9] object-cover rounded" />}
      <EventModeration id={e.id} status={e.status} />
    </li>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-10">
      <section>
        <h1 className="text-xl font-semibold mb-3">Submitted through “Get listed” ({submissions.length})</h1>
        {submissions.length === 0 ? <p className="text-sm text-[#888]">Nothing waiting.</p> : (
          <ul className="divide-y divide-[#eee]">
            {submissions.map((s) => (
              <li key={s.id} className="py-3 flex items-start justify-between gap-4">
                <div className="text-sm">
                  <p className="font-medium">{s.name}</p>
                  <p className="text-[#777]">{formatEventWhen(s)}</p>
                  <p className="text-xs mt-1">
                    {s.place ? <>At {s.place.name}</> : <span className="text-[#a84573]">{s.venueName} — not on Art Here yet. Invite: {s.pocEmail}</span>}
                  </p>
                  {s.artistNames && <p className="text-xs text-[#999]">With {s.artistNames.replace(/\n/g, ", ")}</p>}
                  {s.description && <p className="text-xs text-[#888] mt-1 max-w-xl">{s.description}</p>}
                  <p className="text-xs text-[#aaa] mt-1">From {s.submitterName} · {s.submitterEmail}</p>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {s.coverImageUrl && <img src={s.coverImageUrl} alt="" className="w-28 aspect-[16/9] object-cover rounded" />}
                <SubmissionActions id={s.id} placeId={s.placeId} isNewVenue={!s.placeId} places={places.map((p) => ({ id: p.id, name: p.name }))} />
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h1 className="text-xl font-semibold mb-3">Events awaiting review ({pending.length})</h1>
        {pending.length === 0 ? <p className="text-sm text-[#888]">Nothing waiting.</p> : <ul className="divide-y divide-[#eee]">{pending.map(row)}</ul>}
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-3">Ask organizations for events</h2>
        <p className="text-sm text-[#888] mb-3">
          Sends each owner a short email with a one-click link to the add-an-event form.
        </p>
        <SendPromptPanel
          orgs={places.map((p) => {
            const email = p.user?.email ?? null;
            const last = email ? lastByEmail.get(email) : undefined;
            return { id: p.id, name: p.name, email, lastPrompted: last ? last.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : null };
          })}
        />
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-3">All other events</h2>
        {rest.length === 0 ? <p className="text-sm text-[#888]">None yet.</p> : <ul className="divide-y divide-[#eee]">{rest.map(row)}</ul>}
      </section>
    </div>
  );
}
