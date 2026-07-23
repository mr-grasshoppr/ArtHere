import { randomBytes } from 'crypto';
import { render } from '@react-email/components';
import { prisma } from '@/lib/db';
import { resend } from '@/lib/resend';
import { MagicLinkEmail } from '@/emails/MagicLinkEmail';
import React from 'react';

// Render the email to HTML + plaintext ourselves rather than handing Resend the
// `react` prop — Resend v6 dynamically imports `@react-email/render` at send
// time, which isn't resolvable in our bundle and throws "Failed to render
// React component". Rendering here with the installed `@react-email/components`
// sidesteps that entirely.
async function renderEmail(element: React.ReactElement) {
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);
  return { html, text };
}

const TOKEN_TTL_HOURS = 72;

// Bearer tokens must be unguessable — cuid() (the old default) is partially
// predictable, so we mint them from the CSPRNG instead.
function newToken(): string {
  return randomBytes(32).toString('base64url');
}
const FROM_ADDRESS = 'Art Here <hello@artishere.org>';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://artishere.org';
const ADMIN_BCC = 'hello@artishere.org';

// ─── Artist magic links ───────────────────────────────────────────────────────

interface SendArtistLinkParams {
  email: string;
  artistId: string;
  artistName: string;
}

export async function sendMagicLink({ email, artistId, artistName }: SendArtistLinkParams) {
  await prisma.magicLinkToken.updateMany({
    where: { artistId, used: false },
    data: { used: true },
  });

  const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000);
  const { token } = await prisma.magicLinkToken.create({
    data: { token: newToken(), email, artistId, expiresAt },
    select: { token: true },
  });

  const link = `${BASE_URL}/profile/setup?token=${token}`;
  const { html, text } = await renderEmail(
    React.createElement(MagicLinkEmail, { artistName, link }),
  );
  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: email,
    bcc: ADMIN_BCC,
    subject: 'Set up your Art Here artist profile',
    html,
    text,
  });
  if (error) throw new Error(`Resend: ${error.message ?? error.name}`);

  return token;
}

// ─── Place magic links ────────────────────────────────────────────────────────

interface SendPlaceLinkParams {
  email: string;
  placeId: string;
  placeName: string;
}

export async function sendPlaceMagicLink({ email, placeId, placeName }: SendPlaceLinkParams) {
  await prisma.magicLinkToken.updateMany({
    where: { placeId, used: false },
    data: { used: true },
  });

  const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000);
  const { token } = await prisma.magicLinkToken.create({
    data: { token: newToken(), email, placeId, expiresAt },
    select: { token: true },
  });

  const link = `${BASE_URL}/place/setup?token=${token}`;
  const { html, text } = await renderEmail(
    React.createElement(MagicLinkEmail, { artistName: placeName, link }),
  );
  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: email,
    bcc: ADMIN_BCC,
    subject: `Manage your Art Here page — ${placeName}`,
    html,
    text,
  });
  if (error) throw new Error(`Resend: ${error.message ?? error.name}`);

  return token;
}

// ─── Token verification ───────────────────────────────────────────────────────

export async function verifyMagicLinkToken(token: string) {
  const record = await prisma.magicLinkToken.findUnique({
    where: { token },
    include: {
      artist: { include: { user: true, city: true } },
      place: { include: { user: true } },
    },
  });

  if (!record) throw new Error('Link not found. It may have already been used or never existed.');
  if (record.used) throw new Error('This link has already been used. Request a new one below.');
  if (record.expiresAt < new Date()) throw new Error('This link has expired. Request a new one below.');

  // Atomic consume: the guarded updateMany means that if two requests race
  // on the same token, exactly one wins — the loser sees count === 0.
  const consumed = await prisma.magicLinkToken.updateMany({
    where: { token, used: false },
    data: { used: true },
  });
  if (consumed.count === 0) {
    throw new Error('This link has already been used. Request a new one below.');
  }

  return { artist: record.artist, place: record.place };
}
