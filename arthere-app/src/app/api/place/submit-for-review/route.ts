import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import React from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { resend } from "@/lib/resend";
import { AdminNotificationEmail } from "@/emails/AdminNotificationEmail";
import { renderEmail } from "@/lib/render-email";

// POST — the org owner's deliberate "I'm done, please look at this" signal.
// Mirrors /api/profile/submit-for-review exactly. Only meaningful pre-publish:
// an admin reviews, then publishes via setPlaceVisibility, which clears
// submittedForReviewAt.
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const place = await prisma.place.findUnique({ where: { userId: session.user.id } });
  if (!place) return NextResponse.json({ error: "No page found" }, { status: 404 });

  await prisma.place.update({
    where: { id: place.id },
    data: { submittedForReviewAt: new Date() },
  });

  waitUntil(
    (async () => {
      const { html } = await renderEmail(
        React.createElement(AdminNotificationEmail, {
          preview: `${place.name} submitted their page for review`,
          heading: "Page ready for review",
          message: React.createElement(React.Fragment, null, React.createElement("strong", null, place.name), " marked their page ready for review."),
          ctaLabel: "Review in admin →",
          ctaHref: `https://artishere.org/admin/organizations/${place.id}`,
        })
      );
      await resend.emails.send({
        from: "Art Here <hello@artishere.org>",
        to: "maryannamail@gmail.com",
        subject: `${place.name} submitted their page for review`,
        text: `${place.name} marked their page ready for review.\n\nReview: https://artishere.org/admin/organizations/${place.id}\nPublic preview: https://artishere.org/places/${place.slug}`,
        html,
      });
    })().catch((err) => console.error("[place] review notification failed:", err))
  );

  return NextResponse.json({ ok: true });
}
