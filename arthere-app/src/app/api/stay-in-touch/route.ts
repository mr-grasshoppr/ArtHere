import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import { resend } from '@/lib/resend';
import { prisma } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { isValidEmail } from '@/lib/email';
import { stayInTouchSchema, parseBody } from '@/lib/schemas';
import { StayInTouchEmail } from '@/emails/StayInTouchEmail';
import { renderEmail } from '@/lib/render-email';

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, 'stay-in-touch', { limit: 5, windowSeconds: 600 });
  if (limited) return limited;

  const raw = await req.json().catch(() => null);
  const body = parseBody(stayInTouchSchema, raw);
  if (!body) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

  const { email, website } = body;

  // Honeypot: the visible form never fills this field — bots do.
  if (website?.trim()) return NextResponse.json({ ok: true });

  const submitterEmail = email.trim();
  if (!isValidEmail(submitterEmail)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }

  await prisma.newsletterSignup.upsert({
    where: { email: submitterEmail },
    create: { email: submitterEmail },
    update: {},
  });

  const { html } = await renderEmail(React.createElement(StayInTouchEmail));

  await resend.emails.send({
    from: 'Art Here <hello@artishere.org>',
    to: submitterEmail,
    bcc: 'hello@artishere.org',
    subject: 'Thanks for your interest in Art Here',
    html,
    text: 'Hey! Thanks for your interest in Art Here. Looking forward to keeping you in the loop!\n\n— The Art Here Team',
  });

  return NextResponse.json({ ok: true });
}
