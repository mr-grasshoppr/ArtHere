import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Nodemailer from "next-auth/providers/nodemailer";
import { prisma } from "./db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Nodemailer({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM ?? "Art Here Portland <hello@arthere.portland>",
      // Magic links expire in 20 minutes
      maxAge: 60 * 20,
      sendVerificationRequest: async ({ identifier: email, url, provider }) => {
        console.log("MAGIC_LINK:", url);
        if (process.env.NODE_ENV === "development") {
          const { writeFileSync } = await import("fs");
          writeFileSync("/tmp/arthere-dev-link.txt", url);
        }
        // Use the configured email server
        const { createTransport } = await import("nodemailer");
        const transport = createTransport(provider.server as string);
        await transport.sendMail({
          to: email,
          from: provider.from,
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
