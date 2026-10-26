import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import { z } from 'zod';
import { resend } from '@/lib/resend';
import { prisma } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { parseBody } from '@/lib/schemas';
import { validatePlaceIntake, SUPPORT_CRITERIA, ARTIST_WAYS } from '@/lib/place-intake';
import { AdminNotificationEmail } from '@/emails/AdminNotificationEmail';
import { ContactConfirmationEmail } from '@/emails/ContactConfirmationEmail';
import { renderEmail } from '@/lib/render-email';

const intakeSchema = z
  .object({
    spaceName: z.string().max(200),
    address: z.string().max(300),
    neighborhood: z.string().max(200),
    website: z.string().max(500).nullish(),
    contactName: z.string().max(200),
    email: z.string().max(254),
    support: z.array(z.string().max(50)).max(10),
    ways: z.record(z.string().max(50), z.string().max(1500)).nullish(),
    howYouSupport: z.string().max(3000).nullish(),
    company: z.string().max(500).nullish(), // honeypot
  })
  .loose();

const SUBJECT = 'Get My Place Featured on Art Here';

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, 'place-intake', { limit: 5, windowSeconds: 600 });
  if (limited) return limited;

  const raw = await req.json().catch(() => null);
  const body = parseBody(intakeSchema, raw);
  if (!body) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

  // Honeypot: the visible form never fills this field, bots do.
  if (body.company?.trim()) return NextResponse.json({ ok: true });

  const input = {
    spaceName: body.spaceName,
    address: body.address,
    neighborhood: body.neighborhood,
    website: body.website ?? '',
    contactName: body.contactName,
    email: body.email,
    support: body.support,
    ways: body.ways ?? {},
    howYouSupport: body.howYouSupport ?? '',
  };
  const errors = validatePlaceIntake(input);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: 'Please check the form and try again.', errors }, { status: 400 });
  }

  const name = input.contactName.trim();
  const email = input.email.trim();
  const website = input.website.trim();
  const how = input.howYouSupport.trim();
  const supportTitles = SUPPORT_CRITERIA.filter(c => input.support.includes(c.id)).map(c => c.title);

  const wayLines = ARTIST_WAYS.filter(w => w.id in input.ways).map(w => {
    const names = input.ways[w.id].trim();
    return `- ${w.label}${names ? `: ${names}` : ''}`;
  });

  const messageLines = [
    `Space: ${input.spaceName.trim()}`,
    `Address: ${input.address.trim()}`,
    `Neighborhood: ${input.neighborhood.trim()}`,
    `Supports local artists through: ${supportTitles.join(', ')}`,
    ...(wayLines.length ? ['', 'Ways they work with artists:', ...wayLines] : []),
    ...(how ? ['', how] : []),
  ];
  const message = messageLines.join('\n');

  const messageNode = (text: string): React.ReactNode =>
    text.split('\n').flatMap((line, i) => (i === 0 ? [line] : [React.createElement('br', { key: `br-${i}` }), line]));

  const rows = [
    { label: 'Contact', value: name },
    { label: 'Email', value: email },
    ...(website ? [{ label: 'Website', value: website }] : []),
    { label: 'Details', value: messageNode(message) },
  ];

  const [{ html: notificationHtml }, { html: confirmationHtml }] = await Promise.all([
    renderEmail(React.createElement(AdminNotificationEmail, { preview: SUBJECT, heading: SUBJECT, rows })),
    renderEmail(React.createElement(ContactConfirmationEmail)),
  ]);

  await prisma.contactSubmission.create({
    data: {
      name,
      email,
      social: website || null,
      affiliations: null,
      message,
      intent: 'place',
    },
  });

  await Promise.all([
    resend.emails.send({
      from: 'Art Here <hello@artishere.org>',
      to: ['hello@artishere.org', 'maryannamail@gmail.com'],
      replyTo: email,
      subject: SUBJECT,
      text: [`From: ${name} <${email}>`, `Intent: ${SUBJECT}`, '', message].join('\n'),
      html: notificationHtml,
    }),
    resend.emails.send({
      from: 'Art Here <hello@artishere.org>',
      to: email,
      bcc: 'hello@artishere.org',
      subject: `We got your message: ${SUBJECT}`,
      html: confirmationHtml,
      text: 'Thanks for reaching out! We received your message and will be in touch soon.\n\nThe Art Here Team',
    }),
  ]);

  return NextResponse.json({ ok: true });
}
