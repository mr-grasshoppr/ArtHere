'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { JoinAudience } from '@/lib/join-audiences';

const INPUT = 'w-full px-4 py-3 rounded-lg border border-[#e5e5e5] text-[0.95rem] text-[#1a1a1a] placeholder-[#bbb] focus:outline-none focus:border-[#1a1a1a] transition-colors bg-white';
const LABEL = 'block text-[0.72rem] font-semibold text-[#aaa] mb-1.5 uppercase tracking-widest';
const BTN = 'w-full px-6 py-3.5 rounded-full bg-[#1a1a1a] text-white text-[0.95rem] font-medium transition-opacity hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer';

export function JoinForm({ audience }: { audience: JoinAudience }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState(''); // hidden anti-bot field
  const [status, setStatus] = useState<'idle' | 'submitting' | 'sent' | 'error'>('idle');

  const set = (id: string, v: string) => setValues(prev => ({ ...prev, [id]: v }));
  const missingRequired = audience.fields.some(f => f.required && !values[f.id]?.trim());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');

    // Fields with a home in /api/contact go there; the rest become labelled
    // lines at the top of the message so nothing is lost in the inbox.
    const mapped: Record<string, string> = {};
    const lines: string[] = [];
    for (const f of audience.fields) {
      const v = values[f.id]?.trim();
      if (!v) continue;
      if (f.maps) mapped[f.maps] = v;
      else lines.push(`${f.label}: ${v}`);
    }
    if (message.trim()) lines.push('', message.trim());

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: mapped.name ?? '',
          email: mapped.email ?? '',
          social: mapped.social,
          affiliations: mapped.affiliations,
          message: lines.join('\n'),
          intent: audience.intent,
          website: honeypot,
        }),
      });
      if (!res.ok) throw new Error();
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div className="border border-[#e8e8e8] rounded-xl p-8 text-center self-start">
        <h2 className="font-heading text-[1.6rem] font-bold tracking-[-0.02em] mb-3">We got your message!</h2>
        <p className="text-[1rem] text-[#555] font-light leading-[1.8] mb-6">{audience.sent}</p>
        <Link href="/" className="text-[0.9rem] text-[#1a1a1a] underline underline-offset-[3px] hover:opacity-60 transition-opacity">
          ← Back to Art Here
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border border-[#e8e8e8] rounded-xl p-5 sm:p-6 flex flex-col gap-4 self-start">
      {/* Honeypot: invisible to humans, filled by bots. Server drops any submission with a value. */}
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

      {audience.fields.map(f => (
        <div key={f.id}>
          <label htmlFor={f.id} className={LABEL}>
            {f.label}
            {!f.required && <span className="normal-case font-normal text-[#ccc]"> (optional)</span>}
          </label>
          {f.hint && <p className="text-[0.78rem] text-[#bbb] font-light mb-2">{f.hint}</p>}
          {f.type === 'select' ? (
            <select id={f.id} value={values[f.id] ?? ''} onChange={e => set(f.id, e.target.value)} className={INPUT}>
              <option value="">Choose one…</option>
              {f.options?.map(o => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          ) : f.type === 'textarea' ? (
            <textarea
              id={f.id}
              value={values[f.id] ?? ''}
              onChange={e => set(f.id, e.target.value)}
              rows={2}
              placeholder={f.placeholder}
              className={`${INPUT} resize-none`}
            />
          ) : (
            <input
              id={f.id}
              type={f.type}
              value={values[f.id] ?? ''}
              onChange={e => set(f.id, e.target.value)}
              required={f.required}
              placeholder={f.placeholder}
              className={INPUT}
            />
          )}
        </div>
      ))}

      <div className="border-t border-[#f0f0f0] pt-4">
        <label htmlFor="message" className={LABEL}>{audience.messageLabel}</label>
        <p className="text-[0.78rem] text-[#bbb] font-light mb-2">{audience.messageHint}</p>
        <textarea
          id="message"
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={4}
          placeholder={audience.messagePlaceholder}
          className={`${INPUT} resize-none`}
        />
      </div>

      {status === 'error' && (
        <p className="text-[0.85rem] text-[#b91c1c]">
          Something went wrong. Please try again or email us at hello@artishere.org
        </p>
      )}

      <button type="submit" disabled={status === 'submitting' || missingRequired} className={BTN}>
        {status === 'submitting' ? 'Sending…' : audience.submitLabel}
      </button>
    </form>
  );
}
