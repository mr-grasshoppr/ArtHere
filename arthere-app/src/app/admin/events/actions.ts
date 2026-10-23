"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { sendEventsPrompt, EVENTS_PROMPT_SUBJECT } from "@/lib/events-email";

export async function setEventStatus(id: string, status: "PUBLISHED" | "HIDDEN") {
  await requireAdmin();
  const event = await prisma.event.update({ where: { id }, data: { status }, select: { place: { select: { slug: true } } } });
  revalidatePath("/admin/events");
  revalidatePath("/events");
  revalidatePath(`/places/${event.place.slug}`);
}

export interface PromptResult {
  placeId: string;
  name: string;
  status: "sent" | "failed";
  error?: string;
}

/** Email the "any events?" prompt to the owner of each selected organization. */
export async function sendEventsPrompts(placeIds: string[]): Promise<PromptResult[]> {
  const session = await requireAdmin();
  const places = await prisma.place.findMany({
    where: { id: { in: placeIds }, isArchived: false, user: { isNot: null } },
    select: { id: true, name: true, user: { select: { email: true } } },
  });

  const results: PromptResult[] = [];
  const recipients: { email: string; name: string; status: string; error: string | null; sentAt: Date | null }[] = [];
  for (const place of places) {
    const email = place.user!.email;
    try {
      await sendEventsPrompt(place, email);
      results.push({ placeId: place.id, name: place.name, status: "sent" });
      recipients.push({ email, name: place.name, status: "sent", error: null, sentAt: new Date() });
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      results.push({ placeId: place.id, name: place.name, status: "failed", error });
      recipients.push({ email, name: place.name, status: "failed", error, sentAt: null });
    }
  }

  // Same audit trail the outreach tool keeps.
  if (recipients.length) {
    await prisma.outreachMessage.create({
      data: {
        subject: EVENTS_PROMPT_SUBJECT,
        body: "Periodic events prompt (EventsPromptEmail) with a link to the add-an-event form.",
        sentBy: session.user?.email ?? "admin",
        recipients: { create: recipients },
      },
    });
  }
  revalidatePath("/admin/events");
  return results;
}

/** Turn a public submission into a live event at `placeId`, crediting any artists we can match by name. */
export async function publishSubmission(id: string, placeId: string) {
  await requireAdmin();
  const sub = await prisma.eventSubmission.findUnique({ where: { id } });
  if (!sub || sub.handledAt) throw new Error("Submission not found or already handled");
  const place = await prisma.place.findUnique({ where: { id: placeId }, select: { slug: true } });
  if (!place) throw new Error("Choose a place first");

  const names = (sub.artistNames ?? "").split(/[,\n]/).map((n) => n.trim()).filter(Boolean);
  const artists = names.length
    ? await prisma.artist.findMany({
        where: { isArchived: false, isPlaceholder: false, OR: names.map((name) => ({ name: { equals: name, mode: "insensitive" as const } })) },
        select: { id: true },
      })
    : [];

  await prisma.$transaction([
    prisma.event.create({
      data: {
        placeId,
        name: sub.name,
        startsAt: sub.startsAt,
        endsAt: sub.endsAt,
        allDay: sub.allDay,
        description: sub.description,
        coverImageUrl: sub.coverImageUrl,
        linkUrl: sub.linkUrl,
        price: sub.price,
        audience: sub.audience,
        status: "PUBLISHED",
        artists: { create: artists.map((a) => ({ artistId: a.id })) },
      },
    }),
    prisma.eventSubmission.update({ where: { id }, data: { handledAt: new Date(), placeId } }),
  ]);
  revalidatePath("/admin/events");
  revalidatePath(`/places/${place.slug}`);
}

export async function dismissSubmission(id: string) {
  await requireAdmin();
  await prisma.eventSubmission.update({ where: { id }, data: { handledAt: new Date() } });
  revalidatePath("/admin/events");
}
