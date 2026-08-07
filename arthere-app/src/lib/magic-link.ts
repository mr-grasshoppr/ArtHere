import { randomBytes } from 'crypto';
import { prisma } from '@/lib/db';
import { resend } from '@/lib/resend';
import { MagicLinkEmail, MAGIC_LINK_DEFAULT_BODY_TEXT } from '@/emails/MagicLinkEmail';
import { ProfileLinkEmail, profileLinkDefaultBodyText } from '@/emails/ProfileLinkEmail';
import { renderEmail } from '@/lib/render-email';
import React from 'react';

// 'welcome' — first-time onboarding invite (admin-triggered), warm framing.
// 'returning' — an existing artist/place asked for a fresh sign-in link
// (self-service via /my-art-here), plain "here's your edit link" framing.
export type LinkVariant = 'welcome' | 'returning';

const TOKEN_TTL_HOURS = 48;

// Bearer tokens must be unguessable — cuid() (the old default) is partially
// predictable, so we mint them from the CSPRNG instead.
function newToken(): string {
  return randomBytes(32).toString('base64url');
}
const FROM_ADDRESS = 'Art Here <hello@artishere.org>';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://artishere.org';
const ADMIN_BCC = 'hello@artishere.org';

// Emails greet artists by first name only. Falls back to the full string for
// single-word names. Place emails deliberately keep the full venue name.
// Returns null when we have no real name — the email then greets "Hi there"
// rather than addressing someone by a name invented from their email address.
function firstName(fullName: string | null | undefined): string | null {
  const trimmed = fullName?.trim();
  if (!trimmed) return null;
  return trimmed.split(/\s+/)[0] || trimmed;
}

// ─── Artist magic links ───────────────────────────────────────────────────────

interface SendArtistLinkParams {
  email: string;
  artistId: string;
  /** Blank for placeholder profiles we hold no real name for. */
  artistName?: string | null;
  /** Which email to send. Defaults to the first-time onboarding invite. */
  variant?: LinkVariant;
}

export async function sendMagicLink({
  email,
  artistId,
  artistName,
  variant = 'welcome',
}: SendArtistLinkParams) {
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
  const name = firstName(artistName);
  const { element, subject } =
    variant === 'returning'
      ? {
          element: React.createElement(ProfileLinkEmail, { name, link, noun: 'profile' as const }),
          subject: 'View and edit your Art Here profile',
        }
      : {
          element: React.createElement(MagicLinkEmail, { artistName: name, link }),
          subject: 'Set up your Art Here artist profile',
        };

  const { html, text } = await renderEmail(element);
  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: email,
    bcc: ADMIN_BCC,
    subject,
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
  /** Which email to send. Defaults to the first-time onboarding invite. */
  variant?: LinkVariant;
}

export async function sendPlaceMagicLink({
  email,
  placeId,
  placeName,
  variant = 'welcome',
}: SendPlaceLinkParams) {
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
  const { element, subject } =
    variant === 'returning'
      ? {
          element: React.createElement(ProfileLinkEmail, { name: placeName, link, noun: 'page' as const }),
          subject: 'View and edit your Art Here page',
        }
      : {
          element: React.createElement(MagicLinkEmail, { artistName: placeName, link }),
          subject: `Manage your Art Here page — ${placeName}`,
        };

  const { html, text } = await renderEmail(element);
  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: email,
    bcc: ADMIN_BCC,
    subject,
    html,
    text,
  });
  if (error) throw new Error(`Resend: ${error.message ?? error.name}`);

  return token;
}

// ─── Admin invite preview (mint the link, but let the admin see/edit the
// message before anything is actually emailed) ─────────────────────────────────

export interface InvitePreview {
  email: string;
  link: string;
  subject: string;
  bodyText: string;
}

async function mintToken(scope: { artistId: string } | { placeId: string }, email: string): Promise<string> {
  await prisma.magicLinkToken.updateMany({ where: { ...scope, used: false }, data: { used: true } });
  const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000);
  const { token } = await prisma.magicLinkToken.create({
    data: { token: newToken(), email, ...scope, expiresAt },
    select: { token: true },
  });
  return token;
}

export async function createArtistInvitePreview({
  email,
  artistId,
  variant = 'welcome',
}: SendArtistLinkParams): Promise<InvitePreview> {
  const token = await mintToken({ artistId }, email);
  const link = `${BASE_URL}/profile/setup?token=${token}`;
  const subject = variant === 'returning' ? 'View and edit your Art Here profile' : 'Set up your Art Here artist profile';
  const bodyText = variant === 'returning' ? profileLinkDefaultBodyText('profile') : MAGIC_LINK_DEFAULT_BODY_TEXT;
  return { email, link, subject, bodyText };
}

export async function sendArtistInviteEmail({
  email,
  artistName,
  link,
  subject,
  bodyText,
  variant = 'welcome',
}: SendArtistLinkParams & { link: string; subject: string; bodyText: string }): Promise<void> {
  const name = firstName(artistName);
  const element =
    variant === 'returning'
      ? React.createElement(ProfileLinkEmail, { name, link, noun: 'profile' as const, bodyText })
      : React.createElement(MagicLinkEmail, { artistName: name, link, bodyText });

  const { html, text } = await renderEmail(element);
  const { error } = await resend.emails.send({ from: FROM_ADDRESS, to: email, bcc: ADMIN_BCC, subject, html, text });
  if (error) throw new Error(`Resend: ${error.message ?? error.name}`);
}

export async function createPlaceInvitePreview({
  email,
  placeId,
  placeName,
  variant = 'welcome',
}: SendPlaceLinkParams): Promise<InvitePreview> {
  const token = await mintToken({ placeId }, email);
  const link = `${BASE_URL}/place/setup?token=${token}`;
  const subject = variant === 'returning' ? 'View and edit your Art Here page' : `Manage your Art Here page — ${placeName}`;
  const bodyText = variant === 'returning' ? profileLinkDefaultBodyText('page') : MAGIC_LINK_DEFAULT_BODY_TEXT;
  return { email, link, subject, bodyText };
}

export async function sendPlaceInviteEmail({
  email,
  placeName,
  link,
  subject,
  bodyText,
  variant = 'welcome',
}: SendPlaceLinkParams & { link: string; subject: string; bodyText: string }): Promise<void> {
  const element =
    variant === 'returning'
      ? React.createElement(ProfileLinkEmail, { name: placeName, link, noun: 'page' as const, bodyText })
      : React.createElement(MagicLinkEmail, { artistName: placeName, link, bodyText });

  const { html, text } = await renderEmail(element);
  const { error } = await resend.emails.send({ from: FROM_ADDRESS, to: email, bcc: ADMIN_BCC, subject, html, text });
  if (error) throw new Error(`Resend: ${error.message ?? error.name}`);
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
