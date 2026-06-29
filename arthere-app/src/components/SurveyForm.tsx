'use client';

import { useState, useEffect } from 'react';

// ─── Answer shape ───────────────────────────────────────────────────────────

interface Answers {
  portlandFamiliarity: string;
  portlandWords: [string, string, string];
  portlandHelpers: string;
  portlandSupport: string[];
  portlandSupportOther: string;
  portlandWish: string;

  occupation: string[];
  occupationOther: string;
  artistStatus: string;
  artistStatusOther: string;
  careerStage: string;

  zipCode: string;
  neighborhoods: string;

  practiceActivities: string[];
  practiceActivitiesOther: string;
  practiceGoals: string[];
  practiceGoalsOther: string;
  practiceSupport: string;

  involvementInterests: string[];
  involvementInterestsOther: string;

  raffleOptIn: string;
  email: string;
  learnedAbout: string[];
  learnedAboutOther: string;
}

const initialAnswers: Answers = {
  portlandFamiliarity: '',
  portlandWords: ['', '', ''],
  portlandHelpers: '',
  portlandSupport: [],
  portlandSupportOther: '',
  portlandWish: '',
  occupation: [],
  occupationOther: '',
  artistStatus: '',
  artistStatusOther: '',
  careerStage: '',
  zipCode: '',
  neighborhoods: '',
  practiceActivities: [],
  practiceActivitiesOther: '',
  practiceGoals: [],
  practiceGoalsOther: '',
  practiceSupport: '',
  involvementInterests: [],
  involvementInterestsOther: '',
  raffleOptIn: '',
  email: '',
  learnedAbout: [],
  learnedAboutOther: '',
};

// ─── Option lists ────────────────────────────────────────────────────────────
// Branching decisions are keyed off these exact strings, so they're pulled
// out as constants rather than re-typed inline.

const PORTLAND_FAMILIARITY_OPTIONS = [
  'Very aware',
  'Somewhat aware',
  'A little aware',
  'Not at all aware',
];

const OCCUPATION_OTHER = 'Other';
const OCCUPATION_RETIRED = 'Retired';
const OCCUPATION_PREFER_NOT = 'Prefer not to say';
// Pinned at bottom (not randomized): Homemaker, Not currently working, Retired, Other, Prefer not to say
const OCCUPATION_PINNED = ['Homemaker', 'Not currently working', OCCUPATION_RETIRED, OCCUPATION_OTHER, OCCUPATION_PREFER_NOT];
const OCCUPATION_OPTIONS = [
  'Arts (Visual Art, Dance, Music, Theater)',
  'Business or Professional Services',
  'Design or Creative Services',
  'Education',
  'Federal or State Government',
  'Healthcare',
  'Local Government (City or County)',
  'Non-profit',
  'Technology',
  'Trades or Manufacturing',
  'Homemaker',
  'Not currently working',
  OCCUPATION_RETIRED,
  OCCUPATION_OTHER,
  OCCUPATION_PREFER_NOT,
];

const NOT_MAKING_ART = 'No';
const OTHER = 'Other';
const ARTIST_STATUS_OPTIONS = [
  'Yes, it is my primary occupation',
  'Yes, I have an active art practice alongside other work',
  `Yes, I'm an art student`,
  'Yes, for fun or as a hobby',
  NOT_MAKING_ART,
  OTHER,
];

const PORTLAND_SUPPORT_OTHER = 'Other';
const PORTLAND_SUPPORT_NONE = 'None of the above';
const PORTLAND_SUPPORT_OPTIONS = [
  'Purchase artwork',
  'Hire or commission artwork',
  'Collaborate with artists',
  'Attend events',
  'Visit art galleries or shows',
  "Share artists' work",
  'Volunteer',
  PORTLAND_SUPPORT_OTHER,
  PORTLAND_SUPPORT_NONE,
];

const INVOLVEMENT_OTHER = 'Other';
const INVOLVEMENT_NONE = 'None of the above';
const INVOLVEMENT_OPTIONS = [
  'Keep me posted on Art Here news',
  'Become a featured artist',
  'Volunteer to help Art Here',
  'Join the parade at Multnomah Days 2026 (August 15, Portland)',
  'Partner or collaborate',
  INVOLVEMENT_OTHER,
  INVOLVEMENT_NONE,
];

const NONE_OF_THE_ABOVE = 'None of the above';
const PRACTICE_ACTIVITY_OPTIONS = [
  'Sold original artwork',
  'Taken commissions for my artwork',
  'Shown my artwork in galleries, shows, or public events',
  'Applied for an artist grant or residency',
  'Received an artist grant or residency',
  'Collaborated with other artists or organizations',
  'Taken a class or workshop to support my art practice',
  OTHER,
  NONE_OF_THE_ABOVE,
];

