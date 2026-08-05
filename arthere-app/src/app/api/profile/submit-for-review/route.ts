import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { resend } from "@/lib/resend";
import { escapeHtml } from "@/lib/email";

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
    resend.emails.send({
      from: "Art Here <hello@artishere.org>",
      to: "maryannamail@gmail.com",
      subject: `${artist.name || "An artist"} submitted their profile for review`,
      text: `${artist.name || "(no name yet)"} marked their profile ready for review.\n\nReview: https://artishere.org/admin/artists/${artist.id}\nPublic preview: https://artishere.org/artists/${artist.slug}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; color: #1a1a1a;">
          <h2 style="font-size: 1.2rem; font-weight: 500; margin: 0 0 20px;">Profile ready for review</h2>
          <p style="color: #444; margin: 0 0 20px;">
            <strong>${escapeHtml(artist.name || "(no name yet)")}</strong> marked their profile ready for review.
          </p>
          <p style="margin: 0;">
            <a href="https://artishere.org/admin/artists/${artist.id}" style="color: #1a1a1a; font-size: 0.9rem;">Review in admin →</a>
          </p>
        </div>
      `,
    }).catch((err) => console.error("[profile] review notification failed:", err))
  );

  return NextResponse.json({ ok: true });
}
