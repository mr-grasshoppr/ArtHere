'use client';

import { useState } from 'react';
import Link from 'next/link';

const INPUT = 'w-full px-4 py-3 rounded-lg border border-[#e5e5e5] text-[0.95rem] text-[#1a1a1a] placeholder-[#bbb] focus:outline-none focus:border-[#1a1a1a] transition-colors bg-white';
const BTN_PRIMARY = 'w-full px-6 py-3 rounded-full bg-[#1a1a1a] text-white text-[0.9rem] font-medium transition-opacity hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer';

export function MyArtHereForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'sent'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    try {
      await fetch('/api/magic-link/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      setStatus('sent');
    } catch {
      setStatus('idle');
    }
  }

  if (status === 'sent') {
    return (
      <div>
        <h1 className="font-heading text-[2rem] font-bold tracking-[-0.02em] leading-[1.2] mb-5">
          Check your email
        </h1>
        <p className="text-[1rem] text-[#555] font-light leading-[1.8] mb-8">
          If your email is associated with an Art Here account, we&rsquo;ve sent you a sign-in link.
          It expires in 48 hours.
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
          <Link href="/contact" className="underline underline-offset-[3px] hover:text-[#555] transition-colors">
            contact us
          </Link>.
        </p>
      </div>
    );
  }

  return (
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

      <div className="border-t border-[#f0f0f0] pt-8 flex flex-col gap-4">
        <p className="font-heading text-[1.1rem] font-bold text-[#1a1a1a]">Not on Art Here yet?</p>
        <p className="text-[0.88rem] text-[#555] font-light -mt-2">Let us know how you&rsquo;d like to be involved!</p>
        <div className="flex items-baseline gap-4">
          <span className="text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-[#bbb] w-36 shrink-0">Artists</span>
          <Link href="/join/artists" className="text-[0.9rem] text-[#1a1a1a] underline underline-offset-[3px] decoration-[#ccc] hover:opacity-60 transition-opacity">Get featured →</Link>
        </div>
        <div className="flex items-baseline gap-4">
          <span className="text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-[#bbb] w-36 shrink-0">Places</span>
          <Link href="/join/places" className="text-[0.9rem] text-[#1a1a1a] underline underline-offset-[3px] decoration-[#ccc] hover:opacity-60 transition-opacity">Showcase your space →</Link>
        </div>
        <div className="flex items-baseline gap-4">
          <span className="text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-[#bbb] w-36 shrink-0">Partners</span>
          <Link href="/join/organizations" className="text-[0.9rem] text-[#1a1a1a] underline underline-offset-[3px] decoration-[#ccc] hover:opacity-60 transition-opacity">Collaborate with us →</Link>
        </div>
        <div className="flex items-baseline gap-4">
          <span className="text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-[#bbb] w-36 shrink-0">Cities &amp; Neighborhoods</span>
          <Link href="/join/cities" className="text-[0.9rem] text-[#1a1a1a] underline underline-offset-[3px] decoration-[#ccc] hover:opacity-60 transition-opacity">Invite Art Here →</Link>
        </div>
      </div>
    </div>
  );
}