const PRACTICE_GOAL_OPTIONS = [
  'Sell more artwork',
  'Find more commissions',
  'Share my artwork with more people',
  'Connect with other local artists',
  'Show my artwork in galleries, shows, or public events',
  'Find studio space or places to make my work',
  'Receive an artist grant or residency',
  'Collaborate with other artists',
  'Find classes or training to develop my skills',
  OTHER,
];

const RAFFLE_YES = 'Yes';
const RAFFLE_OPTIONS = [RAFFLE_YES, 'No'];

const LEARNED_ABOUT_OTHER = 'Other';
const LEARNED_ABOUT_OPTIONS = [
  'Multnomah Arts Center',
  'A business in Multnomah Village',
  'Local art gallery',
  'Word of mouth',
  LEARNED_ABOUT_OTHER,
];

// ─── Option order randomization ─────────────────────────────────────────────
// For "select all that apply" questions where the options are a plain list
// (not a scale from "most" to "least"), we shuffle the order shown to each
// visitor so no option gets an unfair edge just from being listed first.
// "Other" / "None of the above" / "I'm not interested" style options stay
// pinned at the bottom, where people expect to find them.

const PORTLAND_METRO_ZIPS = new Set([
  '97004','97005','97006','97007','97008','97009','97010','97011','97013',
  '97015','97016','97017','97018','97019','97022','97023','97024','97027',
  '97028','97030','97034','97035','97036','97038','97042','97045','97048',
  '97049','97051','97053','97054','97055','97056','97060','97062','97064',
  '97067','97068','97070','97075','97076','97077','97080','97086','97089',
  '97101','97106','97109','97111','97113','97114','97115','97116','97117',
  '97119','97123','97124','97125','97127','97128','97132','97133','97140',
  '97144','97148','97201','97202','97203','97204','97205','97206','97207',
  '97208','97209','97210','97211','97212','97213','97214','97215','97216',
  '97217','97218','97219','97220','97221','97222','97223','97224','97225',
  '97227','97228','97229','97230','97231','97232','97233','97236','97238',
  '97239','97240','97242','97256','97258','97266','97267','97268','97269',
  '97280','97281','97282','97283','97286','97290','97291','97292','97293',
  '97294','97296','97298','97299','97378','97396',
  '98601','98604','98606','98607','98622','98629','98642','98660','98661',
  '98662','98663','98664','98665','98666','98668','98671','98675','98682',
  '98683','98684','98685','98686','98687',
]);

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

type StepId =
  | 'location'
  | 'about-you'
  | 'about-you-art'
  | 'career-stage'
  | 'portland-familiarity'
  | 'portland-detail'
  | 'practice'
  | 'practice-goals'
  | 'involvement'
  | 'email'
  | 'learned-about'
  | 'done';

function isMakingArt(a: Answers) {
  return a.artistStatus !== NOT_MAKING_ART;
}

const CAREER_STAGE_STATUSES = [
  'Yes, it is my primary occupation',
  'Yes, I have an active art practice alongside other work',
];

function showsCareerStage(a: Answers) {
  return CAREER_STAGE_STATUSES.includes(a.artistStatus);
}

