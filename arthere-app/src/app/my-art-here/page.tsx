'use client';

import { useState } from 'react';
import Link from 'next/link';
import { NavBar } from '@/components/NavBar';

const INPUT = 'w-full px-4 py-3 rounded-lg border border-[#e5e5e5] text-[0.95rem] text-[#1a1a1a] placeholder-[#bbb] focus:outline-none focus:border-[#1a1a1a] transition-colors bg-white';
const BTN_PRIMARY = 'w-full px-6 py-3 rounded-full bg-[#1a1a1a] text-white text-[0.9rem] font-medium transition-opacity hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer';

export default function MyArtHerePage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'sent' | 'not-found'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    try {
      await fetch('/api/magic-link/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      // Always show "check your email" — don't reveal whether account exists
      setStatus('sent');
    } catch {
      setStatus('idle');
    }
  }

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]">
      <NavBar theme="light" />

      <main className="max-w-[480px] mx-auto px-5 pt-28 pb-20">
        <div className="text-[0.7rem] font-semibold tracking-[0.14em] uppercase text-[#bbb] mb-4">
          My Art Here
        </div>

        {status === 'sent' ? (
          <div>
            <h1 className="font-heading text-[2rem] font-bold tracking-[-0.02em] leading-[1.2] mb-5">
              Check your email
            </h1>
            <p className="text-[1rem] text-[#555] font-light leading-[1.8] mb-8">
              If your email is associated with an Art Here account, we&rsquo;ve sent you a sign-in link.
              It expires in 72 hours.
            </p>
            <p className="text-[0.88rem] text-[#999]">
              Don&rsquo;t see an email?{' '}
              <button
                type="button"
                className="underline underline-offset-[3px] hover:text-[#555] transition-colors"
                onClick={() => { setStatus('idle'); setEmail(''); }}
              >
                Try again
              </button>
              {' '}or{' '}
              <a href="mailto:hello@artishere.org" className="underline underline-offset-[3px] hover:text-[#555] transition-colors">
                contact us
              </a>
              .
            </p>
          </div>
        ) : (
          <div>
            <h1 className="font-heading text-[2rem] font-bold tracking-[-0.02em] leading-[1.2] mb-5">
              Welcome back.
            </h1>
            <p className="text-[1rem] text-[#555] font-light leading-[1.8] mb-8">
              Enter your email to sign in and edit your Art Here profile.
              We&rsquo;ll send you a secure link — no password needed.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-10">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="you@example.com"
                className={INPUT}
              />
              <button type="submit" disabled={status === 'submitting' || !email} className={BTN_PRIMARY}>
                {status === 'submitting' ? 'Sending…' : 'Send sign-in link'}
              </button>
            </form>

            <div className="border-t border-[#f0f0f0] pt-8">
              <p className="text-[0.88rem] text-[#999] font-light leading-[1.7]">
                <strong className="text-[#555] font-semibold">Not yet on Art Here?</strong>
                <br />
                Let us know how you&rsquo;d like to be involved!{' '}
                <Link href="/contact?type=featured" className="underline underline-offset-[3px] text-[#555] hover:text-[#1a1a1a] transition-colors">
                  Request an invite to become a featured artist
                </Link>
                ,{' '}
                <Link href="/contact?type=partner" className="underline underline-offset-[3px] text-[#555] hover:text-[#1a1a1a] transition-colors">
                  partner with us
                </Link>
                , or{' '}
                <Link href="/contact?type=bring" className="underline underline-offset-[3px] text-[#555] hover:text-[#1a1a1a] transition-colors">
                  bring us to you
                </Link>
                .
              </p>
            </div>
          </div>
        )}
      </main>

      <footer className="text-center pb-10 text-[#bbb] text-[0.78rem]">
        <Link href="/" className="hover:text-[#555] transition-colors no-underline text-[#bbb]">
          ← Back to Art Here
        </Link>
      </footer>
    </div>
  );
}
