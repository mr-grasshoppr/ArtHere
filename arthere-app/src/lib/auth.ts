import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import ResendProvider from "next-auth/providers/resend";
import { prisma } from "./db";
import { resend } from "./resend";

const FROM_ADDRESS = process.env.EMAIL_FROM ?? "Art Here <hello@artishere.org>";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    ResendProvider({
      from: FROM_ADDRESS,
      // Magic links expire in 20 minutes
      maxAge: 60 * 20,
      sendVerificationRequest: async ({ identifier: email, url }) => {
        if (process.env.NODE_ENV === "development") {
          // Dev convenience only — sign-in URLs must never reach production logs.
          console.log("MAGIC_LINK:", url);
          const { writeFileSync } = await import("fs");
          writeFileSync("/tmp/arthere-dev-link.txt", url);
        }
        await resend.emails.send({
          from: FROM_ADDRESS,
          to: email,
          subject: "Sign in to Art Here Portland",
          text: `Click this link to sign in (expires in 20 minutes):\n\n${url}\n\nIf you didn't request this, you can safely ignore this email.`,
          html: `
            <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; color: #1a1a1a;">
              <h2 style="font-size: 1.4rem; font-weight: 500; margin: 0 0 24px;">Sign in to Art Here Portland</h2>
              <p style="color: #555; line-height: 1.6; margin: 0 0 32px;">
                Click the button below to sign in. This link expires in 20 minutes.
              </p>
              <a href="${url}" style="display: inline-block; background: #1a1a1a; color: #fff; padding: 14px 28px; border-radius: 4px; text-decoration: none; font-size: 0.95rem; letter-spacing: 0.01em;">
                Sign in to your profile
              </a>
              <p style="color: #999; font-size: 0.8rem; margin: 32px 0 0; line-height: 1.5;">
                If you didn't request this, you can safely ignore this email.<br>
                This link will stop working after 20 minutes.
              </p>
            </div>
          `,
        });
      },
    }),
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/login?verify=1",
  },
  callbacks: {
    session: async ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
      },
    }),
  },
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
});

// ─── Manual session issuance ─────────────────────────────────────────────────
// Used by the custom magic-link flow (/profile/setup) to sign a user in after
// verifying their one-time token. This is the ONLY place outside NextAuth
// that may know the session cookie's name — if Auth.js ever changes its
// cookie naming, update it here.

export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export function sessionCookieName(): string {
  return process.env.NODE_ENV === "production"
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";
}

/**
 * Create a database session for the user and return the cookie to set.
 */
export async function createSessionForUser(userId: string): Promise<{
  name: string;
  value: string;
  options: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: "lax";
    path: string;
    expires: Date;
  };
}> {
  const sessionToken = crypto.randomUUID();
  const expires = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  await prisma.session.create({ data: { sessionToken, userId, expires } });

  return {
    name: sessionCookieName(),
    value: sessionToken,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires,
    },
  };
}