function getNextStep(step: StepId, a: Answers): StepId {
  switch (step) {
    case 'location':
      return 'about-you';
    case 'about-you':
      return 'about-you-art';
    case 'about-you-art':
      return showsCareerStage(a) ? 'career-stage' : 'portland-familiarity';
    case 'career-stage':
      return 'portland-familiarity';
    case 'portland-familiarity':
      return 'portland-detail';
    case 'portland-detail':
      return isMakingArt(a) ? 'practice' : 'involvement';
    case 'practice':
      return 'practice-goals';
    case 'practice-goals':
      return 'involvement';
    case 'involvement':
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
  const path: StepId[] = ['location'];
  let current: StepId = 'location';
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

const BUTTON_PRIMARY =
  'px-6 py-3 rounded-full bg-[#1a1a1a] text-white text-[0.9rem] font-medium transition-opacity hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer';
const BUTTON_SECONDARY =
  'px-5 py-3 rounded-full text-[#888] text-[0.9rem] font-medium transition-colors hover:text-[#1a1a1a] cursor-pointer';

// ─── Small building blocks ──────────────────────────────────────────────────

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div className="text-[0.72rem] font-semibold tracking-[0.14em] uppercase text-[#999] mb-3">{children}</div>;
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
      {hint && <p className="text-[0.85rem] text-[#999] font-semibold mb-3">{hint}</p>}
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
export function SurveyForm({ onSubmitted, onStepChange }: { onSubmitted?: () => void; onStepChange?: (isFirstStep: boolean) => void }) {
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [history, setHistory] = useState<StepId[]>(['location']);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);

  const step = history[history.length - 1];

  // Scroll to top after each step change, once the new content has rendered.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  // Shuffled once per visit (not on every render, so the order doesn't jump
  // around as people answer).

  const [practiceActivityOptions] = useState(() => shuffleOptions(PRACTICE_ACTIVITY_OPTIONS, [OTHER, NONE_OF_THE_ABOVE]));
  const [practiceGoalOptions] = useState(() => shuffleOptions(PRACTICE_GOAL_OPTIONS, [OTHER]));
  const [learnedAboutOptions] = useState(() => shuffleOptions(LEARNED_ABOUT_OPTIONS, [LEARNED_ABOUT_OTHER]));
  const occupationOptions = OCCUPATION_OPTIONS;
  const [portlandSupportOptions] = useState(() => shuffleOptions(PORTLAND_SUPPORT_OPTIONS, [PORTLAND_SUPPORT_OTHER, PORTLAND_SUPPORT_NONE]));

  function update<K extends keyof Answers>(key: K, value: Answers[K]) {
    setAnswers(a => ({ ...a, [key]: value }));
  }

  async function saveDraft(currentAnswers: Answers) {
    const payload = {
      ...currentAnswers,
      portlandWords: currentAnswers.portlandWords.filter(w => w.trim() !== ''),
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
    const next = getNextStep(history[history.length - 1], answers);
    setHistory(h => [...h, next]);
    onStepChange?.(false);
  }

  function goBack() {
    const newHistory = history.length > 1 ? history.slice(0, -1) : history;
    setHistory(newHistory);
    onStepChange?.(newHistory.length === 1);
  }

  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answers.email.trim());

  // Every question is required except the "three words" prompts, the portland
  // helpers and wish textareas, and email, which stay optional.
  const canProceed = (() => {
    switch (step) {
      case 'location':
        return answers.zipCode.length === 5 && answers.neighborhoods.trim() !== '';
      case 'about-you':
        return answers.occupation.length > 0;
      case 'about-you-art':
        return (
          !!answers.artistStatus &&
          (answers.artistStatus !== OTHER || answers.artistStatusOther.trim() !== '')
        );
      case 'career-stage':
        return !!answers.careerStage;
      case 'portland-familiarity':
        return !!answers.portlandFamiliarity;
      case 'portland-detail':
        return answers.portlandSupport.length > 0;
      case 'practice':
        return answers.practiceActivities.length > 0;
      case 'practice-goals':
        return (
          answers.practiceGoals.length > 0 &&
          (!answers.practiceGoals.includes(OTHER) || answers.practiceGoalsOther.trim() !== '') &&
          answers.practiceSupport.trim() !== ''
        );
      case 'involvement':
        return answers.involvementInterests.length > 0 && !!answers.raffleOptIn;
      case 'email': {
        const wantsRaffle = answers.raffleOptIn === RAFFLE_YES;
        const wantsInvolvement = answers.involvementInterests.some(s => s !== INVOLVEMENT_NONE);
        const emailRequired = wantsRaffle || wantsInvolvement;
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

      {step === 'about-you' && (
        <div className="flex flex-col gap-10">
          <Eyebrow>About You</Eyebrow>
          <Question text="What field do you work in?" hint="If not currently working, what field did you most recently work in? Select all that apply.">
            <div className="flex flex-col gap-2">
              {occupationOptions.map(opt => {
                const selected = answers.occupation.includes(opt);
                const isExclusive = opt === OCCUPATION_PREFER_NOT;
                return (
                  <div key={opt}>
                    <button
                      type="button"
                      onClick={() => {
                        if (isExclusive) {
                          update('occupation', selected ? [] : [opt]);
                        } else {
                          const base = answers.occupation.filter(v => v !== OCCUPATION_PREFER_NOT);
                          update('occupation', base.includes(opt) ? base.filter(v => v !== opt) : [...base, opt]);
                        }
                      }}
                      className={`w-full ${OPTION_BASE} ${selected ? OPTION_ACTIVE : OPTION_INACTIVE}`}
                    >
                      <Indicator selected={selected} shape="square" />
                      {opt}
                    </button>
                    {opt === OCCUPATION_OTHER && selected && (
                      <input
                        value={answers.occupationOther}
                        onChange={e => update('occupationOther', e.target.value)}
                        className={`${INPUT_CLASS} mt-2`}
                        placeholder="Please describe…"
                        autoFocus
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </Question>
        </div>
      )}

      {step === 'about-you-art' && (
        <div>
          <Eyebrow>About You</Eyebrow>
          <Question text="Do you make art?">
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
              />
            )}
          </Question>
        </div>
      )}

      {step === 'career-stage' && (
        <div>
          <Eyebrow>About You</Eyebrow>
          <Question text="How long have you been practicing as an artist?">
            <SingleSelect
              options={[
                'Just getting started (less than 2 years)',
                'Early career (2–5 years)',
                'Established (5–15 years)',
                'Longtime (15+ years)',
              ]}
              value={answers.careerStage}
              onChange={v => update('careerStage', v)}
            />
          </Question>
        </div>
      )}

      {step === 'portland-familiarity' && (
        <div>
          <Eyebrow>About Portland</Eyebrow>
          <Question text="How aware are you of local artists in your area?">
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
          <Question text="In your opinion, what people, places, or organizations most help artists thrive in Portland?" hint="Name one to three.">
            <textarea
              value={answers.portlandHelpers}
              onChange={e => update('portlandHelpers', e.target.value)}
              className={TEXTAREA_CLASS}
              placeholder="Your answer"
            />
          </Question>
          <Question text="How, if at all, would you like to connect with or support the artist community in Portland?" hint="Select all that apply.">
            <MultiSelect
              options={portlandSupportOptions}
              value={answers.portlandSupport}
              onChange={v => update('portlandSupport', v)}
              exclusive={[PORTLAND_SUPPORT_NONE]}
            />
            {answers.portlandSupport.includes(PORTLAND_SUPPORT_OTHER) && (
              <input
                value={answers.portlandSupportOther}
                onChange={e => update('portlandSupportOther', e.target.value)}
                className={`${INPUT_CLASS} mt-2`}
                placeholder="Please describe…"
              />
            )}
          </Question>
          <Question text="If you had a magic wand that could change one thing in Portland to better support artists, what would you change?">
            <textarea
              value={answers.portlandWish}
              onChange={e => update('portlandWish', e.target.value)}
              className={TEXTAREA_CLASS}
              placeholder="Your answer"
            />
          </Question>
        </div>
      )}

      {step === 'practice' && (
        <div className="flex flex-col gap-10">
          <Eyebrow>About Your Art</Eyebrow>
          <Question text="In the past year, which of the following have you done in support of your art?" hint="Select all that apply.">
            <MultiSelect
              options={practiceActivityOptions}
              value={answers.practiceActivities}
              onChange={v => update('practiceActivities', v)}
              exclusive={[NONE_OF_THE_ABOVE]}
            />
            {answers.practiceActivities.includes(OTHER) && (
              <input
                value={answers.practiceActivitiesOther}
                onChange={e => update('practiceActivitiesOther', e.target.value)}
                className={`${INPUT_CLASS} mt-2`}
                placeholder="Please describe…"
              />
            )}
          </Question>
        </div>
      )}

      {step === 'practice-goals' && (
        <div className="flex flex-col gap-10">
          <Eyebrow>About Your Art</Eyebrow>
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
          <Question text="What local places, organizations, institutions, or businesses have been most important to supporting you and your art practice?" hint="Name one to three.">
            <textarea
              value={answers.practiceSupport}
              onChange={e => update('practiceSupport', e.target.value)}
              className={TEXTAREA_CLASS}
              placeholder="Your answer"
            />
          </Question>
        </div>
      )}

      {step === 'involvement' && (
        <div className="flex flex-col gap-10">
          <Eyebrow>Get Involved</Eyebrow>
          <Question text="In what ways, if any, would you like to get involved with Art Here?" hint="Select all that apply.">
            <MultiSelect
              options={INVOLVEMENT_OPTIONS}
              value={answers.involvementInterests}
              onChange={v => update('involvementInterests', v)}
              exclusive={[INVOLVEMENT_NONE]}
            />
            {answers.involvementInterests.includes(INVOLVEMENT_OTHER) && (
              <input
                value={answers.involvementInterestsOther}
                onChange={e => update('involvementInterestsOther', e.target.value)}
                className={`${INPUT_CLASS} mt-2`}
                placeholder="Please describe…"
              />
            )}
          </Question>
          <Question
            text="Would you like to be entered in a raffle for completing this survey?"
            hint="Raffle winners will receive a $25 gift card to a local shop that supports Portland artists."
          >
            <SingleSelect
              options={RAFFLE_OPTIONS}
              value={answers.raffleOptIn}
              onChange={v => update('raffleOptIn', v)}
            />
          </Question>
        </div>
      )}

      {step === 'email' && (
        <div className="flex flex-col gap-10">
          <Eyebrow>Almost Done</Eyebrow>
          <Question
            text="Email address"
            hint="Required if you'd like to get involved or enter the raffle. We'll only use it to follow up — it won't be shared or connected to your survey answers."
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
          <Eyebrow>One Last Thing</Eyebrow>
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
