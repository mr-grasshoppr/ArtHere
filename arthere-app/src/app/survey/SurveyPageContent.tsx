'use client';

import { useState } from 'react';
import { SurveyForm } from '@/components/SurveyForm';
import styles from './page.module.css';

/**
 * Everything below the nav bar on /survey: the intro copy plus the form
 * itself. Once the form is submitted, this swaps to a simple thank-you
 * view instead (so the intro copy and raffle mention aren't left showing
 * alongside the "Thank you!" message).
 */
export function SurveyPageContent() {
  const [submitted, setSubmitted] = useState(false);
  const [onFirstStep, setOnFirstStep] = useState(true);

  if (submitted) {
    return (
      <div className="max-w-[640px] mx-auto px-5 sm:px-10 pt-14 sm:pt-20 pb-20 text-center">
        <div className={styles.logoMask}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/hero-painting.jpg" alt="" />
        </div>
        <h1 className="font-heading text-[clamp(2rem,5vw,2.8rem)] font-bold tracking-[-0.02em] leading-[1.15] mb-7 mt-8">
          Thank You!
        </h1>
        <p className="text-[1.05rem] text-[#555] font-light leading-[1.85] max-w-[440px] mx-auto mb-10">
          Your answers help us understand what Portland&rsquo;s creative community needs. We
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

  return (
    <>
      <div className="max-w-[640px] mx-auto px-5 sm:px-10 pt-14 sm:pt-20 pb-2">
        <div className={styles.logoMask}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/hero-painting.jpg" alt="" />
        </div>

        <div className="text-[0.7rem] font-semibold tracking-[0.14em] uppercase text-[#bbb] mb-4 mt-8">
          Art Here · Portland
        </div>
        <h1 className="font-heading text-[clamp(2rem,5vw,2.8rem)] font-bold tracking-[-0.02em] leading-[1.15] mb-7">
          PDX Community Survey
        </h1>

        {onFirstStep && (
          <>
            <div className="text-[1.05rem] text-[#555] font-light leading-[1.85] [&>p]:mb-[18px]">
              <p>
                Art Here is a community initiative to celebrate local artists and connect them to
                the residents, businesses, and organizations around them.
              </p>
              <p>
                The purpose of this survey is to understand how to better support the arts in
                Portland. We&rsquo;ll share findings publicly with the community and with our
                partners — and your answers may also help Art Here connect you with local
                opportunities. Whether you&rsquo;re an artist, a neighbor, or just curious,
                we&rsquo;d love to hear from you. Everyone who completes the survey is eligible
                to win a $25 gift card to a local shop that supports Portland artists.
              </p>
            </div>

            <div className="text-[1.05rem] text-[#555] font-light leading-[1.85] [&>p]:mb-[18px]">
              <p className="text-[0.88rem] text-[#666]">
                By completing this survey, you agree to the use of your responses to support the arts
                and artists in Portland. Any quotes or data shared with our partners will not be tied
                to your name or personal information. You will have the option to respond completely
                anonymously if you choose not to share your email or participate in the raffle.
              </p>
            </div>
          </>
        )}
      </div>

      <SurveyForm onSubmitted={() => setSubmitted(true)} onStepChange={setOnFirstStep} />
    </>
  );
}
