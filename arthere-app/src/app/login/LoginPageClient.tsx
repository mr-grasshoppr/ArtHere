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
      <div className={`${nunito.variable} min-h-screen bg-white text-[#1a1a1a]`}>
        <SimpleNav />
        <main className="flex items-center justify-center px-4 pt-28 pb-16">
          <div className="w-full max-w-sm text-center">
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
      </div>
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

function SimpleNav() {
  const [open, setOpen] = useState(false);
  return (
    <>
      {open && <div className="fixed inset-0 z-[150]" onClick={() => setOpen(false)} aria-hidden />}
      <div className="fixed top-0 left-0 right-0 h-14 z-[200] flex items-center px-[18px] gap-3 bg-white/[0.97] backdrop-blur-[10px] border-b border-[#eee]">
        <Link href="/" className="flex-shrink-0 opacity-90 hover:opacity-100 transition-opacity">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/arthere-logo-dark.png" alt="Art Here" className="h-[38px] w-auto" />
        </Link>
        <div className="relative flex-shrink-0 ml-auto z-[210]">
          <button
            className="bg-transparent border-none cursor-pointer p-1 flex flex-col gap-1"
            onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
            aria-label="Menu"
          >
            {[0,1,2].map(i => (
              <span key={i} className="block w-[18px] h-[1.5px] bg-[#1a1a1a] transition-all duration-[250ms]"
                style={i === 0 && open ? { transform: 'translateY(5.5px) rotate(45deg)' }
                  : i === 1 && open ? { opacity: 0 }
                  : i === 2 && open ? { transform: 'translateY(-5.5px) rotate(-45deg)' }
                  : undefined}
              />
            ))}
          </button>
          {open && (
            <div className="absolute top-[calc(100%+8px)] right-0 rounded-md overflow-hidden min-w-[160px] bg-white border border-[#eee] shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
              {[['/#about','About Us'],['/survey','Join Us'],['/survey','Take the Survey'],['/#contact','Contact Us']].map(([href, label]) => (
                <Link key={href} href={href} onClick={() => setOpen(false)}
                  className="block px-5 py-[13px] text-[0.9rem] text-[#444] border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#fafafa] hover:text-[#1a1a1a] transition-colors">
                  {label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
