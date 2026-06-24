import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendMagicLink } from '@/lib/magic-link';

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

// POST — submit a Portland Community Survey response. Public (no auth) —
// anyone visiting /survey can fill this out.
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const response = await prisma.surveyResponse.create({
    data: {
      portlandFamiliarity: str(body.portlandFamiliarity),
      portlandWords: strArray(body.portlandWords),
      portlandHelpers: str(body.portlandHelpers),
      portlandWish: str(body.portlandWish),

      artistStatus: str(body.artistStatus),
      artistStatusOther: str(body.artistStatusOther),

      zipCode: str(body.zipCode),
      neighborhoods: str(body.neighborhoods),

      mvFamiliarity: str(body.mvFamiliarity),
      mvWords: strArray(body.mvWords),
      mvConnectionLevel: str(body.mvConnectionLevel),
      mvHelpers: str(body.mvHelpers),
      mvSupport: strArray(body.mvSupport),
      mvSupportOther: str(body.mvSupportOther),

      multnomahDaysInvolvement: strArray(body.multnomahDaysInvolvement),

      practiceActivities: strArray(body.practiceActivities),
      practiceGoals: strArray(body.practiceGoals),
      practiceGoalsOther: str(body.practiceGoalsOther),
      practiceSupport: str(body.practiceSupport),

      featuredArtistInterest: str(body.featuredArtistInterest),

      stayConnected: strArray(body.stayConnected),

      raffleOptIn: str(body.raffleOptIn),
      email: str(body.email),
      learnedAbout: strArray(body.learnedAbout),
    },
  });

  // If the respondent wants to be a featured artist and left an email, provision
  // their account and send a magic link so they can set up their profile.
  const wantsToBeFeatures =
    typeof body.featuredArtistInterest === 'string' &&
    body.featuredArtistInterest.startsWith('Yes');
  const email = response.email;

  if (wantsToBeFeatures && email) {
    try {
      await provisionArtistAndSendLink(email);
    } catch (err) {
      // Log but don't fail the survey submission.
      console.error('[survey] magic-link provisioning failed:', err);
    }
  }

  return NextResponse.json({ ok: true, id: response.id });
}

async function provisionArtistAndSendLink(email: string) {
  // Derive a placeholder name and slug from the email local-part.
  // The artist will set their real name when they complete their profile.
  const localPart = email.split('@')[0].replace(/[^a-z0-9]/gi, ' ').trim();
  const placeholderName = localPart.charAt(0).toUpperCase() + localPart.slice(1);

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
  const artist = await prisma.artist.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      slug,
      name: placeholderName,
      cityId: portland?.id ?? null,
    },
    update: {},
  });

  await sendMagicLink({
    email,
    artistId: artist.id,
    artistName: placeholderName,
  });
}

// PATCH — update an existing draft response by id.
export async function PATCH(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  await prisma.surveyResponse.update({
    where: { id },
    data: {
      portlandFamiliarity: str(body.portlandFamiliarity),
      portlandWords: strArray(body.portlandWords),
      portlandHelpers: str(body.portlandHelpers),
      portlandWish: str(body.portlandWish),
      artistStatus: str(body.artistStatus),
      artistStatusOther: str(body.artistStatusOther),
      zipCode: str(body.zipCode),
      neighborhoods: str(body.neighborhoods),
      mvFamiliarity: str(body.mvFamiliarity),
      mvWords: strArray(body.mvWords),
      mvConnectionLevel: str(body.mvConnectionLevel),
      mvHelpers: str(body.mvHelpers),
      mvSupport: strArray(body.mvSupport),
      mvSupportOther: str(body.mvSupportOther),
      multnomahDaysInvolvement: strArray(body.multnomahDaysInvolvement),
      practiceActivities: strArray(body.practiceActivities),
      practiceGoals: strArray(body.practiceGoals),
      practiceGoalsOther: str(body.practiceGoalsOther),
      practiceSupport: str(body.practiceSupport),
      featuredArtistInterest: str(body.featuredArtistInterest),
      stayConnected: strArray(body.stayConnected),
      raffleOptIn: str(body.raffleOptIn),
      email: str(body.email),
      learnedAbout: strArray(body.learnedAbout),
    },
  });

  return NextResponse.json({ ok: true });
}
