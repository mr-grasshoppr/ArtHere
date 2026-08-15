import { randomBytes } from 'crypto';
import { prisma } from '@/lib/db';
import { resend } from '@/lib/resend';
import { MagicLinkEmail, MAGIC_LINK_DEFAULT_BODY_TEXT, PLACE_MAGIC_LINK_DEFAULT_BODY_TEXT } from '@/emails/MagicLinkEmail';
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

// Trim-and-null-fallback only — no more splitting on whitespace. Splitting a
// full name to guess the first word mangles multi-word first names ("Mary
// Ann" -> "Mary"), which is exactly what Artist.firstName exists to avoid.
// Returns null when we have no real name — the email then greets "Hi there"
// rather than addressing someone by a name invented from their email address.
function cleanGreetingName(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed || null;
}

/**
 * Best available first name for an email greeting: the artist's stored
 * firstName, falling back to a naive split of the full name only for rows
 * that predate the firstName field and haven't been saved since.
 */
export function artistGreetingName(artist: { firstName?: string | null; name?: string | null }): string | null {
  const explicit = artist.firstName?.trim();
  if (explicit) return explicit;
  const full = artist.name?.trim();
  if (!full) return null;
  return full.split(/\s+/)[0] || full;
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
    where: { artistId, email, used: false },
    data: { used: true },
  });

  const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000);
  const { token } = await prisma.magicLinkToken.create({
    data: { token: newToken(), email, artistId, expiresAt },
    select: { token: true },
  });

  const link = `${BASE_URL}/profile/setup?token=${token}`;
  const name = cleanGreetingName(artistName);
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
  // Scoped to this email, not just this placeId — a place can now have
  // several editors (see PlaceMember), each with their own pending token.
  // Minting/resending a link for one shouldn't invalidate someone else's
  // still-unused invite to the same place.
  await prisma.magicLinkToken.updateMany({
    where: { placeId, email, used: false },
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
          element: React.createElement(MagicLinkEmail, { artistName: placeName, link, bodyText: PLACE_MAGIC_LINK_DEFAULT_BODY_TEXT }),
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
  /** Name used in the email's "Hi ___," greeting — same value the actual send uses, so the preview matches exactly. Null shows as "there". */
  greetingName: string | null;
}

async function mintToken(scope: { artistId: string } | { placeId: string }, email: string): Promise<string> {
  // Scoped to this email — see the comment in sendPlaceMagicLink.
  await prisma.magicLinkToken.updateMany({ where: { ...scope, email, used: false }, data: { used: true } });
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
  artistName,
  variant = 'welcome',
  subject: subjectOverride,
  bodyText: bodyTextOverride,
}: SendArtistLinkParams & { subject?: string; bodyText?: string }): Promise<InvitePreview> {
  const token = await mintToken({ artistId }, email);
  const link = `${BASE_URL}/profile/setup?token=${token}`;
  const subject = subjectOverride ?? (variant === 'returning' ? 'View and edit your Art Here profile' : 'Set up your Art Here artist profile');
  const bodyText = bodyTextOverride ?? (variant === 'returning' ? profileLinkDefaultBodyText('profile') : MAGIC_LINK_DEFAULT_BODY_TEXT);
  return { email, link, subject, bodyText, greetingName: cleanGreetingName(artistName) };
}

export async function sendArtistInviteEmail({
  email,
  artistName,
  link,
  subject,
  bodyText,
  greetingName,
  variant = 'welcome',
}: SendArtistLinkParams & { link: string; subject: string; bodyText: string; greetingName?: string | null }): Promise<void> {
  // greetingName lets the admin's edit in the invite-preview modal win over
  // the auto-derived first name (e.g. a nickname the artist actually goes by).
  const name = greetingName !== undefined ? greetingName : cleanGreetingName(artistName);
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
  const bodyText = variant === 'returning' ? profileLinkDefaultBodyText('page') : PLACE_MAGIC_LINK_DEFAULT_BODY_TEXT;
  // Places keep the full venue name in the greeting (never truncated to a first word).
  return { email, link, subject, bodyText, greetingName: placeName ?? null };
}

export async function sendPlaceInviteEmail({
  email,
  placeName,
  link,
  subject,
  bodyText,
  greetingName,
  variant = 'welcome',
}: SendPlaceLinkParams & { link: string; subject: string; bodyText: string; greetingName?: string | null }): Promise<void> {
  // greetingName lets the admin's edit in the invite-preview modal win over
  // the default full venue name (e.g. a shorter/friendlier name to greet by).
  const name = greetingName !== undefined ? greetingName : placeName;
  const element =
    variant === 'returning'
      ? React.createElement(ProfileLinkEmail, { name, link, noun: 'page' as const, bodyText })
      : React.createElement(MagicLinkEmail, { artistName: name, link, bodyText });

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

  // The token's own email — not necessarily record.artist.user.email /
  // record.place.user.email, which is the PRIMARY owner. A token minted for
  // an invited teammate (see addPlaceTeamMember) is sent to a different
  // address, and callers need to resolve the session to *that* person.
  return { artist: record.artist, place: record.place, email: record.email };
}
