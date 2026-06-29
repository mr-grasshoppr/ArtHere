'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const INTENTS: Record<string, { greeting: string; opening: string }> = {
  featured: {
    greeting: 'Get featured on Art Here',
    opening: 'I want to be a featured artist on Art Here.',
  },
  partner: {
    greeting: 'Partner with Art Here',
    opening: 'I want to partner or collaborate with Art Here.',
  },
  bring: {
    greeting: 'Bring Art Here to my city',
    opening: 'I want to bring Art Here to my city or neighborhood.',
  },
  invite: {
    greeting: 'Request an Art Here invite',
    opening: `I'd like to request an invite to join Art Here.`,
  },
};

const DEFAULT_INTENT = {
  greeting: 'Get in touch',
  opening: `I'd like to learn more about Art Here.`,
};

const INPUT = 'w-full px-4 py-3 rounded-lg border border-[#e5e5e5] text-[0.95rem] text-[#1a1a1a] placeholder-[#bbb] focus:outline-none focus:border-[#1a1a1a] transition-colors bg-white';
const BTN = 'w-full px-6 py-3.5 rounded-full bg-[#1a1a1a] text-white text-[0.95rem] font-medium transition-opacity hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer';

export function ContactForm() {
  const params = useSearchParams();
  const intentKey = params.get('type') ?? '';
  const intent = INTENTS[intentKey] ?? DEFAULT_INTENT;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [social, setSocial] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'sent' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, social, message, intent: intentKey }),
      });
      if (!res.ok) throw new Error();
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div className="text-center py-10">
        <h2 className="font-heading text-[1.8rem] font-bold tracking-[-0.02em] mb-4">We got your message!</h2>
        <p className="text-[1rem] text-[#555] font-light leading-[1.8] mb-8">
          Thanks for reaching out. We&rsquo;ll be in touch soon.
        </p>
        <Link href="/" className="text-[0.9rem] text-[#1a1a1a] underline underline-offset-[3px] hover:opacity-60 transition-opacity">
          ← Back to Art Here
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="text-[0.7rem] font-semibold tracking-[0.14em] uppercase text-[#bbb] mb-4">
        Art Here
      </div>
      <h1 className="font-heading text-[clamp(1.8rem,4vw,2.6rem)] font-bold tracking-[-0.02em] leading-[1.15] mb-10">
        {intent.greeting}
      </h1>

      <div className="border border-[#e8e8e8] rounded-xl overflow-hidden mb-8">
        <div className="bg-[#fafafa] border-b border-[#e8e8e8] px-5 py-3 flex flex-col gap-1">
          <div className="flex items-baseline gap-2 text-[0.82rem]">
            <span className="text-[#aaa] w-10 shrink-0">To</span>
            <span className="text-[#555]">hello@artishere.org</span>
          </div>
          <div className="flex items-baseline gap-2 text-[0.82rem]">
            <span className="text-[#aaa] w-10 shrink-0">Re</span>
            <span className="text-[#555] font-medium">{intent.greeting}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div className="text-[0.95rem] text-[#555] font-light leading-[1.8] pb-2 border-b border-[#f0f0f0]">
            {intent.opening}
          </div>

          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-[0.72rem] font-semibold text-[#aaa] mb-1.5 uppercase tracking-widest">Your name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                autoFocus
                placeholder="Jane Smith"
                className={INPUT}
              />
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="block text-[0.72rem] font-semibold text-[#aaa] mb-1.5 uppercase tracking-widest">Your email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className={INPUT}
              />
            </div>
          </div>

          <div>
            <label className="block text-[0.72rem] font-semibold text-[#aaa] mb-1.5 uppercase tracking-widest">
              Website or social media <span className="normal-case font-normal text-[#ccc]">(optional)</span>
            </label>
            <input
              type="text"
              value={social}
              onChange={e => setSocial(e.target.value)}
              placeholder="https://yoursite.com or @yourhandle"
              className={INPUT}
            />
          </div>

          <div>
            <label className="block text-[0.72rem] font-semibold text-[#aaa] mb-1.5 uppercase tracking-widest">
              Anything else you&rsquo;d like to share?{' '}
              <span className="normal-case font-normal text-[#ccc]">(optional)</span>
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
              placeholder="Tell us a bit more about yourself or what you have in mind…"
              className={`${INPUT} resize-none`}
            />
          </div>

          {status === 'error' && (
            <p className="text-[0.85rem] text-[#b91c1c]">
              Something went wrong — please try again or email us at hello@artishere.org
            </p>
          )}

          <button type="submit" disabled={status === 'submitting' || !name || !email} className={BTN}>
            {status === 'submitting' ? 'Sending…' : 'Send'}
          </button>
        </form>
      </div>

      <p className="text-center text-[0.82rem] text-[#bbb]">
        <Link href="/" className="hover:text-[#555] transition-colors no-underline text-[#bbb]">
          ← Back to Art Here
        </Link>
      </p>
    </div>
  );
}
