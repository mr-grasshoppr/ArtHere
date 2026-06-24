"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Nunito } from "next/font/google";
import Link from "next/link";
import styles from "./page.module.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-nunito",
  display: "swap",
});

const INPUT_CLASS =
  "w-full px-4 py-3 rounded-lg border border-[#e5e5e5] text-[0.95rem] text-[#1a1a1a] placeholder-[#bbb] focus:outline-none focus:border-[#1a1a1a] transition-colors bg-white";

const BUTTON_PRIMARY =
  "w-full px-6 py-3 rounded-full bg-[#1a1a1a] text-white text-[0.9rem] font-medium transition-opacity hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [devLink, setDevLink] = useState("");
  const params = useSearchParams();
  const verify = params.get("verify");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setDevLink("");
    try {
      const callbackUrl = params.get("callbackUrl") ?? "/profile";
      await signIn("nodemailer", { email, callbackUrl, redirect: false });
      // In development, fetch the sign-in link directly so it can be shown on screen
      if (process.env.NODE_ENV === "development") {
        await new Promise((r) => setTimeout(r, 600));
        const res = await fetch("/api/dev-link");
        const data = await res.json();
        if (data.url) { setDevLink(data.url); setSubmitting(false); return; }
      }
      window.location.href = "/login?verify=1";
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  if (verify) {
    return (
      <main className={`${nunito.variable} min-h-screen flex items-center justify-center px-4 bg-white text-[#1a1a1a]`}>
        <div className="w-full max-w-sm text-center">
          <Link href="/" className="inline-block mb-10">
            <div className={`${styles.logoMask} mx-auto`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/hero-painting.jpg" alt="Art Here" />
            </div>
          </Link>
          <div className="mb-6">
            <svg className="mx-auto w-12 h-12 text-[#bbb]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="font-heading text-[1.5rem] font-bold tracking-[-0.01em] mb-3">Check your email</h1>
          <p className="text-[#666] font-light leading-[1.8] mb-2">
            We sent you a sign-in link. Click it to access your profile.
          </p>
          <p className="text-[#999] text-sm">The link expires in 20 minutes.</p>
        </div>
      </main>
    );
  }

  return (
    <main className={`${nunito.variable} min-h-screen flex items-center justify-center px-4 bg-white text-[#1a1a1a]`}>
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <Link href="/" className="inline-block mb-8">
            <div className={`${styles.logoMask} mx-auto`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/hero-painting.jpg" alt="Art Here" />
            </div>
          </Link>
          <h1 className="font-heading text-[1.7rem] font-bold tracking-[-0.01em] leading-[1.2] mb-3">
            Join us to put artists on the map!
          </h1>
          <p className="text-[#666] font-light leading-[1.8]">
            Sign in to set up your profile and connect with your local arts community.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-[0.85rem] font-medium text-[#444] mb-2">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              placeholder="you@example.com"
              className={INPUT_CLASS}
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || !email}
            className={BUTTON_PRIMARY}
          >
            {submitting ? "Sending…" : "Send sign-in link"}
          </button>
        </form>

        {devLink && (
          <div className="mt-6 p-4 bg-[#f9f9f9] rounded-lg text-center">
            <p className="text-[#999] text-xs mb-3">Dev mode: email links don&rsquo;t send locally, click below instead</p>
            <a href={devLink} className={BUTTON_PRIMARY + " inline-block text-center"}>
              Sign in now
            </a>
          </div>
        )}

        <p className="mt-6 text-[#999] text-xs leading-relaxed text-center">
          No password needed. By signing in, you agree to our terms. Your email is used only for
          authentication and is never shared.
        </p>
      </div>
    </main>
  );
}
