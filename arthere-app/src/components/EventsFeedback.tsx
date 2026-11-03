'use client';

import { useState } from 'react';

type Answer = 'yes' | 'no' | 'unsure';

const OPTIONS: { id: Answer; label: string }[] = [
  { id: 'yes', label: 'Yes' },
  { id: 'no', label: 'No' },
  { id: 'unsure', label: "I'm not sure" },
];

/** Quick "want more events here?" poll for the black band on the events page. */
export function EventsFeedback({ citySlug }: { citySlug: string }) {
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [comment, setComment] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!answer) return;
    setStatus('sending');
    setError('');
    try {
      const res = await fetch('/api/events/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer, comment, email, company, city: citySlug }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Something went wrong.');
      }
      setStatus('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setStatus('idle');
    }
  }

  if (status === 'done') {
    return <p className="text-[0.9rem] font-light text-white/80">Thank you — that helps us decide what to build next.</p>;
  }

  const field =
    'w-full bg-white/10 border border-white/25 rounded-md px-3 py-2 text-[0.9rem] text-white placeholder:text-white/40 focus:outline-none focus:border-white/70';

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 max-w-[560px]">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="text-[0.9rem] font-light text-white/80">Would you like to see more events here?</span>
        <div className="flex gap-2">
          {OPTIONS.map(o => (
            <button
              key={o.id}
              type="button"
              onClick={() => setAnswer(o.id)}
              aria-pressed={answer === o.id}
              className={`text-[0.82rem] px-3 py-1 rounded-full border transition-colors ${
                answer === o.id
                  ? 'bg-white text-[#1a1a1a] border-white'
                  : 'border-white/40 text-white/80 hover:border-white hover:text-white'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {answer && (
        <>
          <label className="flex flex-col gap-1.5">
            <span className="text-[0.85rem] font-light text-white/80">
              Tell us more! Why would you like or not like to see events here? What kinds of events would you hope to see?
            </span>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
              maxLength={3000}
              className={field}
            />
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email (optional, if you'd like a reply)"
            autoComplete="email"
            className={field}
          />
          {/* Honeypot — hidden from people, bots fill it */}
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={company}
            onChange={e => setCompany(e.target.value)}
            className="hidden"
          />
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={status === 'sending'}
              className="text-[0.85rem] px-4 py-1.5 rounded-full bg-white text-[#1a1a1a] hover:bg-white/85 transition-colors disabled:opacity-60"
            >
              {status === 'sending' ? 'Sending…' : 'Send'}
            </button>
            {error && <span className="text-[0.82rem] text-[#f96a9b]">{error}</span>}
          </div>
        </>
      )}
    </form>
  );
}
