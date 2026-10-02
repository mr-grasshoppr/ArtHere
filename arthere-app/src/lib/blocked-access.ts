import { prisma } from '@/lib/db';
import { resend } from '@/lib/resend';

const FROM_ADDRESS = 'Art Here <hello@artishere.org>';
const ADMIN_TO = 'hello@artishere.org';

export type BlockedAccessReason =
  | 'no matching account'
  | 'link already used'
  | 'link expired'
  | 'invalid link';

/**
 * Records a magic link that was clicked but couldn't sign the person in, and
 * emails the admin about it — a real artist/org hitting a dead end on their
 * own onboarding link is exactly the kind of thing that otherwise goes
 * unnoticed (see Yong Hong Zhong: three separate clicks over three days, all
 * silently bounced, before anyone knew). Best-effort: a failure here should
 * never take down the actual sign-in flow, so callers fire-and-forget this.
 */
export async function notifyBlockedAccess({
  email,
  reason,
  artistId,
  placeId,
  name,
}: {
  email: string;
  reason: BlockedAccessReason;
  artistId?: string | null;
  placeId?: string | null;
  /** Artist/place name, if already known — avoids a redundant lookup. */
  name?: string | null;
}): Promise<void> {
  try {
    await prisma.blockedAccessAttempt.create({
      data: { email, reason, artistId: artistId ?? null, placeId: placeId ?? null },
    });

    const who = name ? `${name} (${email})` : email;
    const editUrl = artistId
      ? `https://artishere.org/admin/artists/${artistId}`
      : placeId
        ? `https://artishere.org/admin/organizations/${placeId}`
        : null;

    await resend.emails.send({
      from: FROM_ADDRESS,
      to: ADMIN_TO,
      subject: `Blocked sign-in attempt: ${who}`,
      text: [
        `${who} tried to open their onboarding/sign-in link and got blocked.`,
        `Reason: ${reason}`,
        editUrl ? `Admin page: ${editUrl}` : null,
      ].filter(Boolean).join('\n\n'),
    });
  } catch (err) {
    console.error('notifyBlockedAccess failed', err);
  }
}
