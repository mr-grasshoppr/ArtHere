import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import ResendProvider from "next-auth/providers/resend";
import React from "react";
import { prisma } from "./db";
import { resend } from "./resend";
import { SignInEmail } from "@/emails/SignInEmail";
import { renderEmail } from "@/lib/render-email";

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
        const { html, text } = await renderEmail(React.createElement(SignInEmail, { link: url }));
        await resend.emails.send({
          from: FROM_ADDRESS,
          to: email,
          subject: "Sign in to Art Here",
          html,
          text,
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
