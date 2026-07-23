'use client';

import { useState, useEffect } from 'react';

// ─── Answer shape ───────────────────────────────────────────────────────────

interface Answers {
  zipCode: string;
  neighborhoods: string;

  occupation: string[];
  occupationOther: string;

  artistStatus: string;
  artistStatusOther: string;

  artMedium: string[];
  artMediumOther: string;

  portlandFamiliarity: string;

  discoveryEase: string;
  discoveryChannel: string[];
  discoveryChannelOther: string;

  portlandHelpers: string;       // merged Q5/Q11 — Path B wording
  portlandSupport: string[];
  portlandSupportOther: string;

  careerStage: string;
  careerStageOther: string;

  practiceActivities: string[];
  practiceActivitiesOther: string;

  practiceGoals: string[];
  practiceGoalsOther: string;
  practiceSupport: string;       // merged Q5/Q11 — Path A wording

  involvementInterests: string[];
  involvementInterestsOther: string;

  raffleOptIn: string;
  email: string;
  learnedAbout: string[];
  learnedAboutOther: string;
  openFeedback: string;
}

const initialAnswers: Answers = {
  zipCode: '',
  neighborhoods: '',

  occupation: [],
  occupationOther: '',

  artistStatus: '',
  artistStatusOther: '',

  artMedium: [],
  artMediumOther: '',

  portlandFamiliarity: '',

  discoveryEase: '',
  discoveryChannel: [],
  discoveryChannelOther: '',

  portlandHelpers: '',
  portlandSupport: [],
  portlandSupportOther: '',

  careerStage: '',
  careerStageOther: '',

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
  openFeedback: '',
};

// ─── Option lists ────────────────────────────────────────────────────────────

