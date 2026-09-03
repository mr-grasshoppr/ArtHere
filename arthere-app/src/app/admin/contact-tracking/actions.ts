"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { resend } from "@/lib/resend";
import { renderEmail } from "@/lib/render-email";
import { AdminOutreachEmail } from "@/emails/AdminOutreachEmail";
import { isValidEmail } from "@/lib/email";

const FROM_ADDRESS = "Art Here <hello@artishere.org>";
const ADMIN_BCC = "hello@artishere.org";

export interface SendResult {
  messageId: string;
  sent: number;
  failed: { email: string; error: string }[];
}

/**
 * Send one composed message to a hand-picked set of contacts.
 *
 * Sent individually rather than as one message with many recipients: a shared
 * To:/Cc: would disclose every address to everyone on the list.
 */
export async function sendOutreach(
  emails: string[],
  subject: string,
  body: string
): Promise<SendResult> {
  const session = await requireAdmin();

  const trimmedSubject = subject.trim();
  const trimmedBody = body.trim();
  if (!trimmedSubject) throw new Error("Subject is required");
  if (!trimmedBody) throw new Error("Message body is required");

  const recipients = [...new Set(emails.map((e) => e.trim().toLowerCase()))].filter(isValidEmail);
  if (recipients.length === 0) throw new Error("No valid recipients selected");

  // Names come from the contact record so the log reads as people, not
  // addresses, when it's shown back on the list.
  const submissions = await prisma.contactSubmission.findMany({
    where: { email: { in: recipients, mode: "insensitive" } },
    select: { email: true, name: true },
  });
  const nameFor = new Map(submissions.map((s) => [s.email.toLowerCase(), s.name]));

  const { html, text } = await renderEmail(
    AdminOutreachEmail({ subject: trimmedSubject, body: trimmedBody })
  );

  // The message row is written before sending, so a crash midway leaves a
  // record of what went out rather than losing the whole batch.
  const message = await prisma.outreachMessage.create({
    data: {
      subject: trimmedSubject,
      body: trimmedBody,
      sentBy: session.user?.email ?? "unknown",
    },
  });

  const failed: { email: string; error: string }[] = [];
  let sent = 0;

  for (const email of recipients) {
    let error: string | null = null;
    try {
      const res = await resend.emails.send({
        from: FROM_ADDRESS,
        to: email,
        bcc: ADMIN_BCC,
        subject: trimmedSubject,
        html,
        text,
      });
      if (res.error) error = res.error.message;
    } catch (err) {
      error = err instanceof Error ? err.message : "Send failed";
    }

    if (error) {
      failed.push({ email, error });
    } else {
      sent++;
    }

    await prisma.outreachRecipient.create({
      data: {
        messageId: message.id,
        email,
        name: nameFor.get(email) ?? null,
        status: error ? "failed" : "sent",
        error,
        sentAt: error ? null : new Date(),
      },
    });
  }

  revalidatePath("/admin/contact-tracking");
  return { messageId: message.id, sent, failed };
}

/**
 * Flags (or unflags) every row across all three sources for this email as
 * test data — a merged Contact can be built from a survey response, a
 * contact-form submission, and a newsletter signup at once, so marking just
 * one wouldn't fully remove the person from view.
 */
export async function setContactTest(email: string, isTest: boolean) {
  await requireAdmin();
  const where = { email: { equals: email, mode: "insensitive" as const } };
  await Promise.all([
    prisma.surveyResponse.updateMany({ where, data: { isTest } }),
    prisma.contactSubmission.updateMany({ where, data: { isTest } }),
    prisma.newsletterSignup.updateMany({ where, data: { isTest } }),
  ]);
  revalidatePath("/admin/contact-tracking");
  revalidatePath("/admin/survey");
}
