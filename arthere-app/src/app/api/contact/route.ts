import { NextRequest, NextResponse } from 'next/server';
import { resend } from '@/lib/resend';

const INTENTS: Record<string, string> = {
  featured: 'Get Featured on Art Here',
  partner: 'Partner with Art Here',
  bring: 'Bring Art Here to My City',
  invite: 'Request an Art Here Invite',
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, message, intent } = body;

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 });
  }

  const subject = INTENTS[intent] ?? 'Message from Art Here website';

  await resend.emails.send({
    from: 'Art Here <hello@artishere.org>',
    to: 'hello@artishere.org',
    replyTo: email.trim(),
    subject,
    text: [
      `From: ${name.trim()} <${email.trim()}>`,
      `Intent: ${subject}`,
      '',
      message?.trim() ? message.trim() : '(No additional message)',
    ].join('\n'),
    html: `
      <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 40px 24px; color: #1a1a1a;">
        <h2 style="font-size: 1.2rem; font-weight: 500; margin: 0 0 24px;">${subject}</h2>
        <p style="color: #555; margin: 0 0 8px;"><strong>Name:</strong> ${name.trim()}</p>
        <p style="color: #555; margin: 0 0 8px;"><strong>Email:</strong> ${email.trim()}</p>
        ${message?.trim() ? `<p style="color: #555; margin: 24px 0 0;"><strong>Message:</strong><br>${message.trim().replace(/\n/g, '<br>')}</p>` : ''}
      </div>
    `,
  });

  return NextResponse.json({ ok: true });
}
