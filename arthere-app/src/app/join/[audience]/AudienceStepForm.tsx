'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { isValidEmail } from '@/lib/email';
import type { JoinAudience, JoinField } from '@/lib/join-audiences';

const INPUT =
  'w-full px-4 py-3 rounded-lg border border-transparent text-[0.95rem] text-[#1a1a1a] placeholder-[#c4c4c4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#bdd349] transition-colors bg-white';
const LABEL = 'block text-[0.7rem] font-semibold text-[#aaa] mb-1.5 uppercase tracking-widest';
const OPTIONAL = 'normal-case tracking-normal font-light text-[#aaa]';
const BTN_PRIMARY =
  'px-7 py-3 rounded-full bg-[#bdd349] text-[#1a1a1a] text-[0.95rem] font-medium transition-opacity hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#bdd349] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';
const BTN_GHOST =
  'px-6 py-3 rounded-full border border-[#555] text-white text-[0.95rem] font-medium transition-colors hover:border-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white cursor-pointer';

/** Which fields each step owns. The last step also carries the free-text message. */
const STEPS: Record<string, string[][]> = {
  artists: [['name', 'email'], ['medium', 'neighborhood', 'social'], ['affiliations']],
  organizations: [['name', 'email'], ['organization', 'kind', 'social'], []],
  cities: [['name', 'email'], ['where', 'group', 'social'], []],
};

type Status = 'idle' | 'submitting' | 'sent' | 'error';

