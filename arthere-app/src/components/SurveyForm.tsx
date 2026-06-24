'use client';

import { useState } from 'react';

// ─── Answer shape ───────────────────────────────────────────────────────────

interface Answers {
  portlandFamiliarity: string;
  portlandWords: [string, string, string];
  portlandHelpers: string;
  portlandWish: string;

  artistStatus: string;
  artistStatusOther: string;

  zipCode: string;
  neighborhoods: string;

  mvFamiliarity: string;
  mvWords: [string, string, string];
  mvConnectionLevel: string;
  mvHelpers: string;
  mvSupport: string;

  multnomahDaysInvolvement: string[];

  practiceActivities: string[];
  practiceGoals: string[];
  practiceGoalsOther: string;
  practiceSupport: string;

  featuredArtistInterest: string;

  stayConnected: string[];
  raffleOptIn: string;
  email: string;
  learnedAbout: string[];
  learnedAboutOther: string;
}

const initialAnswers: Answers = {
  portlandFamiliarity: '',
  portlandWords: ['', '', ''],
  portlandHelpers: '',
  portlandWish: '',
  artistStatus: '',
  artistStatusOther: '',
  zipCode: '',
  neighborhoods: '',
  mvFamiliarity: '',
  mvWords: ['', '', ''],
  mvConnectionLevel: '',
  mvHelpers: '',
  mvSupport: '',
  multnomahDaysInvolvement: [],
  practiceActivities: [],
  practiceGoals: [],
  practiceGoalsOther: '',
  practiceSupport: '',
  featuredArtistInterest: '',
  stayConnected: [],
  raffleOptIn: '',
  email: '',
  learnedAbout: [],
  learnedAboutOther: '',
};

// ─── Option lists ────────────────────────────────────────────────────────────
// Branching decisions are keyed off these exact strings, so they're pulled
// out as constants rather than re-typed inline.

const NOT_FAMILIAR_WITH_PORTLAND = 'Not at all — not involved in the arts';
const PORTLAND_FAMILIARITY_OPTIONS = [
  'Extremely — the arts are central to my work and life',
  `Very — involved in Portland's arts community`,
  'Somewhat — engaged from time to time',
  'A little — aware but not plugged in',
  NOT_FAMILIAR_WITH_PORTLAND,
];

const NOT_PRACTICING_ARTIST = `No, I'm not a practicing artist`;
const OTHER = 'Other';
const ARTIST_STATUS_OPTIONS = [
  'Yes, it is my primary career',
  'Yes, I have an active practice alongside other work',
  `I'm just getting started`,
  'I make artwork as a hobby or for fun',
  NOT_PRACTICING_ARTIST,
  OTHER,
];

const MV_CONNECTION_OPTIONS = [
  'Very connected',
  'Somewhat connected',
  'A little connected',
  'Not at all connected',
];

const NOT_FAMILIAR_WITH_MV = `Not at all — I'm not familiar with Multnomah Village`;
const MV_FAMILIARITY_OPTIONS = [
  'Extremely — I live or work in Multnomah Village',
  'Very — I visit Multnomah Village regularly',
  `Somewhat — I've been to Multnomah Village a few times`,
  `A little — I've heard of Multnomah Village but don't know it well`,
  NOT_FAMILIAR_WITH_MV,
];

const NOT_INTERESTED_MULTNOMAH_DAYS = `I'm not interested`;
const MULTNOMAH_DAYS_OPTIONS = [
  'Join the parade to celebrate local artists' work',
  'Help set up or take down our booth',
  `I can't volunteer but I'd love to attend`,
  'Spread the word about Art Here',
  NOT_INTERESTED_MULTNOMAH_DAYS,
];

const NONE_OF_THE_ABOVE = 'None of the above';
const PRACTICE_ACTIVITY_OPTIONS = [
  'Sold original artwork',
  'Taken commissions for my artwork',
  'Exhibited or shown my artwork publicly',
  'Performed or presented my work publicly',
  'Applied for an artist grant or residency',
  'Received an artist grant or residency',
  'Collaborated with other artists or organizations on an art project',
  'Taken a class or workshop to support my art practice',
  NONE_OF_THE_ABOVE,
];

const PRACTICE_GOAL_OPTIONS = [
  'Sell more work or find commissions',
  'Share my artwork with more people',
  'Connect with other local artists',
  'Show my artwork in galleries, shows, or public spaces',
  'Find studio space or places to make my work',
  'Apply for grants or residencies',
  'Find classes or training to develop my skills',
  'Attend more community gatherings or events',
  OTHER,
];

