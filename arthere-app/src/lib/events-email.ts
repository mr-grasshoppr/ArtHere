import { randomBytes } from 'crypto';
import React from 'react';
import { prisma } from '@/lib/db';
import { resend } from '@/lib/resend';
import { renderEmail } from '@/lib/render-email';
import { EventsPromptEmail } from '@/emails/EventsPromptEmail';

const FROM_ADDRESS = 'Art Here <hello@artishere.org>';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://artishere.org';
const ADMIN_BCC = 'hello@artishere.org';
// Longer than the 48h sign-in links: this one sits in an inbox until the org
// actually has an event to add.
const TOKEN_TTL_DAYS = 7;

export const EVENTS_PROMPT_SUBJECT = 'Have an event coming up? Share it on Art Here';

/** Mint a one-use sign-in link that lands on the new-event form, and email it. */
export async function sendEventsPrompt(place: { id: string; name: string }, email: string): Promise<void> {
  await prisma.magicLinkToken.updateMany({
    where: { placeId: place.id, email, used: false, next: '/place/events/new' },
    data: { used: true },
  });
  const { token } = await prisma.magicLinkToken.create({
    data: {
      token: randomBytes(32).toString('base64url'),
      email,
      placeId: place.id,
      next: '/place/events/new',
      expiresAt: new Date(Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000),
    },
    select: { token: true },
  });
  const link = `${BASE_URL}/place/setup?token=${token}`;
  const { html, text } = await renderEmail(React.createElement(EventsPromptEmail, { name: place.name, link }));
  const { error } = await resend.emails.send({ from: FROM_ADDRESS, to: email, bcc: ADMIN_BCC, subject: EVENTS_PROMPT_SUBJECT, html, text });
  if (error) throw new Error(`Resend: ${error.message ?? error.name}`);
}