/** Stepped, dark version of the join form, driven by the audience's field config. Posts to /api/contact. */
export function AudienceStepForm({ audience, onSent }: { audience: JoinAudience; onSent: () => void }) {
  const steps = STEPS[audience.slug];
  const last = steps.length - 1;
  const [values, setValues] = useState<Record<string, string>>({});
  const [services, setServices] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);
  const [honeypot, setHoneypot] = useState(''); // hidden anti-bot field
  const [status, setStatus] = useState<Status>('idle');
  const headingRef = useRef<HTMLHeadingElement>(null);

  const set = (id: string, v: string) => {
    setValues(prev => ({ ...prev, [id]: v }));
    if (errors[id]) setErrors(prev => ({ ...prev, [id]: '' }));
  };

  const check = (f: JoinField): string => {
    const v = values[f.id]?.trim() ?? '';
    if (f.maps === 'name' && v.split(/\s+/).filter(Boolean).length < 2) return 'Enter your first and last name.';
    if (f.type === 'email') return !v ? 'Enter your email address.' : isValidEmail(v) ? '' : 'Enter a valid email address.';
    if (f.required && !v) return 'This is required.';
    if (audience.slug === 'artists' && f.id === 'neighborhood' && !/^\d{5}(-\d{4})?$/.test(v)) return 'Enter a 5-digit zipcode.';
    return '';
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const mine: Record<string, string> = {};
    for (const id of steps[step]) {
      const f = audience.fields.find(x => x.id === id);
      const msg = f ? check(f) : '';
      if (msg) mine[id] = msg;
    }
    setErrors(mine);
    const bad = Object.keys(mine)[0];
    if (bad) {
      setTimeout(() => document.getElementById(bad)?.focus(), 0);
      return;
    }
    if (step < last) {
      setStep(step + 1);
      setStatus('idle');
      return;
    }

    setStatus('submitting');
    // Fields with a home in /api/contact go there; the rest become labelled lines at the top of the message.
    const mapped: Record<string, string> = {};
    const lines: string[] = [];
    for (const f of audience.fields) {
      const v = values[f.id]?.trim();
      if (!v) continue;
      if (f.maps) mapped[f.maps] = v;
      else lines.push(`${f.label}: ${v}`);
    }
    if (services.length) lines.push(`${audience.services?.label ?? 'Services'} ${services.join(', ')}`);
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
      onSent();
      setTimeout(() => headingRef.current?.focus(), 0);
    } catch {
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div role="status">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="font-display text-[2.2rem] leading-none tracking-[0.03em] uppercase mb-3 focus:outline-none"
        >
          We got your message!
        </h2>
        <p className="text-[0.95rem] text-[#bbb] font-light leading-[1.7] mb-6">{audience.sent}</p>
        <Link href="/" className={`${BTN_PRIMARY} inline-block no-underline`}>
          Back to Art Here →
        </Link>
      </div>
    );
  }

  const renderField = (f: JoinField) => (
    <div key={f.id}>
      <label htmlFor={f.id} className={LABEL}>
        {f.label} {!f.required && <span className={OPTIONAL}>(optional)</span>}
      </label>
      {f.type === 'select' ? (
        <select id={f.id} value={values[f.id] ?? ''} onChange={e => set(f.id, e.target.value)} className={INPUT}>
          <option value="">Choose one…</option>
          {f.options?.map(o => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      ) : f.type === 'textarea' ? (
        <textarea id={f.id} value={values[f.id] ?? ''} onChange={e => set(f.id, e.target.value)} rows={2} placeholder={f.placeholder} className={`${INPUT} resize-none`} />
      ) : (
        <input
          id={f.id}
          type={f.type}
          value={values[f.id] ?? ''}
          onChange={e => set(f.id, e.target.value)}
          placeholder={f.placeholder}
          autoComplete={f.maps === 'name' ? 'name' : f.maps === 'email' ? 'email' : undefined}
          className={INPUT}
          aria-invalid={errors[f.id] ? true : undefined}
          aria-describedby={errors[f.id] ? `e-${f.id}` : undefined}
        />
      )}
      {errors[f.id] && (
        <p id={`e-${f.id}`} className="mt-1.5 text-[0.85rem] text-[#ff8a8a]">{errors[f.id]}</p>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
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

      <ol className="flex items-center gap-2 list-none p-0 m-0 mb-1" aria-label={`Step ${step + 1} of ${steps.length}`}>
        {steps.map((_, i) => (
          <li key={i} className="flex items-center gap-2">
            <span
              aria-current={i === step ? 'step' : undefined}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-full border font-display text-[1.15rem] leading-none ${
                i < step
                  ? 'bg-[#07b26b] border-[#07b26b] text-white'
                  : i === step
                    ? 'bg-[#bdd349] border-[#bdd349] text-[#1a1a1a]'
                    : 'bg-[#1a1a1a] border-[#333] text-[#888]'
              }`}
            >
              {i + 1}
            </span>
            {i < steps.length - 1 && <span aria-hidden="true" className="block h-px w-8 bg-[#444]" />}
          </li>
        ))}
      </ol>

      {steps[step].map(id => audience.fields.find(f => f.id === id)).filter((f): f is JoinField => !!f).map(renderField)}

      {step === last && audience.services && (
        <fieldset className="border-0 p-0 m-0 min-w-0">
          <legend className={`${LABEL} px-0`}>
            {audience.services.label} <span className={OPTIONAL}>(optional)</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {audience.services.options.map(o => (
              <label
                key={o}
                className="cursor-pointer rounded-full border border-[#333] bg-[#1a1a1a] px-3.5 py-1.5 text-[0.85rem] text-[#eee] has-[:checked]:border-[#bdd349] has-[:checked]:bg-[#bdd349] has-[:checked]:text-[#1a1a1a] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#bdd349]"
              >
                <input
                  type="checkbox"
                  checked={services.includes(o)}
                  onChange={() => setServices(prev => (prev.includes(o) ? prev.filter(x => x !== o) : [...prev, o]))}
                  className="sr-only"
                />
                {o}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {step === last && (
        <div>
          <label htmlFor="message" className={LABEL}>
            {audience.messageLabel} <span className={OPTIONAL}>(optional)</span>
          </label>
          <textarea
            id="message"
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={4}
            placeholder={audience.messagePlaceholder}
            className={`${INPUT} resize-y`}
          />
        </div>
      )}

      {status === 'error' && (
        <p role="alert" className="text-[0.9rem] text-[#ff8a8a] m-0">
          Something went wrong. Please try again or email us at hello@artishere.org.
        </p>
      )}

      <div className="flex gap-3 mt-1">
        {step > 0 && (
          <button type="button" onClick={() => setStep(step - 1)} className={BTN_GHOST}>
            Back
          </button>
        )}
        <button type="submit" disabled={status === 'submitting'} className={BTN_PRIMARY}>
          {step < last ? 'Next' : status === 'submitting' ? 'Sending…' : audience.submitLabel}
        </button>
      </div>
    </form>
  );
}
