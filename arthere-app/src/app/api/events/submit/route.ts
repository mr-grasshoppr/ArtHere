import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import { prisma } from '@/lib/db';
import { resend } from '@/lib/resend';
import { rateLimit } from '@/lib/rate-limit';
import { isValidEmail } from '@/lib/email';
import { parseEventInput, formatEventWhen } from '@/lib/events';
import { storeEventCover } from '@/lib/event-cover';
import { renderEmail } from '@/lib/render-email';
import { AdminNotificationEmail } from '@/emails/AdminNotificationEmail';

const str = (form: FormData, key: string) => {
  const v = form.get(key);
  return typeof v === 'string' ? v.trim() : '';
};

// Public "Get listed" form. Nothing goes live from here — it lands in the
// admin's event submissions queue.
export async function POST(req: NextRequest) {
  const limited = rateLimit(req, 'event-submit', { limit: 5, windowSeconds: 600 });
  if (limited) return limited;

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

  // Honeypot: real visitors never see or fill this.
  if (str(form, 'website')) return NextResponse.json({ ok: true });

  const submitterName = str(form, 'submitterName');
  const submitterEmail = str(form, 'submitterEmail');
  if (!submitterName || !isValidEmail(submitterEmail)) {
    return NextResponse.json({ error: 'Please add your name and a valid email address.' }, { status: 400 });
  }

  const parsed = parseEventInput({
    name: str(form, 'name'),
    startDate: str(form, 'startDate'),
    startTime: str(form, 'startTime'),
    endDate: str(form, 'endDate'),
    endTime: str(form, 'endTime'),
    description: str(form, 'description'),
  });
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  // Where: an existing page, or a new venue plus someone there to invite.
  const placeId = str(form, 'placeId');
  let place: { id: string; name: string } | null = null;
  let venueName: string | null = null;
  let pocEmail: string | null = null;
  if (placeId) {
    place = await prisma.place.findFirst({ where: { id: placeId, isArchived: false }, select: { id: true, name: true } });
    if (!place) return NextResponse.json({ error: 'Please choose where the event is happening.' }, { status: 400 });
  } else {
    venueName = str(form, 'venueName');
    pocEmail = str(form, 'pocEmail');
    if (!venueName) return NextResponse.json({ error: 'Please tell us where the event is happening.' }, { status: 400 });
    if (!isValidEmail(pocEmail)) {
      return NextResponse.json({ error: 'Please share an email for someone at that place, so we can invite them to join Art Here.' }, { status: 400 });
    }
  }

  let coverImageUrl: string | null = null;
  const file = form.get('cover');
  if (file instanceof File && file.size > 0) {
    const stored = await storeEventCover(file, 'event-submissions');
    if ('error' in stored) return NextResponse.json({ error: stored.error }, { status: 400 });
    coverImageUrl = stored.url;
  }

  const artistNames = form.getAll('artist').filter((v): v is string => typeof v === 'string').map((v) => v.trim()).filter(Boolean).slice(0, 30).join('\n') || null;
  await prisma.eventSubmission.create({
    data: {
      submitterName,
      submitterEmail,
      ...parsed.value,
      artistNames,
      coverImageUrl,
      placeId: place?.id ?? null,
      venueName,
      pocEmail,
    },
  });

  // Heads-up to the team; a failed notification must not fail the submission.
  try {
    const rows = [
      { label: 'Event', value: parsed.value.name },
      { label: 'When', value: formatEventWhen(parsed.value) },
      { label: 'Where', value: place ? place.name : `${venueName} (not on Art Here yet)` },
      ...(pocEmail ? [{ label: 'Contact at venue', value: pocEmail }] : []),
      ...(artistNames ? [{ label: 'Artists', value: artistNames.replace(/\n/g, ', ') }] : []),
      { label: 'Submitted by', value: `${submitterName} <${submitterEmail}>` },
    ];
    const { html } = await renderEmail(
      React.createElement(AdminNotificationEmail, {
        preview: `New event submission: ${parsed.value.name}`,
        heading: 'New event submission',
        rows,
        ctaLabel: 'Review submissions',
        ctaHref: 'https://artishere.org/admin/events',
      }),
    );
    await resend.emails.send({
      from: 'Art Here <hello@artishere.org>',
      to: ['hello@artishere.org'],
      replyTo: submitterEmail,
      subject: `New event submission: ${parsed.value.name}`,
      html,
    });
  } catch (err) {
    console.error('Event submission notification failed', err);
  }

  return NextResponse.json({ ok: true });
}
