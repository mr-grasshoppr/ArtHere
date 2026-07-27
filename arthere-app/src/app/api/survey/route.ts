import { NextRequest, NextResponse } from 'next/server';
import { waitUntil } from '@vercel/functions';
import { randomBytes } from 'crypto';
import React from 'react';
import { render } from '@react-email/components';
import { SurveyThankYouEmail } from '@/emails/SurveyThankYouEmail';
import { prisma } from '@/lib/db';
import { resend } from '@/lib/resend';
import { rateLimit } from '@/lib/rate-limit';
import { escapeHtml } from '@/lib/email';
import { INVOLVEMENT_FEATURED } from '@/lib/survey-constants';
import { surveySchema, parseBody } from '@/lib/schemas';

// Returns a trimmed string, or null if empty/not a string. Keeps the
// SurveyResponse table free of empty-string noise for skipped questions.
function str(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

// Returns an array of trimmed, non-empty strings.
function strArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string').map(v => v.trim()).filter(v => v !== '');
}

// Maps the request body onto SurveyResponse columns (shared by POST + PATCH).
function responseData(body: Record<string, unknown>) {
  return {
    zipCode: str(body.zipCode),
    neighborhoods: str(body.neighborhoods),

    occupation: strArray(body.occupation),
    occupationOther: str(body.occupationOther),

    artistStatus: str(body.artistStatus),
    artistStatusOther: str(body.artistStatusOther),
    artMedium: strArray(body.artMedium),
    artMediumOther: str(body.artMediumOther),

    portlandFamiliarity: str(body.portlandFamiliarity),
    discoveryEase: str(body.discoveryEase),
    discoveryChannel: strArray(body.discoveryChannel),
    discoveryChannelOther: str(body.discoveryChannelOther),

    portlandHelpers: str(body.portlandHelpers),
    portlandSupport: strArray(body.portlandSupport),
    portlandSupportOther: str(body.portlandSupportOther),

    careerStage: str(body.careerStage),
    careerStageOther: str(body.careerStageOther),

    practiceActivities: strArray(body.practiceActivities),
    practiceActivitiesOther: str(body.practiceActivitiesOther),
    practiceGoals: strArray(body.practiceGoals),
    practiceGoalsOther: str(body.practiceGoalsOther),
    practiceSupport: str(body.practiceSupport),

    involvementInterests: strArray(body.involvementInterests),
    involvementInterestsOther: str(body.involvementInterestsOther),

    raffleOptIn: str(body.raffleOptIn),
    email: str(body.email),
    learnedAbout: strArray(body.learnedAbout),
    openFeedback: str(body.openFeedback),

    // Attribution — which link/channel brought the respondent here.
    source: str(body.source) ?? 'website',
  };
}

