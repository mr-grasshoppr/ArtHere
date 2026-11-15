'use client';

import { useState } from 'react';

// The note a place can pass to affiliated artists who aren't on Art Here yet.
// Shared by copy-and-paste from the place's own email or social accounts —
// nothing is sent through the site.
export const PLACE_INVITE_BLURB = `We’re officially on Art Here as a featured supporter of local artists! Art Here showcases our local arts scene through maps, stories, and an interactive network graph. When you join, our profiles will automatically link up and connect on the network graph to show off our community. It takes two minutes to set up, and you can update it anytime. Request your invite at artishere.org/get-featured!`;

export function PlaceInviteBlurb() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(PLACE_INVITE_BLURB);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Couldn't copy automatically — select the blurb and copy it manually.");
    }
  }

  return (
    <div className="mt-8">
      <p className="text-[0.85rem] text-[#555] mb-3 max-w-[620px]">
        Would you like to invite other affiliated artists to join Art Here? We&rsquo;d love for them to join! Here&rsquo;s a
        blurb you could share with them:
      </p>
      <div className="rounded-lg bg-[#f7f6f3] border border-[#eceae4] px-4 py-3 text-[0.85rem] text-[#444] leading-relaxed max-w-[620px]">
        {PLACE_INVITE_BLURB}
      </div>
      <button
        type="button"
        onClick={copy}
        className="mt-3 px-4 py-2 rounded-full border border-[#ccc] text-[0.8rem] text-[#555] hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-colors"
      >
        {copied ? 'Copied ✓' : 'Copy blurb'}
      </button>
    </div>
  );
}
