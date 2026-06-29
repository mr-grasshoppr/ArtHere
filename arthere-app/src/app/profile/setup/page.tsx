import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { verifyMagicLinkToken } from '@/lib/magic-link';

// How long to keep the created session alive (matches auth.ts maxAge).
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

/**
 * Magic-link landing page.
 *
 * Flow:
 *   1. Read ?token from the URL (passed as a searchParam by Next.js).
 *   2. Verify the token — single-use, 72-hour TTL.
 *   3. Create a real NextAuth database session for the artist's user.
 *   4. Set the session cookie so subsequent requests are authenticated.
 *   5. Redirect to /onboarding so the artist can fill out their profile.
 *
 * Error states render a minimal page with a plain-English message and a
 * "Request a new link" form rather than throwing.
 */
export default async function ProfileSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  // ── 1. Missing token ──────────────────────────────────────────────────────
  if (!token) {
    return <ErrorPage message="No token found in this link. Please check your email and try again." />;
  }

  // ── 2. Verify token ───────────────────────────────────────────────────────
  let result: Awaited<ReturnType<typeof verifyMagicLinkToken>>;
  try {
    result = await verifyMagicLinkToken(token);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'This link is invalid.';
    return <ErrorPage message={message} />;
  }

  const userId = result.artist?.userId ?? result.place?.userId;
  if (!userId) {
    return <ErrorPage message="This link is not associated with a valid account." />;
  }

  // ── 3. Create a NextAuth database session ─────────────────────────────────
  const sessionToken = crypto.randomUUID();
  const expires = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await prisma.session.create({
    data: { sessionToken, userId, expires },
  });

  // ── 4. Set the session cookie ─────────────────────────────────────────────
  // NextAuth v5 uses "authjs.session-token" in dev and
  // "__Secure-authjs.session-token" in production (HTTPS).
  const isProd = process.env.NODE_ENV === 'production';
  const cookieName = isProd ? '__Secure-authjs.session-token' : 'authjs.session-token';

  const cookieStore = await cookies();
  cookieStore.set(cookieName, sessionToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    expires,
  });

  // ── 5. Redirect to the right editor ──────────────────────────────────────
  redirect(result.place ? '/place/edit' : '/onboarding');
}

// ─── Error UI ────────────────────────────────────────────────────────────────

function ErrorPage({ message }: { message: string }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-5 bg-white">
      <div className="max-w-md w-full text-center">
        <h1 className="font-heading text-[1.6rem] font-bold tracking-[-0.02em] text-[#1a1a1a] mb-4">
          This link didn&rsquo;t work
        </h1>
        <p className="text-[1rem] text-[#666] font-light leading-[1.8] mb-10">
          {message}
        </p>
        <RequestNewLink />
      </div>
    </main>
  );
}

function RequestNewLink() {
  return (
    <div className="border border-[#f0f0f0] rounded-xl p-6 text-left">
      <p className="text-[0.85rem] font-semibold text-[#1a1a1a] mb-4">
        Request a new link
      </p>
      <form action="/api/magic-link/request" method="POST" className="flex flex-col gap-3">
        <input
          type="email"
          name="email"
          required
          placeholder="your@email.com"
          className="w-full px-4 py-3 rounded-lg border border-[#e5e5e5] text-[0.95rem] text-[#1a1a1a] placeholder-[#bbb] focus:outline-none focus:border-[#1a1a1a] transition-colors"
        />
        <button
          type="submit"
          className="w-full px-6 py-3 rounded-full bg-[#1a1a1a] text-white text-[0.9rem] font-medium hover:opacity-80 transition-opacity"
        >
          Send me a new link
        </button>
      </form>
      <p className="mt-4 text-[0.78rem] text-[#bbb] leading-[1.6]">
        We&rsquo;ll send a fresh link to the email you used when completing the survey.
        It arrives within a minute and works for 72 hours.
      </p>
    </div>
  );
}