const FEATURED_ARTIST_OPTIONS = [
  'Yes, online through the Art Here platform',
  'Yes, in person at local events and celebrations',
  'Yes, both online and in person',
  `I'd like more information before deciding`,
  'Not at this time',
];

const EXPAND_TO_MY_AREA = 'Get involved when Art Here expands to my area';
const NONE_AT_THIS_TIME = 'None at this time';
const STAY_CONNECTED_OPTIONS = [
  'Keep me posted on Art Here news',
  EXPAND_TO_MY_AREA,
  'Volunteer',
  'Partner or collaborate',
  NONE_AT_THIS_TIME,
];

const RAFFLE_YES = 'Yes';
const RAFFLE_OPTIONS = [RAFFLE_YES, 'No'];

const LEARNED_ABOUT_OTHER = 'Other';
const LEARNED_ABOUT_OPTIONS = [
  'Multnomah Arts Center',
  'A business in Multnomah Village',
  'Local art gallery',
  'Word of mouth',
  'Art Here website',
  LEARNED_ABOUT_OTHER,
];

// ─── Option order randomization ─────────────────────────────────────────────
// For "select all that apply" questions where the options are a plain list
// (not a scale from "most" to "least"), we shuffle the order shown to each
// visitor so no option gets an unfair edge just from being listed first.
// "Other" / "None of the above" / "I'm not interested" style options stay
// pinned at the bottom, where people expect to find them.

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Shuffles `options`, keeping any entries listed in `pinned` fixed at the
 * end (in their original order). */
function shuffleOptions(options: string[], pinned: string[] = []): string[] {
  const movable = options.filter(o => !pinned.includes(o));
  const fixed = options.filter(o => pinned.includes(o));
  return [...shuffle(movable), ...fixed];
}

// ─── Step machine ────────────────────────────────────────────────────────────
// Each step is one screen of the survey. `getNextStep` encodes the
// conditional skips described in the source doc:
//   - Q1 "not familiar with the arts in Portland" -> skip straight to
//     About You (skipping the Portland detail questions).
//   - Q5 "practicing artist" -> go straight into "About Your Practice"
//     (split across two pages) and "Become a Featured Artist" before
//     moving on to location/Multnomah Village questions. Non-artists skip
//     all of that and go straight to Location.
//   - Q8 "not familiar with Multnomah Village" -> skip Q9-10.
//   - Multnomah Days 2026 only shows to people who have some connection to
//     Multnomah Village — skipped for anyone who said "I'm not familiar
//     with Multnomah Village" (Q8).
//   - Email is the very last question, and is optional.

type StepId =
  | 'portland-familiarity'
  | 'portland-detail'
  | 'about-you'
  | 'practice'
  | 'practice-goals'
  | 'featured-artist'
  | 'location'
  | 'mv-familiarity'
  | 'mv-detail'
  | 'stay-connected'
  | 'multnomah-days'
  | 'email'
  | 'learned-about'
  | 'done';

function isPracticingArtist(a: Answers) {
  return a.artistStatus !== NOT_PRACTICING_ARTIST;
}

function getNextStep(step: StepId, a: Answers): StepId {
  switch (step) {
    case 'portland-familiarity':
      return a.portlandFamiliarity === NOT_FAMILIAR_WITH_PORTLAND ? 'about-you' : 'portland-detail';
    case 'portland-detail':
      return 'about-you';
    case 'about-you':
      return isPracticingArtist(a) ? 'practice' : 'location';
    case 'practice':
      return 'practice-goals';
    case 'practice-goals':
      return 'featured-artist';
    case 'featured-artist':
      return 'location';
    case 'location':
      return 'mv-familiarity';
    case 'mv-familiarity':
      return a.mvFamiliarity === NOT_FAMILIAR_WITH_MV ? 'stay-connected' : 'mv-detail';
    case 'mv-detail':
      return 'stay-connected';
    case 'stay-connected':
      return a.mvFamiliarity !== NOT_FAMILIAR_WITH_MV ? 'multnomah-days' : 'email';
    case 'multnomah-days':
      return 'email';
    case 'email':
      return 'learned-about';
    case 'learned-about':
    case 'done':
      return 'done';
  }
}

