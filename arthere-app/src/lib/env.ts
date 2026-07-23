// Boot-time environment validation. Imported from lib/db.ts so it runs in
// every server context that touches the database — a missing var fails
// loudly at startup instead of as a confusing runtime error later.
//
// Build note: `next build` runs without runtime secrets in CI, so we only
// enforce when a server is actually handling requests (not during build).

const REQUIRED = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "RESEND_API_KEY",
  "ANTHROPIC_API_KEY",
] as const;

// Wanted in production but survivable without (features degrade):
//   DEMO_TOKEN            — portland-demo gate stays closed without it
//   ADMIN_EMAILS          — falls back to the founding admin address
//   NEXT_PUBLIC_BASE_URL  — falls back to https://artishere.org
//   BLOB_READ_WRITE_TOKEN — uploads fail without it

const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

export function assertEnv(): void {
  if (isBuildPhase) return;
  const missing = REQUIRED.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. ` +
        `Check .env.local (dev) or the Vercel project settings (deployed).`
    );
  }
}

assertEnv();