const OCCUPATION_OTHER = 'Other';
const OCCUPATION_PREFER_NOT = 'Prefer not to say';
const OCCUPATION_PINNED = ['Not currently working', 'Retired', OCCUPATION_OTHER, OCCUPATION_PREFER_NOT];
const OCCUPATION_OPTIONS = [
  'Arts (Visual Art, Dance, Music, Theater)',
  'Business or Professional Services',
  'Design or Creative Services',
  'Education',
  'Federal or State Government',
  'Healthcare',
  'Homemaker',
  'Local Government (City or County)',
  'Non-profit',
  'Technology',
  'Trades or Manufacturing',
  'Not currently working',
  'Retired',
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

const ART_MEDIUM_OTHER = 'Other';
const ART_MEDIUM_PREFER_NOT = 'Prefer not to say';
const ART_MEDIUM_OPTIONS = [
  'Ceramics',
  'Dance',
  'Digital Art / New Media',
  'Drawing',
  'Film / Video',
  'Illustration',
  'Music',
  'Painting',
  'Photography',
  'Sculpture',
  'Textiles',
  'Theater / Performance',
  'Woodworking',
  'Writing / Literary Arts',
  ART_MEDIUM_OTHER,
  ART_MEDIUM_PREFER_NOT,
];

const PORTLAND_FAMILIARITY_OPTIONS = [
  'Not at all interested',
  'Slightly interested',
  'Moderately interested',
  'Very interested',
  'Extremely interested',
];

const DISCOVERY_EASE_OPTIONS = [
  'Very difficult',
  'Somewhat difficult',
  'Neither easy nor difficult',
  'Somewhat easy',
  'Very easy',
];

const DISCOVERY_CHANNEL_OTHER = 'Other';
const DISCOVERY_CHANNEL_OPTIONS = [
  'Shops',
  'Galleries',
  'Social media',
  'Art events',
  'Flyers in public places',
  'Friends, Family, or Word of Mouth',
  DISCOVERY_CHANNEL_OTHER,
];

const PORTLAND_SUPPORT_OTHER = 'Other';
const PORTLAND_SUPPORT_NONE = 'None of the above';
const PORTLAND_SUPPORT_OPTIONS = [
  'Purchase artwork',
  'Hire or commission artwork',
  'Collaborate with artists',
  'Attend events',
  'Visit galleries or shows',
  "Share artists' work",
  'Volunteer',
  PORTLAND_SUPPORT_OTHER,
  PORTLAND_SUPPORT_NONE,
];

const CAREER_STAGE_OTHER = 'Other (please specify)';
const CAREER_STAGE_OPTIONS = [
  'Less than 1 year',
  '1–2 years',
  '3–5 years',
  '6–10 years',
  '11–15 years',
  '15+ years',
  CAREER_STAGE_OTHER,
];

const NONE_OF_THE_ABOVE = 'None of the above';
const PRACTICE_ACTIVITY_OPTIONS = [
  'Sold original artwork',
  'Completed commissions for my artwork',
  'Shown my artwork in galleries, shows, or public events',
  'Performed or presented art publicly',
  'Applied for an artist grant or residency',
  'Received an artist grant or residency',
  'Collaborated with other artists or organizations',
  'Taken a class or training to support my art practice',
  OTHER,
  NONE_OF_THE_ABOVE,
];

const PRACTICE_GOAL_OPTIONS = [
  'Sell my artwork',
  'Find more commissions',
  'Share or promote my art',
  'Connect with other local artists',
  'Show my artwork in galleries, shows, or public events',
  'Find studio space or places to make my work',
  'Receive an artist grant or residency',
  'Collaborate with other artists',
  'Take classes or training to support my art practice',
  OTHER,
];

const INVOLVEMENT_OTHER = 'Other';
const INVOLVEMENT_NONE = 'None of the above';
const INVOLVEMENT_FEATURED = 'Showcase my work on the Art Here platform';
const INVOLVEMENT_OPTIONS = [
  'Keep me posted on Art Here news',
  INVOLVEMENT_FEATURED,
  'Volunteer to help Art Here',
  'Join the parade at Multnomah Days 2026 (August 15, Portland)',
  'Partner or collaborate',
  INVOLVEMENT_OTHER,
  INVOLVEMENT_NONE,
];

const RAFFLE_YES = 'Yes';
const RAFFLE_OPTIONS = [RAFFLE_YES, 'No'];

const LEARNED_ABOUT_OTHER = 'Other';
const LEARNED_ABOUT_OPTIONS = [
  'Multnomah Arts Center',
  'Local business',
  'Local art gallery',
  'Flyers in public places',
  'Friends, Family, or Word of Mouth',
  LEARNED_ABOUT_OTHER,
];

// ─── Option order randomization ─────────────────────────────────────────────

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

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
  | 'art-medium'
  | 'portland-familiarity'
  | 'discovery'
  | 'portland-detail'
  | 'career-stage'
  | 'practice'
  | 'practice-goals'
  | 'involvement'
  | 'email'
  | 'learned-about'
  | 'done';

function isMakingArt(a: Answers) {
  return a.artistStatus !== NOT_MAKING_ART && a.artistStatus !== '';
}

function getNextStep(step: StepId, a: Answers): StepId {
  switch (step) {
    case 'location':
      return 'about-you';
    case 'about-you':
      return 'about-you-art';
    case 'about-you-art':
      return isMakingArt(a) ? 'art-medium' : 'portland-familiarity';
    case 'art-medium':
      return 'portland-familiarity';
    case 'portland-familiarity':
      return 'discovery';
    case 'discovery':
      return 'portland-detail';
    case 'portland-detail':
      return isMakingArt(a) ? 'career-stage' : 'involvement';
    case 'career-stage':
      return 'practice';
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
    <div className="mb-10">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[0.75rem] text-[#999] font-medium tracking-wide uppercase">Progress</span>
        <span className="text-[0.75rem] text-[#666] font-semibold">{Math.round(value)}%</span>
      </div>
      <div className="h-[8px] w-full bg-[#f0f0f0] rounded-full overflow-hidden">
        <div className="h-full bg-[#1a1a1a] rounded-full transition-all duration-300 ease-out" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export function SurveyForm({ onSubmitted }: { onSubmitted?: () => void }) {
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [history, setHistory] = useState<StepId[]>(['location']);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);

  const step = history[history.length - 1];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [step]);

  // Shuffled once per visit so the order doesn't jump around as people answer.
  const artMediumOptions = ART_MEDIUM_OPTIONS;
  const [practiceActivityOptions] = useState(() => shuffleOptions(PRACTICE_ACTIVITY_OPTIONS, [OTHER, NONE_OF_THE_ABOVE]));
  const [practiceGoalOptions] = useState(() => shuffleOptions(PRACTICE_GOAL_OPTIONS, [OTHER]));
  const [learnedAboutOptions] = useState(() => shuffleOptions(LEARNED_ABOUT_OPTIONS, [LEARNED_ABOUT_OTHER]));
  const [portlandSupportOptions] = useState(() => shuffleOptions(PORTLAND_SUPPORT_OPTIONS, [PORTLAND_SUPPORT_OTHER, PORTLAND_SUPPORT_NONE]));
  const [discoveryChannelOptions] = useState(() => shuffleOptions(DISCOVERY_CHANNEL_OPTIONS, [DISCOVERY_CHANNEL_OTHER]));
  const [likertFlipped] = useState(() => Math.random() < 0.5);
  const familiarityOptions = likertFlipped ? [...PORTLAND_FAMILIARITY_OPTIONS].reverse() : PORTLAND_FAMILIARITY_OPTIONS;
  const discoveryEaseOptions = likertFlipped ? [...DISCOVERY_EASE_OPTIONS].reverse() : DISCOVERY_EASE_OPTIONS;
  const occupationOptions = OCCUPATION_OPTIONS;

  function update<K extends keyof Answers>(key: K, value: Answers[K]) {
    setAnswers(a => ({ ...a, [key]: value }));
  }

  async function saveDraft(currentAnswers: Answers) {
    const payload = { ...currentAnswers };
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
  }

  function goBack() {
    if (history.length > 1) setHistory(h => h.slice(0, -1));
  }

  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answers.email.trim());

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
      case 'art-medium':
        return answers.artMedium.length > 0;
      case 'portland-familiarity':
        return !!answers.portlandFamiliarity;
      case 'discovery':
        return !!answers.discoveryEase && answers.discoveryChannel.length > 0;
      case 'portland-detail':
        return answers.portlandSupport.length > 0;
      case 'career-stage':
        return (
          !!answers.careerStage &&
          (answers.careerStage !== CAREER_STAGE_OTHER || answers.careerStageOther.trim() !== '')
        );
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
        learnedAbout: [
          ...answers.learnedAbout.filter(v => v !== LEARNED_ABOUT_OTHER),
          ...(answers.learnedAbout.includes(LEARNED_ABOUT_OTHER) && answers.learnedAboutOther.trim()
            ? [`Other: ${answers.learnedAboutOther.trim()}`]
            : answers.learnedAbout.includes(LEARNED_ABOUT_OTHER) ? ['Other'] : []),
        ],
      };
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
            text="What is the name of your neighborhood?"
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

      {step === 'art-medium' && (
        <div>
          <Eyebrow>About Your Art</Eyebrow>
          <Question text="What type(s) of art do you make?" hint="Select all that apply.">
            <MultiSelect
              options={artMediumOptions}
              value={answers.artMedium}
              onChange={v => update('artMedium', v)}
              exclusive={[ART_MEDIUM_PREFER_NOT]}
            />
            {answers.artMedium.includes(ART_MEDIUM_OTHER) && (
              <input
                value={answers.artMediumOther}
                onChange={e => update('artMediumOther', e.target.value)}
                className={`${INPUT_CLASS} mt-2`}
                placeholder="Please describe…"
                autoFocus
              />
            )}
          </Question>
        </div>
      )}

      {step === 'portland-familiarity' && (
        <div>
          <Eyebrow>About Portland</Eyebrow>
          <Question text="How interested are you in discovering or connecting with local artists?">
            <SingleSelect
              options={familiarityOptions}
              value={answers.portlandFamiliarity}
              onChange={v => update('portlandFamiliarity', v)}
            />
          </Question>
        </div>
      )}

      {step === 'discovery' && (
        <div className="flex flex-col gap-10">
          <Eyebrow>About Portland</Eyebrow>
          <Question text="How easy or difficult is it for you to discover new local artists?">
            <SingleSelect
              options={discoveryEaseOptions}
              value={answers.discoveryEase}
              onChange={v => update('discoveryEase', v)}
            />
          </Question>
          <Question text="In your experience, what has been the best way of discovering local artists?" hint="Select up to 3.">
            <MultiSelect
              options={discoveryChannelOptions}
              value={answers.discoveryChannel}
              onChange={v => update('discoveryChannel', v)}
              max={3}
            />
            {answers.discoveryChannel.includes(DISCOVERY_CHANNEL_OTHER) && (
              <input
                value={answers.discoveryChannelOther}
                onChange={e => update('discoveryChannelOther', e.target.value)}
                className={`${INPUT_CLASS} mt-2`}
                placeholder="Please describe…"
              />
            )}
          </Question>
        </div>
      )}

      {step === 'portland-detail' && (
        <div className="flex flex-col gap-10">
          <Eyebrow>About Portland</Eyebrow>
          {!isMakingArt(answers) && (
            <Question text="In your opinion, what local people, places, or organizations most support artists in Portland?" hint="Name one to three.">
              <textarea
                value={answers.portlandHelpers}
                onChange={e => update('portlandHelpers', e.target.value)}
                className={TEXTAREA_CLASS}
                placeholder="Your answer"
              />
            </Question>
          )}
          <Question text="How, if at all, would you like to connect with or support local artists in Portland?" hint="Select all that apply.">
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
        </div>
      )}

      {step === 'career-stage' && (
        <div>
          <Eyebrow>About You</Eyebrow>
          <Question text="How long have you been making art in your primary medium?">
            <SingleSelect
              options={CAREER_STAGE_OPTIONS}
              value={answers.careerStage}
              onChange={v => update('careerStage', v)}
            />
            {answers.careerStage === CAREER_STAGE_OTHER && (
              <input
                value={answers.careerStageOther}
                onChange={e => update('careerStageOther', e.target.value)}
                className={`${INPUT_CLASS} mt-2`}
                placeholder="Please describe…"
                autoFocus
              />
            )}
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
          <Question text="What are your main goals for your art right now?" hint="Select up to 3.">
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
          <Question text="What local people, places, or organizations have most supported your art practice?" hint="Name one to three.">
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
          <p className="text-[0.95rem] text-[#444] font-light leading-[1.7]">
            Art Here is building a free, public directory to help neighbors discover and support local artists&rsquo; work. We&rsquo;ll also have a presence at Multnomah Days on August 15. Select any ways you&rsquo;d like to be involved:
          </p>
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
            hint="Raffles are held after every 25 surveys received. Your entry stays in the pool for all future drawings. Winners receive a $25 gift card to a local shop that supports Portland artists."
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
          <Question text="Is there anything else you would like to share about the arts in Portland, Art Here, or this survey?">
            <textarea
              value={answers.openFeedback}
              onChange={e => update('openFeedback', e.target.value)}
              className={TEXTAREA_CLASS}
              placeholder="Optional"
            />
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
            disabled={submitting || !canProceed}
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
