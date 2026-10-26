'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ARTIST_WAYS,
  SUPPORT_CRITERIA,
  validatePlaceIntake,
  type PlaceIntake,
  type PlaceIntakeErrors,
} from '@/lib/place-intake';

const INPUT =
  'w-full px-4 py-3 rounded-lg border border-transparent text-[0.95rem] text-[#1a1a1a] placeholder-[#c4c4c4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#bdd349] transition-colors bg-white';
const LABEL = 'block text-[0.7rem] font-semibold text-[#aaa] mb-1.5 uppercase tracking-widest';
const OPTIONAL = 'normal-case tracking-normal font-light text-[#aaa]';
const BTN_PRIMARY =
  'px-7 py-3 rounded-full bg-[#bdd349] text-[#1a1a1a] text-[0.95rem] font-medium transition-opacity hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#bdd349] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';
const BTN_GHOST =
  'px-6 py-3 rounded-full border border-[#555] text-white text-[0.95rem] font-medium transition-colors hover:border-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white cursor-pointer';

const EMPTY: PlaceIntake = {
  spaceName: '',
  address: '',
  neighborhood: '',
  website: '',
  contactName: '',
  email: '',
  support: [],
  ways: {},
  howYouSupport: '',
};

/** Which fields each step owns, in on-screen order, so a step only blocks on its own problems. */
const STEP_FIELDS: (keyof PlaceIntake)[][] = [
  ['spaceName', 'address', 'neighborhood'],
  ['support'],
  ['contactName', 'email'],
];

export type IntakeStatus = 'idle' | 'submitting' | 'sent' | 'error';

