import { NextRequest, NextResponse } from 'next/server';
import { resend } from '@/lib/resend';
import { prisma } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { escapeHtml, escapeHtmlWithBreaks, isValidEmail } from '@/lib/email';
import { contactSchema, parseBody } from '@/lib/schemas';

const INTENTS: Record<string, string> = {
  featured: 'Get Featured on Art Here',
  partner: 'Partner with Art Here',
  bring: 'Bring Art Here to My City',
  invite: 'Request an Art Here Invite',
};

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, 'contact', { limit: 5, windowSeconds: 600 });
  if (limited) return limited;

  const raw = await req.json().catch(() => null);
  const body = parseBody(contactSchema, raw);
  if (!body) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

  const { name, email, social, message, intent, website } = body;

  // Honeypot: the visible form never fills this field — bots do.
  if (website?.trim()) return NextResponse.json({ ok: true });

  if (!name.trim() || !email.trim()) {
    return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 });
  }
  if (!isValidEmail(email.trim())) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }

  const subject = (intent && INTENTS[intent]) || 'Message from Art Here website';

  const submitterEmail = email.trim();
  const submitterName = name.trim();

  const notificationHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px; color: #1a1a1a;">
      <h2 style="font-size: 1.2rem; font-weight: 500; margin: 0 0 24px;">${escapeHtml(subject)}</h2>
      <p style="color: #555; margin: 0 0 8px;"><strong>Name:</strong> ${escapeHtml(submitterName)}</p>
      <p style="color: #555; margin: 0 0 8px;"><strong>Email:</strong> ${escapeHtml(submitterEmail)}</p>
      ${social?.trim() ? `<p style="color: #555; margin: 0 0 8px;"><strong>Website / Social:</strong> ${escapeHtml(social.trim())}</p>` : ''}
      ${message?.trim() ? `<p style="color: #555; margin: 24px 0 0;"><strong>Message:</strong><br>${escapeHtmlWithBreaks(message.trim())}</p>` : ''}
    </div>
  `;

  const firstName = submitterName.split(' ')[0];
  const confirmationHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap" rel="stylesheet">
    </head>
    <body style="margin:0;padding:0;background:#fff;">
      <div style="font-family:'Nunito',Arial,sans-serif;max-width:520px;margin:0 auto;padding:48px 32px;color:#1a1a1a;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:48px;">
          <tr>
            <td align="center">
              <img src="https://gdrwkpxdxohbq3gn.public.blob.vercel-storage.com/brand/arthere-logo-email-color.png" alt="Art Here" style="height:96px;width:auto;display:block;">
            </td>
          </tr>
        </table>
        <h2 style="font-size:1.35rem;font-weight:700;letter-spacing:-0.01em;margin:0 0 16px;">Thanks for reaching out, ${escapeHtml(firstName)}.</h2>
        <p style="color:#555;line-height:1.8;margin:0 0 16px;font-weight:400;">We received your message and will be in touch soon.</p>
        <p style="color:#999;font-size:0.88rem;margin:40px 0 0;font-weight:400;">— The Art Here Team</p>
      </div>
    </body>
    </html>
  `;

  await prisma.contactSubmission.create({
    data: {
      name: submitterName,
      email: submitterEmail,
      social: social?.trim() || null,
      message: message?.trim() || null,
      intent: intent?.trim() || null,
    },
  });

  await Promise.all([
    resend.emails.send({
      from: 'Art Here <hello@artishere.org>',
      to: ['hello@artishere.org', 'maryannamail@gmail.com'],
      replyTo: submitterEmail,
      subject,
      text: [
        `From: ${submitterName} <${submitterEmail}>`,
        `Intent: ${subject}`,
        '',
        message?.trim() ? message.trim() : '(No additional message)',
      ].join('\n'),
      html: notificationHtml,
    }),
    resend.emails.send({
      from: 'Art Here <hello@artishere.org>',
      to: submitterEmail,
      bcc: 'hello@artishere.org',
      subject: `We got your message — ${subject}`,
      html: confirmationHtml,
      text: `Thanks for reaching out, ${firstName}. We received your message and will be in touch soon.\n\n— The Art Here Team`,
    }),
  ]);

  return NextResponse.json({ ok: true });
}
