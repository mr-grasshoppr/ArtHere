'use client';

import { useState } from 'react';
import { INVITE_SUBJECT, inviteMailto, inviteMessage } from '@/lib/place-invite-message';

/**
 * Ready-made invitation for artists a place lists who aren't on Art Here yet.
 * The place sends it from their own email; nothing goes out through the site.
 */
export function PlaceInviteArtists({
  placeName,
  placeSlug,
  baseUrl,
  fieldClassName,
}: {
  placeName: string;
  placeSlug: string;
  baseUrl: string;
  fieldClassName: string;
}) {
  const [artistName, setArtistName] = useState('');
  // null until the place edits the text, so the draft keeps following the name box.
  const [edited, setEdited] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generated = inviteMessage({ placeName, artistName, baseUrl, placeSlug });
  const body = edited ?? generated;

  async function copy() {
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Couldn't copy automatically — select the message and copy it manually.");
    }
  }

  return (
    <div>
      <p className="text-[0.8rem] text-[#999] mb-4 max-w-[560px]">
        Want an artist you listed to have their own profile? Send them this invitation from your own email. Their name is
        optional — leave it blank to fill in later.
      </p>
      <input
        value={artistName}
        onChange={e => { setArtistName(e.target.value); setEdited(null); }}
        placeholder="Artist's name (optional)"
        maxLength={120}
        className={`${fieldClassName} mb-3`}
      />
      <div className="text-[0.72rem] text-[#aaa] mb-1">Subject: {INVITE_SUBJECT}</div>
      <textarea
        value={body}
        onChange={e => setEdited(e.target.value)}
        rows={14}
        className={`${fieldClassName} resize-y text-[0.85rem] leading-relaxed`}
      />
      <div className="flex flex-wrap items-center gap-3 mt-3">
        <button
          type="button"
          onClick={copy}
          className="px-5 py-2 rounded-full bg-[#1a1a1a] text-white text-[0.85rem] font-medium hover:opacity-80 transition-opacity cursor-pointer"
        >
          {copied ? 'Copied!' : 'Copy message'}
        </button>
        <a
          href={inviteMailto(INVITE_SUBJECT, body)}
          className="px-5 py-2 rounded-full border border-[#ddd] text-[#555] text-[0.85rem] hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-colors"
        >
          Open in my email app
        </a>
        {edited !== null && (
          <button type="button" onClick={() => setEdited(null)} className="text-[0.78rem] text-[#aaa] hover:text-[#1a1a1a] cursor-pointer">
            Reset to original
          </button>
        )}
      </div>
    </div>
  );
}