// Completion side effects: admin notification, respondent thank-you, and
// featured-artist provisioning. Runs exactly once, when the respondent
// reaches the final Submit (POST or PATCH with `completed: true`) — drafts
// must never trigger email.
async function onCompleted(response: { id: string; email: string | null; involvementInterests: string[] }) {
  const involvementList = response.involvementInterests;
  const email = response.email;

  // Featured-artist interest reserves a placeholder profile so the respondent
  // shows up in /admin/artists — but we deliberately do NOT email them a
  // profile-setup link here. Expressing interest is not acceptance; the invite
  // goes out by hand from the admin dashboard after review. The only mail a
  // respondent gets is the thank-you below.
  if (involvementList.includes(INVOLVEMENT_FEATURED) && email) {
    try {
      await provisionArtistPlaceholder(email);
    } catch (err) {
      console.error('[survey] placeholder provisioning failed:', err);
    }
  }

  // waitUntil keeps the serverless function alive until the emails send —
  // bare fire-and-forget promises are frozen once the response returns.
  waitUntil(resend.emails.send({
    from: 'Art Here <hello@artishere.org>',
    to: 'maryannamail@gmail.com',
    subject: 'New PDX Community Survey Response',
    text: `A new survey response was submitted.\n\nRespondent email: ${email ?? '(not provided)'}\n\nGet involved:\n${involvementList.length ? involvementList.map(i => `• ${i}`).join('\n') : 'None selected'}\n\nView all responses: https://artishere.org/admin/survey`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; color: #1a1a1a;">
        <h2 style="font-size: 1.2rem; font-weight: 500; margin: 0 0 20px;">New Survey Response</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
          <tr>
            <td style="padding: 8px 12px 8px 0; color: #888; white-space: nowrap; vertical-align: top;">Respondent email</td>
            <td style="padding: 8px 0; color: #1a1a1a;">${email ? `<a href="mailto:${escapeHtml(email)}" style="color: #1a1a1a;">${escapeHtml(email)}</a>` : '<em style="color:#aaa">not provided</em>'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px 8px 0; color: #888; white-space: nowrap; vertical-align: top;">Get involved</td>
            <td style="padding: 8px 0; color: #1a1a1a;">${involvementList.length ? involvementList.map(i => `• ${escapeHtml(i)}`).join('<br>') : '<em style="color:#aaa">None selected</em>'}</td>
          </tr>
        </table>
        <p style="margin: 28px 0 0;">
          <a href="https://artishere.org/admin/survey" style="color: #1a1a1a; font-size: 0.85rem;">View all responses →</a>
        </p>
      </div>
    `,
  }).catch(err => console.error('[survey] admin notification failed:', err)));

  if (email) {
    waitUntil(sendThankYou(email).catch(
      err => console.error('[survey] thank-you email failed:', err),
    ));
  }
}

// Rendered here rather than via Resend's `react` prop — see the note in
// lib/magic-link.ts for why that path throws in our bundle.
async function sendThankYou(email: string) {
  const element = React.createElement(SurveyThankYouEmail);
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);
  await resend.emails.send({
    from: 'Art Here <hello@artishere.org>',
    to: email,
    bcc: 'hello@artishere.org',
    subject: 'Thank you for completing the PDX Community Survey!',
    html,
    text,
  });
}

// POST — create a survey response (draft or, with `completed: true`, a
// finished submission). Public: anyone visiting /survey can fill this out.
// Returns a draftToken the client must present to PATCH this response later.
export async function POST(req: NextRequest) {
  const limited = rateLimit(req, 'survey-post', { limit: 10, windowSeconds: 600 });
  if (limited) return limited;

  const raw = await req.json().catch(() => null);
  const body = parseBody(surveySchema, raw);
  if (!body) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

  const completed = body.completed === true;
  const draftToken = randomBytes(24).toString('base64url');

  const response = await prisma.surveyResponse.create({
    data: {
      ...responseData(body),
      draftToken,
      completedAt: completed ? new Date() : null,
    },
  });

  if (completed) {
    await onCompleted(response);
  }

  return NextResponse.json({ ok: true, id: response.id, draftToken });
}

// Reserves a User + placeholder Artist for a respondent who asked to be a
// featured artist, so an admin can review and invite them later. Sends nothing.
async function provisionArtistPlaceholder(email: string) {
  // The survey never asks for a name, so we don't have one. Leave it blank
  // rather than inventing one from the email local-part — a derived name like
  // "Maryannamail" would end up greeting them in the invite email and showing
  // as their name in the admin list.

  // Upsert User.
  const user = await prisma.user.upsert({
    where: { email },
    create: { email },
    update: {},
  });

  // Find Portland (fall back gracefully if the city seed hasn't run).
  const portland = await prisma.city.findUnique({ where: { slug: 'portland' } });

  // Build a unique slug from the email local-part.
  const baseSlug = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-');
  const slug = `${baseSlug}-${user.id.slice(-6)}`;

  // Upsert Artist — if the user submitted the survey twice we reuse their record.
  // isPlaceholder keeps this stub out of the public directory (see
  // lib/city-scope.ts) until an admin reviews it. Without it the record would
  // default to false and publish an empty profile to the Portland directory.
  await prisma.artist.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      slug,
      name: '',
      isPlaceholder: true,
      cityId: portland?.id ?? null,
    },
    update: {},
  });
}

// PATCH — update an existing response. Requires the draftToken issued to the
// client that created it; without it anyone could overwrite responses by id.
export async function PATCH(req: NextRequest) {
  const limited = rateLimit(req, 'survey-patch', { limit: 60, windowSeconds: 600 });
  if (limited) return limited;

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const raw = await req.json().catch(() => null);
  const body = parseBody(surveySchema, raw);
  if (!body) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

  const draftToken = typeof body.draftToken === 'string' ? body.draftToken : null;
  if (!draftToken) return NextResponse.json({ error: 'Missing draft token' }, { status: 401 });

  const existing = await prisma.surveyResponse.findUnique({
    where: { id },
    select: { draftToken: true, completedAt: true },
  });
  if (!existing || !existing.draftToken || existing.draftToken !== draftToken) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const completed = body.completed === true;
  const firstCompletion = completed && !existing.completedAt;

  const response = await prisma.surveyResponse.update({
    where: { id },
    data: {
      ...responseData(body),
      ...(firstCompletion ? { completedAt: new Date() } : {}),
    },
  });

  if (firstCompletion) {
    await onCompleted(response);
  }

  return NextResponse.json({ ok: true });
}
