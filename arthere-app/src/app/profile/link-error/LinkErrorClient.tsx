"use client";

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function LinkErrorClient() {
  const params = useSearchParams();
  const message = params.get('msg') ?? 'This link is invalid.';
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  async function requestNew(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    await fetch('/api/magic-link/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setSent(true);
    setSending(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-5 bg-white">
      <div className="max-w-md w-full text-center">
        <h1 className="font-heading text-[1.6rem] font-bold tracking-[-0.02em] text-[#1a1a1a] mb-4">
          This link didn&rsquo;t work
        </h1>
        <p className="text-[1rem] text-[#666] font-light leading-[1.8] mb-10">
          {message}
        </p>

        {sent ? (
          <p className="text-[0.95rem] text-[#1a1a1a]">
            Check your inbox — a new link is on its way.
          </p>
        ) : (
          <div className="border border-[#f0f0f0] rounded-xl p-6 text-left">
            <p className="text-[0.85rem] font-semibold text-[#1a1a1a] mb-4">
              Request a new link
            </p>
            <form onSubmit={requestNew} className="flex flex-col gap-3">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="w-full px-4 py-3 rounded-lg border border-[#e5e5e5] text-[0.95rem] text-[#1a1a1a] placeholder-[#bbb] focus:outline-none focus:border-[#1a1a1a] transition-colors"
              />
              <button
                type="submit"
                disabled={sending || !email}
                className="w-full px-6 py-3 rounded-full bg-[#1a1a1a] text-white text-[0.9rem] font-medium hover:opacity-80 disabled:opacity-30 transition-opacity cursor-pointer"
              >
                {sending ? 'Sending…' : 'Send me a new link'}
              </button>
            </form>
            <p className="mt-4 text-[0.78rem] text-[#bbb] leading-[1.6]">
              We&rsquo;ll send a fresh link to the email you used when completing the survey.
              It arrives within a minute and works for 72 hours.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