/** Walks the step machine forward from the current answers to estimate the
 * full path length, for the progress bar. */
function getFullPath(a: Answers): StepId[] {
  const path: StepId[] = ['portland-familiarity'];
  let current: StepId = 'portland-familiarity';
  while (current !== 'done') {
    current = getNextStep(current, a);
    path.push(current);
  }
  return path;
}

// ─── Shared styles ───────────────────────────────────────────────────────────

const OPTION_BASE =
  'w-full text-left px-4 sm:px-5 py-3.5 rounded-lg border text-[0.95rem] font-light transition-colors flex items-center gap-3 cursor-pointer';
const OPTION_INACTIVE = 'border-[#e5e5e5] text-[#444] hover:border-[#bbb] hover:bg-[#fafafa]';
const OPTION_ACTIVE = 'border-[#1a1a1a] bg-[#1a1a1a] text-white';

const INPUT_CLASS =
  'w-full px-4 py-3 rounded-lg border border-[#e5e5e5] text-[0.95rem] text-[#1a1a1a] placeholder-[#bbb] focus:outline-none focus:border-[#1a1a1a] transition-colors';
const TEXTAREA_CLASS = `${INPUT_CLASS} min-h-[96px] resize-y leading-[1.6]`;
const BLANK_CLASS =
  'w-[120px] px-1 py-1 border-0 border-b border-[#ccc] text-center text-[#1a1a1a] bg-transparent focus:outline-none focus:border-[#1a1a1a] transition-colors placeholder-[#ddd]';

const BUTTON_PRIMARY =
  'px-6 py-3 rounded-full bg-[#1a1a1a] text-white text-[0.9rem] font-medium transition-opacity hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer';
const BUTTON_SECONDARY =
  'px-5 py-3 rounded-full text-[#888] text-[0.9rem] font-medium transition-colors hover:text-[#1a1a1a] cursor-pointer';

// ─── Small building blocks ──────────────────────────────────────────────────

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div className="text-[0.7rem] font-semibold tracking-[0.14em] uppercase text-[#bbb] mb-3">{children}</div>;
}

