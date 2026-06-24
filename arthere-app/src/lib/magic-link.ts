import { prisma } from '@/lib/db';
import { resend } from '@/lib/resend';
import { MagicLinkEmail } from '@/emails/MagicLinkEmail';
import React from 'react';

const TOKEN_TTL_HOURS = 72;
const FROM_ADDRESS = 'Art Here <hello@artishere.org>';

interface SendMagicLinkParams {
  email: string;
  artistId: string;
  artistName: string;
}

export async function sendMagicLink({ email, artistId, artistName }: SendMagicLinkParams) {
  // Invalidate any existing unused tokens for this artist so only one is live at a time.
  await prisma.magicLinkToken.updateMany({
    where: { artistId, used: false },
    data: { used: true },
  });

  const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000);

  const { token } = await prisma.magicLinkToken.create({
    data: { email, artistId, expiresAt },
    select: { token: true },
  });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://artishere.org';
  const link = `${baseUrl}/profile/setup?token=${token}`;

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: 'Set up your Art Here artist profile',
    react: React.createElement(MagicLinkEmail, { artistName, link }),
  });

  return token;
}

export async function verifyMagicLinkToken(token: string) {
  const record = await prisma.magicLinkToken.findUnique({
    where: { token },
    include: {
      artist: {
        include: {
          user: true,
          city: true,
        },
      },
    },
  });

  if (!record) {
    throw new Error('Link not found. It may have already been used or never existed.');
  }
  if (record.used) {
    throw new Error('This link has already been used. Request a new one below.');
  }
  if (record.expiresAt < new Date()) {
    throw new Error('This link has expired. Request a new one below.');
  }

  await prisma.magicLinkToken.update({
    where: { token },
    data: { used: true },
  });

  return record.artist;
}
