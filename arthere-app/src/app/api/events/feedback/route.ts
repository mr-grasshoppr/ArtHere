import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import { z } from 'zod';
import { resend } from '@/lib/resend';
import { rateLimit } from '@/lib/rate-limit';
import { parseBody } from '@/lib/schemas';
import { isValidEmail } from '@/lib/email';
import { AdminNotificationEmail } from '@/emails/AdminNotificationEmail';
import { renderEmail } from '@/lib/render-email';

const feedbackSchema = z
  .object({
    answer: z.enum(['yes', 'no', 'unsure']),
    comment: z.string().max(3000).nullish(),
    email: z.string().max(254).nullish(),
    city: z.string().max(100).nullish(),
    company: z.string().max(500).nullish(), // honeypot
  })
  .loose();

const ANSWERS = { yes: 'Yes', no: 'No', unsure: "I'm not sure" } as const;
const SUBJECT = 'Events page feedback';

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, 'events-feedback', { limit: 5, windowSeconds: 600 });
  if (limited) return limited;

  const body = parseBody(feedbackSchema, await req.json().catch(() => null));
  if (!body) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  if (body.company?.trim()) return NextResponse.json({ ok: true });

  const comment = body.comment?.trim() ?? '';
  const email = body.email?.trim() ?? '';
  if (email && !isValidEmail(email)) {
    return NextResponse.json({ error: 'That email address doesn’t look right.' }, { status: 400 });
  }

  const rows = [
    { label: 'Wants more events?', value: ANSWERS[body.answer] },
    ...(body.city ? [{ label: 'City', value: body.city }] : []),
    ...(email ? [{ label: 'Email', value: email }] : []),
    ...(comment ? [{ label: 'Tell us more', value: comment }] : []),
  ];
  const { html } = await renderEmail(React.createElement(AdminNotificationEmail, { preview: SUBJECT, heading: SUBJECT, rows }));

  await resend.emails.send({
    from: 'Art Here <hello@artishere.org>',
    to: ['hello@artishere.org', 'maryannamail@gmail.com'],
    ...(email ? { replyTo: email } : {}),
    subject: `${SUBJECT}: ${ANSWERS[body.answer]}`,
    text: rows.map(r => `${r.label}: ${r.value}`).join('\n'),
    html,
  });

  return NextResponse.json({ ok: true });
}
