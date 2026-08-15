'use client';

import { useEffect, useState } from 'react';

interface TeamMember {
  userId: string;
  email: string;
  role: 'owner' | 'member';
}

const LABEL = 'block text-[0.7rem] font-semibold text-[#aaa] mb-2 uppercase tracking-widest';
const FIELD = 'flex-1 px-4 py-3 rounded-lg border border-[#e8e8e8] text-[0.95rem] text-[#1a1a1a] placeholder-[#ccc] focus:outline-none focus:border-[#1a1a1a] transition-colors bg-white';
const BTN = 'px-5 py-3 rounded-full bg-[#1a1a1a] text-white text-[0.88rem] font-medium transition-opacity hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap';

/**
 * Lets any current editor (owner or teammate) see who has edit access to
 * this org's page, invite another teammate by email, or remove someone
 * (the owner can't be removed here). Backed by /api/place/team.
 */
export function PlaceTeamManager() {
  const [team, setTeam] = useState<TeamMember[] | null>(null);
  const [email, setEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [invited, setInvited] = useState('');

  async function loadTeam() {
    try {
      const res = await fetch('/api/place/team');
      if (!res.ok) throw new Error();
      const data: { team: TeamMember[] } = await res.json();
      setTeam(data.team);
    } catch {
      setError("Couldn't load your team.");
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTeam();
  }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    const clean = email.trim();
    if (!clean) return;
    setInviting(true);
    setError('');
    setInvited('');
    try {
      const res = await fetch('/api/place/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: clean }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? 'Invite failed');
      setEmail('');
      setInvited(clean);
      await loadTeam();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invite failed');
    }
    setInviting(false);
  }

  async function handleRemove(userId: string) {
    setRemovingId(userId);
    setError('');
    try {
      const res = await fetch('/api/place/team', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? 'Remove failed');
      await loadTeam();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Remove failed');
    }
    setRemovingId(null);
  }

  return (
    <div>
      <div className={LABEL}>Team</div>
      <p className="text-[0.8rem] text-[#999] font-light mb-4">
        Anyone here can edit this page. Invite a teammate by email — they&rsquo;ll get a sign-in link, no password needed.
      </p>

      {team === null ? (
        <p className="text-[0.85rem] text-[#bbb]">Loading…</p>
      ) : (
        <div className="flex flex-col gap-2 mb-4">
          {team.map((m) => (
            <div key={m.userId} className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg border border-[#f0f0f0] bg-[#fafafa]">
              <div className="flex items-baseline gap-2 min-w-0">
                <span className="text-[0.88rem] text-[#1a1a1a] truncate">{m.email}</span>
                <span className="text-[0.68rem] text-[#bbb] uppercase tracking-wide flex-shrink-0">{m.role}</span>
              </div>
              {m.role === 'member' && (
                <button
                  type="button"
                  onClick={() => handleRemove(m.userId)}
                  disabled={removingId === m.userId}
                  className="text-[0.8rem] text-[#bbb] hover:text-red-500 transition-colors disabled:opacity-40 flex-shrink-0"
                >
                  {removingId === m.userId ? 'Removing…' : 'Remove'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleInvite} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="teammate@email.com"
          className={FIELD}
        />
        <button type="submit" disabled={inviting || !email.trim()} className={BTN}>
          {inviting ? 'Inviting…' : 'Invite'}
        </button>
      </form>
      {invited && <p className="text-[0.8rem] text-green-600 mt-2">Invite sent to {invited}.</p>}
      {error && <p className="text-[0.8rem] text-red-500 mt-2">{error}</p>}
    </div>
  );
}
