'use client';

import { useState } from 'react';

export function StayInTouchForm() {
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'sent' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    try {
      const res = await fetch('/api/stay-in-touch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, website: honeypot }),
      });
      if (!res.ok) throw new Error();
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <p className="text-[0.85rem] text-white mt-5">
        You&rsquo;re on the list — thanks for staying in touch!
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-start gap-3 mt-5">
      {/* Honeypot — invisible to humans, filled by bots. Server drops any submission with a value. */}
      <input
        type="text"
        name="website"
        value={honeypot}
        onChange={e => setHoneypot(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        placeholder="Stay in touch — enter your email"
        className="flex-1 min-w-[220px] px-4 py-2.5 rounded-full border border-[#444] bg-transparent text-[0.9rem] text-white placeholder-[#777] focus:outline-none focus:border-white transition-colors"
      />
      <button
        type="submit"
        disabled={status === 'submitting' || !email}
        className="shrink-0 px-6 py-2.5 rounded-full bg-white text-[#1a1a1a] text-[0.9rem] font-medium transition-opacity hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
      >
        {status === 'submitting' ? 'Sending…' : 'Sign up'}
      </button>
      {status === 'error' && (
        <p className="w-full text-[0.8rem] text-[#f87171]">Something went wrong — please try again.</p>
      )}
    </form>
  );
}