// A callout box for context that's important to actually read (not just a
// muted caption) — used ahead of the Multnomah Days, Featured Artist, and
// Stay in Touch questions.
function Intro({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-8 px-5 py-4 rounded-lg bg-[#fafafa] border border-[#ececec]">
      <p className="text-[0.98rem] text-[#333] font-normal leading-[1.7] max-w-[520px]">{children}</p>
    </div>
  );
}

function Question({ text, hint, children }: { text: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-heading text-[1.05rem] sm:text-[1.15rem] font-bold text-[#1a1a1a] leading-snug mb-1">
        {text}
      </div>
      {hint && <p className="text-[0.82rem] text-[#999] font-light mb-3">{hint}</p>}
      {!hint && <div className="mb-3" />}
      {children}
    </div>
  );
}

function Indicator({ selected, shape }: { selected: boolean; shape: 'round' | 'square' }) {
  return (
    <span
      className={`flex-shrink-0 w-[18px] h-[18px] border flex items-center justify-center transition-colors ${
        shape === 'round' ? 'rounded-full' : 'rounded-[4px]'
      } ${selected ? 'bg-white border-white' : 'border-[#ccc]'}`}
    >
      {selected && (
        <span className={`bg-[#1a1a1a] ${shape === 'round' ? 'w-2 h-2 rounded-full' : 'w-2.5 h-2.5 rounded-[2px]'}`} />
      )}
    </span>
  );
}

function SingleSelect({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-2">
      {options.map(opt => {
        const selected = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`${OPTION_BASE} ${selected ? OPTION_ACTIVE : OPTION_INACTIVE}`}
          >
            <Indicator selected={selected} shape="round" />
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function MultiSelect({
  options,
  value,
  onChange,
  exclusive,
  max,
}: {
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
  exclusive?: string[];
  max?: number;
}) {
  function toggle(opt: string) {
    if (exclusive?.includes(opt)) {
      onChange(value.includes(opt) ? [] : [opt]);
      return;
    }
    const withoutExclusive = exclusive ? value.filter(v => !exclusive.includes(v)) : value;
    if (withoutExclusive.includes(opt)) {
      onChange(withoutExclusive.filter(v => v !== opt));
    } else {
      if (max && withoutExclusive.length >= max) return;
      onChange([...withoutExclusive, opt]);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {options.map(opt => {
        const selected = value.includes(opt);
        const atMax = !!max && !selected && value.filter(v => !exclusive?.includes(v)).length >= max;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            disabled={atMax}
            className={`${OPTION_BASE} ${selected ? OPTION_ACTIVE : OPTION_INACTIVE} ${atMax ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <Indicator selected={selected} shape="square" />
            {opt}
          </button>
        );
      })}
      {max && <p className="text-[0.78rem] text-[#aaa] font-light mt-1">Select up to {max}.</p>}
    </div>
  );
}

function ThreeWordBlanks({
  lead,
  value,
  onChange,
}: {
  lead: string;
  value: [string, string, string];
  onChange: (v: [string, string, string]) => void;
}) {
  function set(i: number, v: string) {
    const next = [...value] as [string, string, string];
    next[i] = v;
    onChange(next);
  }
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-3 text-[1.05rem] text-[#444] font-light leading-[1.8]">
      <span>{lead}</span>
      <input value={value[0]} onChange={e => set(0, e.target.value)} className={BLANK_CLASS} placeholder="word" />
      <span>,</span>
      <input value={value[1]} onChange={e => set(1, e.target.value)} className={BLANK_CLASS} placeholder="word" />
      <span>, and</span>
      <input value={value[2]} onChange={e => set(2, e.target.value)} className={BLANK_CLASS} placeholder="word" />
      <span>.</span>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-[3px] w-full bg-[#f0f0f0] rounded-full overflow-hidden mb-10">
      <div className="h-full bg-[#1a1a1a] transition-all duration-300 ease-out" style={{ width: `${value}%` }} />
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

/**
 * Multi-step "Portland Community Survey" form. Branches based on a few key
 * answers (see `getNextStep`) and posts the final result to /api/survey.
 */
export function SurveyForm({ onSubmitted }: { onSubmitted?: () => void }) {
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [history, setHistory] = useState<StepId[]>(['portland-familiarity']);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);

  const step = history[history.length - 1];

  // Shuffled once per visit (not on every render, so the order doesn't jump
  // around as people answer).
  const [multnomahDaysOptions] = useState(() => shuffleOptions(MULTNOMAH_DAYS_OPTIONS, [NOT_INTERESTED_MULTNOMAH_DAYS]));
  const [practiceActivityOptions] = useState(() => shuffleOptions(PRACTICE_ACTIVITY_OPTIONS, [NONE_OF_THE_ABOVE]));
  const [practiceGoalOptions] = useState(() => shuffleOptions(PRACTICE_GOAL_OPTIONS, [OTHER]));
  const [stayConnectedOptions] = useState(() => shuffleOptions(STAY_CONNECTED_OPTIONS, [NONE_AT_THIS_TIME]));
  const [learnedAboutOptions] = useState(() => shuffleOptions(LEARNED_ABOUT_OPTIONS, [LEARNED_ABOUT_OTHER]));

  function update<K extends keyof Answers>(key: K, value: Answers[K]) {
    setAnswers(a => ({ ...a, [key]: value }));
  }

  async function saveDraft(currentAnswers: Answers) {
    const payload = {
      ...currentAnswers,
      portlandWords: currentAnswers.portlandWords.filter(w => w.trim() !== ''),
      mvWords: currentAnswers.mvWords.filter(w => w.trim() !== ''),
      learnedAboutOther: undefined,
    };
    if (draftId) {
      fetch(`/api/survey?id=${draftId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      const res = await fetch('/api/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setDraftId(data.id);
      }
    }
  }

  function goNext() {
    saveDraft(answers);
    setHistory(h => [...h, getNextStep(h[h.length - 1], answers)]);
  }

  function goBack() {
    setHistory(h => (h.length > 1 ? h.slice(0, -1) : h));
  }

  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answers.email.trim());

  // Every question is required except the "three words" prompts (Portland
  // and Multnomah Village) and email, which stay optional.
  const canProceed = (() => {
    switch (step) {
      case 'portland-familiarity':
        return !!answers.portlandFamiliarity;
      case 'portland-detail':
        return answers.portlandHelpers.trim() !== '' && answers.portlandWish.trim() !== '';
      case 'about-you':
        return !!answers.artistStatus && (answers.artistStatus !== OTHER || answers.artistStatusOther.trim() !== '');
      case 'location':
        return answers.zipCode.length === 5 && answers.neighborhoods.trim() !== '';
      case 'mv-familiarity':
        return !!answers.mvFamiliarity;
      case 'mv-detail':
        return !!answers.mvConnectionLevel && answers.mvSupport.trim() !== '';
      case 'practice':
        return answers.practiceActivities.length > 0;
      case 'practice-goals':
        return (
          answers.practiceGoals.length > 0 &&
          (!answers.practiceGoals.includes(OTHER) || answers.practiceGoalsOther.trim() !== '') &&
          answers.practiceSupport.trim() !== ''
        );
      case 'featured-artist':
        return !!answers.featuredArtistInterest;
      case 'stay-connected':
        return answers.stayConnected.length > 0;
      case 'multnomah-days':
        return answers.multnomahDaysInvolvement.length > 0;
      case 'email': {
        if (!answers.raffleOptIn) return false;
        const wantsRaffle = answers.raffleOptIn === RAFFLE_YES;
        const wantsFollowUp = answers.stayConnected.some(s => s !== NONE_AT_THIS_TIME);
        const emailRequired = wantsRaffle || wantsFollowUp;
        return emailRequired ? emailLooksValid : (answers.email.trim() === '' || emailLooksValid);
      }
      default:
        return true;
    }
  })();

  async function handleSubmit() {
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        ...answers,
        portlandWords: answers.portlandWords.filter(w => w.trim() !== ''),
        mvWords: answers.mvWords.filter(w => w.trim() !== ''),
        learnedAbout: [
          ...answers.learnedAbout.filter(v => v !== LEARNED_ABOUT_OTHER),
          ...(answers.learnedAbout.includes(LEARNED_ABOUT_OTHER) && answers.learnedAboutOther.trim()
            ? [`Other: ${answers.learnedAboutOther.trim()}`]
            : answers.learnedAbout.includes(LEARNED_ABOUT_OTHER) ? ['Other'] : []),
        ],
      };
      // If we already have a draft, update it instead of creating a duplicate
      const url = draftId ? `/api/survey?id=${draftId}` : '/api/survey';
      const method = draftId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Request failed');
      setSubmitted(true);
      setHistory(h => [...h, 'done']);
      onSubmitted?.();
    } catch {
      setError('Something went wrong submitting your answers — please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return null;
  }

  const fullPath = getFullPath(answers);
  const questionSteps = fullPath.filter((s): s is Exclude<StepId, 'done'> => s !== 'done');
  const currentIndex = Math.max(questionSteps.indexOf(step as Exclude<StepId, 'done'>), 0);
  const progress = ((currentIndex + 1) / questionSteps.length) * 100;

  return (
    <div className="max-w-[640px] mx-auto px-5 sm:px-10 py-10 sm:py-14">
      <ProgressBar value={progress} />

      {step === 'portland-familiarity' && (
        <div>
          <Eyebrow>About Portland</Eyebrow>
          <Question
            text="How familiar are you with the arts in Portland?"
            hint="This could include visual art, music, performance, community arts, arts education, or other arts in Portland."
          >
            <SingleSelect
              options={PORTLAND_FAMILIARITY_OPTIONS}
              value={answers.portlandFamiliarity}
              onChange={v => update('portlandFamiliarity', v)}
            />
          </Question>
        </div>
      )}

      {step === 'portland-detail' && (
        <div className="flex flex-col gap-10">
          <Eyebrow>About Portland</Eyebrow>
          <Question text="In your opinion, what people, places, or organizations are helping the arts thrive in Portland?" hint="Name one to three.">
            <textarea
              value={answers.portlandHelpers}
              onChange={e => update('portlandHelpers', e.target.value)}
              className={TEXTAREA_CLASS}
              placeholder="Your answer"
            />
          </Question>
          <Question text="If you had a magic wand, what is one thing you would change to better support the arts in Portland?">
            <textarea
              value={answers.portlandWish}
              onChange={e => update('portlandWish', e.target.value)}
              className={TEXTAREA_CLASS}
              placeholder="Your answer"
            />
          </Question>
        </div>
      )}

      {step === 'about-you' && (
        <div>
          <Eyebrow>About You</Eyebrow>
          <Question text="Are you a practicing artist?">
            <SingleSelect
              options={ARTIST_STATUS_OPTIONS}
              value={answers.artistStatus}
              onChange={v => update('artistStatus', v)}
            />
            {answers.artistStatus === OTHER && (
              <input
                value={answers.artistStatusOther}
                onChange={e => update('artistStatusOther', e.target.value)}
                className={`${INPUT_CLASS} mt-2`}
                placeholder="Tell us more"
                autoFocus
              />
            )}
          </Question>
        </div>
      )}

      {step === 'location' && (
        <div className="flex flex-col gap-10">
          <Eyebrow>Where Are You Based?</Eyebrow>
          <Question text="What is your zip code?">
            <input
              value={answers.zipCode}
              onChange={e => update('zipCode', e.target.value.replace(/\D/g, '').slice(0, 5))}
              className={`${INPUT_CLASS} max-w-[160px]`}
              placeholder="97219"
              inputMode="numeric"
              maxLength={5}
            />
          </Question>
          <Question
            text="What neighborhood(s) do you consider yourself part of?"
            hint="Whether you live, work, or spend time there."
          >
            <input
              value={answers.neighborhoods}
              onChange={e => update('neighborhoods', e.target.value)}
              className={INPUT_CLASS}
              placeholder="e.g. Multnomah Village, St. Johns, Hawthorne…"
            />
          </Question>
        </div>
      )}

      {step === 'mv-familiarity' && (
        <div>
          <Eyebrow>About Multnomah Village</Eyebrow>
          <Question text="How familiar are you with Multnomah Village, a neighborhood in Southwest Portland?">
            <SingleSelect
              options={MV_FAMILIARITY_OPTIONS}
              value={answers.mvFamiliarity}
              onChange={v => update('mvFamiliarity', v)}
            />
          </Question>
        </div>
      )}

      {step === 'mv-detail' && (
        <div className="flex flex-col gap-10">
          <Eyebrow>About Multnomah Village</Eyebrow>
          <Question text="How connected do you feel to the artist community in Multnomah Village?">
            <SingleSelect
              options={MV_CONNECTION_OPTIONS}
              value={answers.mvConnectionLevel}
              onChange={v => update('mvConnectionLevel', v)}
            />
          </Question>
          <Question
            text="In your experience, what people, places, or organizations have helped you discover or connect with artists in Multnomah Village?"
            hint="Optional."
          >
            <textarea
              value={answers.mvHelpers}
              onChange={e => update('mvHelpers', e.target.value)}
              className={TEXTAREA_CLASS}
              placeholder="Your answer"
            />
          </Question>
          <Question
            text="How, if at all, would you most like to support artists in Multnomah Village?"
            hint="For example: buy their work, attend events, hire them for projects, spread the word, or other ways."
          >
            <textarea
              value={answers.mvSupport}
              onChange={e => update('mvSupport', e.target.value)}
              className={TEXTAREA_CLASS}
              placeholder="Your answer"
            />
          </Question>
        </div>
      )}

      {step === 'practice' && (
        <div className="flex flex-col gap-10">
          <Eyebrow>About Your Practice</Eyebrow>
          <Question text="In the past year, which of the following have you done?" hint="Select all that apply.">
            <MultiSelect
              options={practiceActivityOptions}
              value={answers.practiceActivities}
              onChange={v => update('practiceActivities', v)}
              exclusive={[NONE_OF_THE_ABOVE]}
            />
          </Question>
        </div>
      )}

      {step === 'practice-goals' && (
        <div className="flex flex-col gap-10">
          <Eyebrow>About Your Practice</Eyebrow>
          <Question text="What are your current goals as an artist?">
            <MultiSelect
              options={practiceGoalOptions}
              value={answers.practiceGoals}
              onChange={v => update('practiceGoals', v)}
              max={3}
            />
            {answers.practiceGoals.includes(OTHER) && (
              <input
                value={answers.practiceGoalsOther}
                onChange={e => update('practiceGoalsOther', e.target.value)}
                className={`${INPUT_CLASS} mt-2`}
                placeholder="Tell us more"
                autoFocus
              />
            )}
          </Question>
          <Question text="What local places, organizations, institutions, or businesses have been most important to supporting you and your art practice in the past year?" hint="Name one to three.">
            <textarea
              value={answers.practiceSupport}
              onChange={e => update('practiceSupport', e.target.value)}
              className={TEXTAREA_CLASS}
              placeholder="Your answer"
            />
          </Question>
        </div>
      )}

      {step === 'featured-artist' && (
        <div>
          <Eyebrow>Become a Featured Artist</Eyebrow>
          <Intro>
            Art Here is currently piloting in Portland with a small but mighty team. We&rsquo;re
            growing thoughtfully and would love to have you involved.
          </Intro>
          <Question text="Would you like to be a featured artist with Art Here?">
            <SingleSelect
              options={FEATURED_ARTIST_OPTIONS}
              value={answers.featuredArtistInterest}
              onChange={v => update('featuredArtistInterest', v)}
            />
          </Question>
        </div>
      )}

      {step === 'stay-connected' && (
        <div>
          <Eyebrow>Stay Connected</Eyebrow>
          <Intro>
            Art Here is building a living directory of local artists, hosting community
            events, and capturing the stories that make Portland&rsquo;s creative
            neighborhoods special. As we grow, there are lots of ways to get involved —
            from staying in the loop to volunteering, partnering, or being featured as
            an artist.
          </Intro>
          <Question text="In what ways would you like to stay connected to Art Here?" hint="Select all that apply.">
            <MultiSelect
              options={stayConnectedOptions}
              value={answers.stayConnected}
              onChange={v => update('stayConnected', v)}
              exclusive={[NONE_AT_THIS_TIME]}
            />
          </Question>
        </div>
      )}

      {step === 'multnomah-days' && (
        <div>
          <Eyebrow>Multnomah Days 2026</Eyebrow>
          <Intro>
            Art Here will have a booth and parade presence at Multnomah Days on August 15, 2026,
            and we&rsquo;re inviting locals to join us to celebrate local arts.
          </Intro>
          <Question text="Would you like to join us for the Multnomah Days Festival on August 15?">
            <MultiSelect
              options={multnomahDaysOptions}
              value={answers.multnomahDaysInvolvement}
              onChange={v => update('multnomahDaysInvolvement', v)}
              exclusive={[NOT_INTERESTED_MULTNOMAH_DAYS]}
            />
          </Question>
        </div>
      )}

      {step === 'email' && (
        <div className="flex flex-col gap-10">
          <Eyebrow>One Last Thing</Eyebrow>
          <Question text="Would you like to be entered in a raffle for completing this survey?">
            <SingleSelect
              options={RAFFLE_OPTIONS}
              value={answers.raffleOptIn}
              onChange={v => update('raffleOptIn', v)}
            />
          </Question>
          <Question
            text="Email address"
            hint="Required if you'd like to enter the raffle or stay connected. We'll only use it to follow up with you — it won't be shared or connected to your survey answers."
          >
            <input
              type="email"
              value={answers.email}
              onChange={e => update('email', e.target.value)}
              onBlur={() => setEmailTouched(true)}
              className={`${INPUT_CLASS} max-w-[360px]`}
              placeholder="you@example.com"
            />
            {emailTouched && answers.email.trim() !== '' && !emailLooksValid && (
              <p className="text-[0.8rem] text-[#b91c1c] mt-2">Please enter a valid email address.</p>
            )}
          </Question>
        </div>
      )}

      {step === 'learned-about' && (
        <div className="flex flex-col gap-10">
          <Eyebrow>Almost Done</Eyebrow>
          <Question text="Where did you learn about Art Here?" hint="Select all that apply.">
            <MultiSelect
              options={learnedAboutOptions}
              value={answers.learnedAbout}
              onChange={v => update('learnedAbout', v)}
            />
            {answers.learnedAbout.includes(LEARNED_ABOUT_OTHER) && (
              <input
                value={answers.learnedAboutOther}
                onChange={e => update('learnedAboutOther', e.target.value)}
                className={`${INPUT_CLASS} mt-2`}
                placeholder="Please describe…"
                autoFocus
              />
            )}
          </Question>
        </div>
      )}

      {error && <p className="text-[0.85rem] text-[#b91c1c] mt-8">{error}</p>}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-12">
        {history.length > 1 ? (
          <button type="button" onClick={goBack} className={BUTTON_SECONDARY}>
            ← Back
          </button>
        ) : (
          <span />
        )}

        {step === 'learned-about' ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className={BUTTON_PRIMARY}
          >
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        ) : step === 'email' ? (
          <button
            type="button"
            onClick={() => {
              setEmailTouched(true);
              if (canProceed) goNext();
            }}
            disabled={!canProceed}
            className={BUTTON_PRIMARY}
          >
            Next
          </button>
        ) : (
          <button type="button" onClick={goNext} disabled={!canProceed} className={BUTTON_PRIMARY}>
            Next
          </button>
        )}
      </div>
    </div>
  );
}
