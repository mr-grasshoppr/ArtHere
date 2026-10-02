import { NextRequest, NextResponse } from 'next/server';
import { verifyMagicLinkToken } from '@/lib/magic-link';
import { createSessionForUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { notifyBlockedAccess, type BlockedAccessReason } from '@/lib/blocked-access';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  const base = req.nextUrl.origin;

  if (!token) {
    return NextResponse.redirect(
      `${base}/profile/link-error?msg=${encodeURIComponent('No token found in this link. Please check your email and try again.')}`
    );
  }

  let result: Awaited<ReturnType<typeof verifyMagicLinkToken>>;
  try {
    result = await verifyMagicLinkToken(token);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'This link is invalid.';

    // verifyMagicLinkToken doesn't hand back the record on failure, so look
    // it up directly — a real, identifiable person hit a dead end here (the
    // link existed, it just couldn't be redeemed), which is worth tracking.
    // A garbled/nonexistent token has no one to attribute it to.
    const record = await prisma.magicLinkToken.findUnique({
      where: { token },
      include: { artist: { select: { id: true, name: true } }, place: { select: { id: true, name: true } } },
    });
    if (record) {
      const reason: BlockedAccessReason = msg.includes('expired') ? 'link expired' : 'link already used';
      await notifyBlockedAccess({
        email: record.email,
        reason,
        artistId: record.artistId,
        placeId: record.placeId,
        name: record.artist?.name ?? record.place?.name,
      });
    }

    return NextResponse.redirect(`${base}/profile/link-error?msg=${encodeURIComponent(msg)}`);
  }

  // Resolve the session to whoever the link was actually sent to (the
  // token's own email), not the artist/place's primary owner — a token
  // minted for an invited teammate must log that teammate in, not the
  // original owner. The invite flow always upserts this User row before
  // minting the token, so it's guaranteed to exist here.
  const user = await prisma.user.findUnique({ where: { email: result.email } });
  if (!user) {
    await notifyBlockedAccess({
      email: result.email,
      reason: 'no matching account',
      artistId: result.artist?.id,
      placeId: result.place?.id,
      name: result.artist?.name ?? result.place?.name,
    });
    return NextResponse.redirect(
      `${base}/profile/link-error?msg=${encodeURIComponent('This link is not associated with a valid account.')}`
    );
  }

  const cookie = await createSessionForUser(user.id);

  const destination = result.place ? '/place/edit' : '/profile';
  const response = NextResponse.redirect(`${base}${destination}`);
  response.cookies.set(cookie.name, cookie.value, cookie.options);

  return response;
}