export function PlacesIntakeForm({ onStatus }: { onStatus?: (s: IntakeStatus) => void }) {
  const [values, setValues] = useState<PlaceIntake>(EMPTY);
  const [errors, setErrors] = useState<PlaceIntakeErrors>({});
  const [step, setStep] = useState(0);
  const [company, setCompany] = useState(''); // hidden anti-bot field
  const [status, setStatus] = useState<IntakeStatus>('idle');
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => onStatus?.(status), [status, onStatus]);

  const set = <K extends keyof PlaceIntake>(key: K, v: PlaceIntake[K]) => {
    setValues(prev => ({ ...prev, [key]: v }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const toggle = (id: string) =>
    set('support', values.support.includes(id) ? values.support.filter(s => s !== id) : [...values.support, id]);

  const toggleWay = (id: string) => {
    const next = { ...values.ways };
    if (id in next) delete next[id];
    else next[id] = '';
    set('ways', next);
  };

  const focusFirst = (found: PlaceIntakeErrors, fields: (keyof PlaceIntake)[]) => {
    const first = fields.find(f => found[f]);
    if (!first) return;
    setTimeout(() => document.getElementById(first === 'support' ? 'support-legend' : `f-${first}`)?.focus(), 0);
  };

  function goTo(next: number) {
    setStep(next);
    setStatus('idle');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const found = validatePlaceIntake(values);

    // Steps one and two only check their own fields and move on.
    if (step < 2) {
      const mine: PlaceIntakeErrors = {};
      for (const f of STEP_FIELDS[step]) if (found[f]) mine[f] = found[f];
      setErrors(mine);
      if (Object.keys(mine).length > 0) return focusFirst(mine, STEP_FIELDS[step]);
      return goTo(step + 1);
    }

    setErrors(found);
    if (Object.keys(found).length > 0) {
      // Send them back to the earliest step with a problem.
      const badStep = STEP_FIELDS.findIndex(fields => fields.some(f => found[f]));
      if (badStep !== step) setStep(badStep);
      return focusFirst(found, STEP_FIELDS[badStep]);
    }

    setStatus('submitting');
    try {
      const res = await fetch('/api/join/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, company }),
      });
      if (res.status === 400) {
        const data = await res.json().catch(() => null);
        if (data?.errors) setErrors(data.errors);
        throw new Error('invalid');
      }
      if (!res.ok) throw new Error('failed');
      setStatus('sent');
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
          You are on the map
        </h2>
        <p className="text-[0.95rem] text-[#bbb] font-light leading-[1.7] mb-6">
          Thank you. We review every submission and confirm eligibility before sending your setup link. Watch your
          inbox at {values.email.trim()}.
        </p>
        <Link href="/" className={`${BTN_PRIMARY} inline-block no-underline`}>
          Back to Art Here →
        </Link>
      </div>
    );
  }

  const err = (key: keyof PlaceIntake) =>
    errors[key] ? (
      <p id={`e-${key}`} className="mt-1.5 text-[0.85rem] text-[#ff8a8a]">
        {errors[key]}
      </p>
    ) : null;
  const aria = (key: keyof PlaceIntake) => ({
    'aria-invalid': errors[key] ? true : undefined,
    'aria-describedby': errors[key] ? `e-${key}` : undefined,
  });

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {/* Honeypot: invisible to people, filled by bots. The server drops any submission with a value. */}
      <input
        type="text"
        name="company"
        value={company}
        onChange={e => setCompany(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />

      {/* Step dots: done = green, current = chartreuse */}
      <ol className="flex items-center gap-2 list-none p-0 m-0 mb-1" aria-label={`Step ${step + 1} of 3`}>
        {[0, 1, 2].map(i => (
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
            {i < 2 && <span aria-hidden="true" className="block h-px w-8 bg-[#444]" />}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <>
          <div>
            <label htmlFor="f-spaceName" className={LABEL}>Name of your place, organization, or business</label>
            <input id="f-spaceName" value={values.spaceName} onChange={e => set('spaceName', e.target.value)} required autoComplete="organization" placeholder="The Local Arts Place" className={INPUT} {...aria('spaceName')} />
            {err('spaceName')}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="f-address" className={LABEL}>Address</label>
              <input id="f-address" value={values.address} onChange={e => set('address', e.target.value)} required autoComplete="street-address" placeholder="123 Artists' Way" className={INPUT} {...aria('address')} />
              {err('address')}
            </div>
            <div>
              <label htmlFor="f-neighborhood" className={LABEL}>Neighborhood</label>
              <input id="f-neighborhood" value={values.neighborhood} onChange={e => set('neighborhood', e.target.value)} required placeholder="Alberta Arts District" className={INPUT} {...aria('neighborhood')} />
              {err('neighborhood')}
            </div>
          </div>
          <div>
            <label htmlFor="f-website" className={LABEL}>
              Website <span className={OPTIONAL}>(optional)</span>
            </label>
            <input id="f-website" value={values.website} onChange={e => set('website', e.target.value)} autoComplete="url" placeholder="https://thelocalartsplace.com" className={INPUT} {...aria('website')} />
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <fieldset className="border-0 p-0 m-0 min-w-0" aria-describedby={errors.support ? 'e-support' : undefined}>
            <legend id="support-legend" tabIndex={-1} className={`${LABEL} px-0 focus:outline-none`}>
              How do you support local artists?
            </legend>
            <div className="flex flex-col gap-2.5">
              {SUPPORT_CRITERIA.map(c => (
                <label key={c.id} className="flex items-start gap-3 cursor-pointer rounded-lg border border-[#333] bg-[#1a1a1a] p-3 has-[:checked]:border-[#bdd349] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#bdd349]">
                  <input
                    type="checkbox"
                    checked={values.support.includes(c.id)}
                    onChange={() => toggle(c.id)}
                    className="mt-1 h-4 w-4 shrink-0 accent-[#bdd349]"
                  />
                  <span className="text-[0.9rem] text-[#eee] leading-[1.5]">{c.title}</span>
                </label>
              ))}
            </div>
            {err('support')}
          </fieldset>
          <fieldset className="border-0 p-0 m-0 min-w-0">
            <legend className={`${LABEL} px-0`}>
              How do you work with artists? <span className={OPTIONAL}>(optional)</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {ARTIST_WAYS.map(w => (
                <label
                  key={w.id}
                  className="cursor-pointer rounded-full border border-[#333] bg-[#1a1a1a] px-3.5 py-1.5 text-[0.85rem] text-[#eee] has-[:checked]:border-[#bdd349] has-[:checked]:bg-[#bdd349] has-[:checked]:text-[#1a1a1a] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#bdd349]"
                >
                  <input
                    type="checkbox"
                    checked={w.id in values.ways}
                    onChange={() => toggleWay(w.id)}
                    className="sr-only"
                  />
                  {w.label}
                </label>
              ))}
            </div>
            {ARTIST_WAYS.filter(w => w.id in values.ways).map(w => (
              <div key={w.id} className="mt-3">
                <label htmlFor={`f-way-${w.id}`} className="block text-[0.8rem] text-[#bbb] mb-1">
                  {w.prompt} <span className={OPTIONAL}>(names, optional)</span>
                </label>
                <input
                  id={`f-way-${w.id}`}
                  value={values.ways[w.id]}
                  onChange={e => set('ways', { ...values.ways, [w.id]: e.target.value })}
                  placeholder="Jane Doe, Sam Lee"
                  className={INPUT}
                />
              </div>
            ))}
          </fieldset>
          <div>
            <label htmlFor="f-howYouSupport" className={LABEL}>
              Tell us more <span className={OPTIONAL}>(optional)</span>
            </label>
            <textarea
              id="f-howYouSupport"
              value={values.howYouSupport}
              onChange={e => set('howYouSupport', e.target.value)}
              rows={3}
              placeholder="We host a rotating monthly show of local painters, pay artists to teach weekend workshops, and give every artist 10% off studio time."
              className={`${INPUT} resize-y`}
            />
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="f-contactName" className={LABEL}>Your first and last name</label>
              <input id="f-contactName" value={values.contactName} onChange={e => set('contactName', e.target.value)} required autoComplete="name" placeholder="Alex Rivera" className={INPUT} {...aria('contactName')} />
              {err('contactName')}
            </div>
            <div>
              <label htmlFor="f-email" className={LABEL}>Your email address</label>
              <input id="f-email" type="email" value={values.email} onChange={e => set('email', e.target.value)} required autoComplete="email" placeholder="alex@thelocalartsplace.com" className={INPUT} {...aria('email')} />
              {err('email')}
            </div>
          </div>
          <p className="text-[0.85rem] text-[#bbb] font-light leading-[1.6] m-0">
            We review every submission and confirm eligibility before sending your setup link.
          </p>
        </>
      )}

      {status === 'error' && (
        <p role="alert" className="text-[0.9rem] text-[#ff8a8a] m-0">
          Something went wrong. Please check the form and try again, or email us at hello@artishere.org.
        </p>
      )}

      <div className="flex gap-3 mt-1">
        {step > 0 && (
          <button type="button" onClick={() => goTo(step - 1)} className={BTN_GHOST}>
            Back
          </button>
        )}
        <button type="submit" disabled={status === 'submitting'} className={BTN_PRIMARY}>
          {step < 2 ? 'Next' : status === 'submitting' ? 'Sending…' : 'Join us →'}
        </button>
      </div>
    </form>
  );
}
