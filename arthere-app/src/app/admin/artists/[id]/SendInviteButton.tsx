'use client';

import { useState } from 'react';
import { previewArtistInvite, sendArtistInvite } from './actions';
import { InvitePreviewModal } from '@/components/admin/InvitePreviewModal';
import type { InvitePreview } from '@/lib/magic-link';

export function SendInviteButton({ artistId, email }: { artistId: string; email: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'error' | 'sent'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [wasSent, setWasSent] = useState(false);

  async function handleClick() {
    setState('loading');
    setErrorMsg('');
    try {
      setPreview(await previewArtistInvite(artistId));
      setState('idle');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setState('error');
    }
  }

  if (state === 'sent') {
    return (
      <p className="text-xs text-green-600">
        ✓ Invite sent to {email}
      </p>
    );
  }

  if (state === 'error') {
    return (
      <div className="text-xs text-red-500 space-y-1">
        <p>Failed to send: {errorMsg || 'unknown error'}</p>
        <button onClick={() => { setState('idle'); setErrorMsg(''); }} className="underline">try again</button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={state === 'loading'}
        className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-[#1a1a1a] text-white text-xs font-medium hover:opacity-80 transition-opacity disabled:opacity-40"
      >
        {state === 'loading' ? 'Preparing…' : 'Send profile invite ↗'}
      </button>

      {preview && (
        <InvitePreviewModal
          email={preview.email}
          link={preview.link}
          initialSubject={preview.subject}
          initialBodyText={preview.bodyText}
          onClose={() => {
            setPreview(null);
            if (wasSent) setState('sent');
          }}
          onSend={async (subject, bodyText) => {
            await sendArtistInvite(artistId, { email: preview.email, link: preview.link, subject, bodyText });
            setWasSent(true);
          }}
        />
      )}
    </>
  );
}
