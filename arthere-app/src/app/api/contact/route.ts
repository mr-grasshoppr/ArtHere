import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import { resend } from '@/lib/resend';
import { prisma } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { isValidEmail } from '@/lib/email';
import { contactSchema, parseBody } from '@/lib/schemas';
import { AdminNotificationEmail } from '@/emails/AdminNotificationEmail';
import { ContactConfirmationEmail } from '@/emails/ContactConfirmationEmail';
import { renderEmail } from '@/lib/render-email';

const INTENTS: Record<string, string> = {
  featured: 'Get Featured on Art Here',
  partner: 'Partner with Art Here',
  bring: 'Bring Art Here to My City',
  invite: 'Request an Art Here Invite',
};

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, 'contact', { limit: 5, windowSeconds: 600 });
  if (limited) return limited;

  const raw = await req.json().catch(() => null);
  const body = parseBody(contactSchema, raw);
  if (!body) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

  const { name, email, social, message, intent, website } = body;

  // Honeypot: the visible form never fills this field — bots do.
  if (website?.trim()) return NextResponse.json({ ok: true });

  if (!name.trim() || !email.trim()) {
    return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 });
  }
  if (!isValidEmail(email.trim())) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }

  const subject = (intent && INTENTS[intent]) || 'Message from Art Here website';

  const submitterEmail = email.trim();
  const submitterName = name.trim();
  const firstName = submitterName.split(' ')[0];

  // Turns a multi-line message into <br>-separated React children — safe by
  // default (React escapes text nodes), no manual HTML-escaping needed here.
  const messageNode = (text: string): React.ReactNode =>
    text.split('\n').flatMap((line, i) => (i === 0 ? [line] : [React.createElement('br', { key: `br-${i}` }), line]));

  const notificationRows = [
    { label: 'Name', value: submitterName },
    { label: 'Email', value: submitterEmail },
    ...(social?.trim() ? [{ label: 'Website / Social', value: social.trim() }] : []),
    ...(message?.trim() ? [{ label: 'Message', value: messageNode(message.trim()) }] : []),
  ];

  const [{ html: notificationHtml }, { html: confirmationHtml }] = await Promise.all([
    renderEmail(React.createElement(AdminNotificationEmail, { preview: subject, heading: subject, rows: notificationRows })),
    renderEmail(React.createElement(ContactConfirmationEmail, { firstName })),
  ]);

  await prisma.contactSubmission.create({
    data: {
      name: submitterName,
      email: submitterEmail,
      social: social?.trim() || null,
      message: message?.trim() || null,
      intent: intent?.trim() || null,
    },
  });

  await Promise.all([
    resend.emails.send({
      from: 'Art Here <hello@artishere.org>',
      to: ['hello@artishere.org', 'maryannamail@gmail.com'],
      replyTo: submitterEmail,
      subject,
      text: [
        `From: ${submitterName} <${submitterEmail}>`,
        `Intent: ${subject}`,
        '',
        message?.trim() ? message.trim() : '(No additional message)',
      ].join('\n'),
      html: notificationHtml,
    }),
    resend.emails.send({
      from: 'Art Here <hello@artishere.org>',
      to: submitterEmail,
      bcc: 'hello@artishere.org',
      subject: `We got your message — ${subject}`,
      html: confirmationHtml,
      text: `Thanks for reaching out, ${firstName}. We received your message and will be in touch soon.\n\n— The Art Here Team`,
    }),
  ]);

  return NextResponse.json({ ok: true });
}
