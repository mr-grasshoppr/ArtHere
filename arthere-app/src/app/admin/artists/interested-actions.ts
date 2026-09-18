"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { createArtistInvitePreview, artistGreetingName, type InvitePreview } from "@/lib/magic-link";
import { classifySocialLink } from "@/lib/social-link";
import { attachArtistUser } from "./[id]/actions";
import { uniqueArtistSlug } from "./actions";

const INTENT_LABELS: Record<string, string> = {
  invite: "Request an Art Here Invite",
  featured: "Get Featured on Art Here",
};

const INTERESTED_INVITE_SUBJECT = "Welcome to Art Here — let's build your profile";

const INTERESTED_INVITE_BODY = [
  "Art Here is a new way for people to discover and connect with local artists — a home for your work, your story, and how people can find and support you.",
  "Thank you for being among the first artists we're featuring. We're excited to have you.",
  "Setting up your profile only takes a couple of minutes, and you can always come back and edit it later — nothing here is final.",
  "Questions or ideas along the way? Just reply to this email — we'd love to hear from you.",
].join("\n\n");

// Converts a "Request an invite"/"Get featured" contact submission into a
// placeholder Artist (idempotent — safe to call again for a submission
// that's already been converted, e.g. re-opening the modal to resend), then
// mints an invite preview using the "first featured artists" welcome copy.
// The admin previews/edits this before anything is actually sent, same as
// the regular per-artist invite flow (see [id]/actions.ts).
export async function previewInterestedInvite(submissionId: string): Promise<InvitePreview & { artistId: string }> {
  await requireAdmin();
  const submission = await prisma.contactSubmission.findUnique({ where: { id: submissionId } });
  if (!submission) throw new Error("Submission not found");

  const email = submission.email.trim().toLowerCase();
  let artistId = submission.invitedArtistId;

  if (!artistId) {
    // Check for an email conflict up front — attachArtistUser enforces this
    // too, but only after we'd already have created the artist/note/link
    // below, leaving orphaned data behind on failure.
    const existingUser = await prisma.user.findUnique({ where: { email }, include: { artist: true } });
    if (existingUser?.artist) {
      throw new Error(
        `${email} is already linked to another artist profile ("${existingUser.artist.name}"). Open that profile to invite them from there instead.`
      );
    }

    const slug = await uniqueArtistSlug(submission.name);
    const portland = await prisma.city.findUnique({ where: { slug: "portland" } });
    const artist = await prisma.artist.create({
      data: { name: submission.name.trim(), slug, isPlaceholder: true, cityId: portland?.id ?? null },
    });
    artistId = artist.id;

    const social = classifySocialLink(submission.social);
    if (social) {
      await prisma.artistLink.create({ data: { artistId, ...social } });
    }

    const noteLines = [
      `From "${INTENT_LABELS[submission.intent ?? ""] ?? "contact form"}" submission.`,
      submission.social ? `Website/social as entered: ${submission.social}` : null,
      submission.message ? `Message: ${submission.message}` : null,
    ].filter((line): line is string => Boolean(line));
    await prisma.adminNote.create({ data: { artistId, body: noteLines.join("\n") } });

    await prisma.contactSubmission.update({ where: { id: submissionId }, data: { invitedArtistId: artistId } });
  }

  await attachArtistUser(artistId, email);
  const artist = await prisma.artist.findUniqueOrThrow({ where: { id: artistId } });

  const preview = await createArtistInvitePreview({
    email,
    artistId,
    artistName: artistGreetingName(artist),
    subject: INTERESTED_INVITE_SUBJECT,
    bodyText: INTERESTED_INVITE_BODY,
  });
  return { ...preview, artistId };
}

/**
 * Create a placeholder Artist from a Contact Tracking / Contact Submissions
 * row, prefilled with whatever's on file for that email — no invite sent,
 * just a draft the admin can finish filling in and publish or invite from
 * later. Idempotent: an email that already has an artist just returns it,
 * so clicking the button twice (or from both tabs) can't create duplicates.
 *
 * Contact Tracking's merged Contact view drops the free-text fields (social,
 * affiliations) that make this worth doing, so this goes back to the
 * underlying ContactSubmission rows rather than taking pre-merged data.
 */
export async function createDraftArtistFromEmail(email: string): Promise<{ artistId: string; alreadyExisted: boolean }> {
  await requireAdmin();
  const clean = email.trim().toLowerCase();
  if (!clean) throw new Error("An email is required");

  const existingUser = await prisma.user.findUnique({ where: { email: clean }, include: { artist: true } });
  if (existingUser?.artist) {
    return { artistId: existingUser.artist.id, alreadyExisted: true };
  }

  // A contact-form submission is the only source with social/affiliations —
  // survey and newsletter rows contribute nothing beyond email. Prefer
  // whichever submission actually has something to prefill; several blank
  // ones (e.g. a repeat newsletter-only signup) shouldn't beat one with data.
  const submissions = await prisma.contactSubmission.findMany({
    where: { email: { equals: clean, mode: "insensitive" } },
    orderBy: { createdAt: "desc" },
  });
  const submission = submissions.find((s) => s.social?.trim() || s.affiliations?.trim()) ?? submissions[0];

  const name = submission?.name?.trim() || clean;
  const slug = await uniqueArtistSlug(name);
  const portland = await prisma.city.findUnique({ where: { slug: "portland" } });
  const artist = await prisma.artist.create({
    data: { name, slug, isPlaceholder: true, cityId: portland?.id ?? null },
  });

  const social = classifySocialLink(submission?.social);
  if (social) {
    await prisma.artistLink.create({ data: { artistId: artist.id, ...social } });
  }

  const noteLines = [
    submission
      ? `Draft created from a "${INTENT_LABELS[submission.intent ?? ""] ?? "contact form"}" submission.`
      : "Draft created from Contact Tracking.",
    submission?.social ? `Website/social as entered: ${submission.social}` : null,
    submission?.affiliations ? `Community connections as entered: ${submission.affiliations}` : null,
    submission?.message ? `Message: ${submission.message}` : null,
  ].filter((line): line is string => Boolean(line));
  await prisma.adminNote.create({ data: { artistId: artist.id, body: noteLines.join("\n") } });

  // Best-effort — lets the "Interested" tab's Not-yet-invited list know this
  // one's spoken for too. Not critical, so a stale/conflicting value on an
  // unrelated submission for this email shouldn't fail the whole action.
  if (submission && !submission.invitedArtistId) {
    await prisma.contactSubmission.update({ where: { id: submission.id }, data: { invitedArtistId: artist.id } }).catch(() => {});
  }

  await attachArtistUser(artist.id, clean);

  return { artistId: artist.id, alreadyExisted: false };
}
