"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const params = useSearchParams();
  const verify = params.get("verify");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await signIn("nodemailer", { email, callbackUrl: "/profile", redirect: false });
      window.location.href = "/login?verify=1";
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  if (verify) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mb-6">
            <svg className="mx-auto w-12 h-12 text-stone-400 dark:text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-medium text-stone-900 dark:text-stone-100 mb-3">Check your email</h1>
          <p className="text-stone-500 dark:text-stone-400 leading-relaxed mb-2">
            We sent you a sign-in link. Click it to access your profile.
          </p>
          <p className="text-stone-400 dark:text-stone-500 text-sm">The link expires in 20 minutes.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <a href="/" className="text-stone-400 dark:text-stone-500 text-sm hover:text-stone-600 dark:hover:text-stone-300 transition-colors">
            ← Art Here Portland
          </a>
        </div>

        <h1 className="text-2xl font-medium text-stone-900 dark:text-stone-100 mb-2">Sign in</h1>
        <p className="text-stone-500 dark:text-stone-400 mb-8 leading-relaxed">
          Enter your email and we&rsquo;ll send you a sign-in link. No password needed.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
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
              className="w-full px-4 py-3 border border-stone-200 dark:border-stone-700 rounded-md bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-stone-500 focus:border-transparent transition"
            />
          </div>

          {error && (
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || !email}
            className="w-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 py-3 rounded-md font-medium hover:bg-stone-700 dark:hover:bg-stone-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Sending…" : "Send sign-in link"}
          </button>
        </form>

        <p className="mt-6 text-stone-400 dark:text-stone-500 text-xs leading-relaxed">
          By signing in, you agree to our terms. Your email is used only for authentication — we never share it.
        </p>
      </div>
    </main>
  );
}
