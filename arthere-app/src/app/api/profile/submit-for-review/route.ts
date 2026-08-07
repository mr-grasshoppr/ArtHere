import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import React from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { resend } from "@/lib/resend";
import { AdminNotificationEmail } from "@/emails/AdminNotificationEmail";
import { renderEmail } from "@/lib/render-email";

// POST — the artist's deliberate "I'm done, please look at this" signal.
// Separate from the autosave in /api/profile so it isn't fired on every
// keystroke. Only meaningful pre-publish: an admin reviews, then publishes
// via setArtistPlaceholder, which clears submittedForReviewAt.
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const artist = await prisma.artist.findUnique({
    where: { userId: session.user.id },
    select: { id: true, name: true, isPlaceholder: true, slug: true },
  });
  if (!artist) return NextResponse.json({ error: "No profile found" }, { status: 404 });

  await prisma.artist.update({
    where: { id: artist.id },
    data: { submittedForReviewAt: new Date() },
  });

  waitUntil(
    (async () => {
      const displayName = artist.name || "(no name yet)";
      const { html } = await renderEmail(
        React.createElement(AdminNotificationEmail, {
          preview: `${artist.name || "An artist"} submitted their profile for review`,
          heading: "Profile ready for review",
          message: React.createElement(React.Fragment, null, React.createElement("strong", null, displayName), " marked their profile ready for review."),
          ctaLabel: "Review in admin →",
          ctaHref: `https://artishere.org/admin/artists/${artist.id}`,
        })
      );
      await resend.emails.send({
        from: "Art Here <hello@artishere.org>",
        to: "maryannamail@gmail.com",
        subject: `${artist.name || "An artist"} submitted their profile for review`,
        text: `${displayName} marked their profile ready for review.\n\nReview: https://artishere.org/admin/artists/${artist.id}\nPublic preview: https://artishere.org/artists/${artist.slug}`,
        html,
      });
    })().catch((err) => console.error("[profile] review notification failed:", err))
  );

  return NextResponse.json({ ok: true });
}
