'use client';

import { useState } from 'react';
import { SurveyForm } from '@/components/SurveyForm';
import { AnimatedLogoMask } from '@/components/AnimatedLogoMask';

/**
 * Everything below the nav bar on /survey: the intro copy, consent checkboxes,
 * and start gate — then the form itself once the respondent clicks "Start Survey".
 * After submission, swaps to a thank-you view.
 */
export function SurveyPageContent() {
  const [submitted, setSubmitted] = useState(false);
  const [started, setStarted] = useState(false);
  const [purposeConfirmed, setPurposeConfirmed] = useState(false);
  const [privacyConfirmed, setPrivacyConfirmed] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);

  const canStart = purposeConfirmed && privacyConfirmed && ageConfirmed;

  if (submitted) {
    return (
      <div className="max-w-[640px] mx-auto px-5 sm:px-10 pt-14 sm:pt-20 pb-20 text-center">
        <AnimatedLogoMask width="min(45vw, 160px)" />
        <h1 className="font-heading text-[clamp(2rem,5vw,2.8rem)] font-bold tracking-[-0.02em] leading-[1.15] mb-7 mt-8">
          Thank You!
        </h1>
        <p className="text-[1.05rem] text-[#555] font-light leading-[1.85] max-w-[440px] mx-auto mb-10">
          Your answers help us understand what Portland&rsquo;s arts community needs. We
          really appreciate you taking the time.
        </p>
        <a
          href="/#about"
          className="inline-block px-7 py-3 rounded-full border border-[#1a1a1a] text-[0.9rem] font-medium text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-colors"
        >
          Learn more about Art Here
        </a>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="max-w-[640px] mx-auto px-5 sm:px-10 pt-14 sm:pt-20 pb-20">
        <AnimatedLogoMask width="min(45vw, 160px)" />

        <div className="text-[0.7rem] font-semibold tracking-[0.14em] uppercase text-[#bbb] mb-4 mt-8">
          Art Here · Portland
        </div>
        <h1 className="font-heading text-[clamp(2rem,5vw,2.8rem)] font-bold tracking-[-0.02em] leading-[1.15] mb-4">
          PDX Community Survey
        </h1>

        <p className="text-[1.05rem] text-[#1a1a1a] font-normal leading-[1.85] mb-6">
          Thank you for taking time to share your experiences in support of local arts!
        </p>

        <div className="max-w-[600px] text-[1.05rem] text-[#1a1a1a] font-normal leading-[1.85] [&>p]:mb-[18px]">
          <p>
            Art Here is a community initiative to celebrate local artists and connect them to
            the residents, businesses, and organizations around them.
          </p>
          <p>
            The purpose of this survey is to understand how to better support the arts in
            Portland, OR. We&rsquo;ll share findings with the community and our
            partners.
          </p>
          <p>
            Whether you&rsquo;re an artist, a neighbor, or just curious, we&rsquo;d love to hear from you! The survey takes about 5&ndash;7 minutes, and everyone who completes it is eligible to win a $25 gift card to a local shop that supports Portland artists.
          </p>
        </div>

        <div className="max-w-[600px] mb-8">
          <p className="text-[13px] text-[#999] font-normal leading-[1.85]">
            By completing this survey, you agree to the use of your responses to support the arts
            and artists in Portland. Your data and quotes will not be tied to your name or personal information. You will have the option to respond completely
            anonymously if you choose not to share your email or participate in the raffle.
          </p>
        </div>

        <div className="flex flex-col gap-3 mb-8">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={purposeConfirmed}
              onChange={e => setPurposeConfirmed(e.target.checked)}
              className="mt-[3px] flex-shrink-0 w-4 h-4 rounded border-[#ccc] accent-[#1a1a1a] cursor-pointer"
            />
            <span className="text-[0.9rem] text-[#444] font-light leading-snug">
              I understand that this survey is intended to support local artists, and data will be used by Art Here and partners for that purpose. <span className="text-[#b91c1c]">*</span>
            </span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={privacyConfirmed}
              onChange={e => setPrivacyConfirmed(e.target.checked)}
              className="mt-[3px] flex-shrink-0 w-4 h-4 rounded border-[#ccc] accent-[#1a1a1a] cursor-pointer"
            />
            <span className="text-[0.9rem] text-[#444] font-light leading-snug">
              I understand that sharing my email is optional, and it will not be tied to my responses. <span className="text-[#b91c1c]">*</span>
            </span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={ageConfirmed}
              onChange={e => setAgeConfirmed(e.target.checked)}
              className="mt-[3px] flex-shrink-0 w-4 h-4 rounded border-[#ccc] accent-[#1a1a1a] cursor-pointer"
            />
            <span className="text-[0.9rem] text-[#444] font-light leading-snug">
              I am 18 years of age or older. <span className="text-[#b91c1c]">*</span>
            </span>
          </label>
        </div>

        <button
          type="button"
          onClick={() => { if (canStart) setStarted(true); }}
          disabled={!canStart}
          className="px-6 py-3 rounded-full bg-[#1a1a1a] text-white text-[0.9rem] font-medium transition-opacity hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          Start Survey
        </button>

        <p className="text-[0.75rem] text-[#aaa] font-light leading-[1.6] mt-8 max-w-[560px]">
          No purchase necessary. Open to US residents 18 and older. Raffles will be held after every 25 surveys received. Your entry stays in the pool for all future drawings. Winners receive a $25 gift card to a local business that supports Portland artists. Notified by email.
        </p>
      </div>
    );
  }

  return <SurveyForm onSubmitted={() => setSubmitted(true)} />;
}
