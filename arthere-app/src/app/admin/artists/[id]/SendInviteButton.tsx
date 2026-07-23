'use client';

import { useState } from 'react';
import { sendArtistInvite } from './actions';

export function SendInviteButton({ artistId, email }: { artistId: string; email: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');

  async function handleClick() {
    setState('sending');
    try {
      await sendArtistInvite(artistId);
      setState('sent');
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
    <button
      onClick={handleClick}
      disabled={state === 'sending'}
      className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-[#1a1a1a] text-white text-xs font-medium hover:opacity-80 transition-opacity disabled:opacity-40"
    >
      {state === 'sending' ? 'Sending…' : 'Send profile invite ↗'}
    </button>
  );
}
