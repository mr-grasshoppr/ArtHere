"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendOutreach, type SendResult } from "./actions";
import type { Contact } from "@/lib/contact-tracking";

const PILL =
  "px-3 py-1.5 rounded-full border text-xs transition-colors whitespace-nowrap";
const pillCls = (active: boolean) =>
  `${PILL} ${active ? "bg-[#1a1a1a] text-white border-[#1a1a1a]" : "border-[#e5e5e5] text-[#888] hover:border-[#999]"}`;

const SOURCE_STYLE: Record<string, string> = {
  survey: "bg-[#00ae7a]/10 text-[#00805a]",
  "contact form": "bg-[#f062a4]/10 text-[#a84573]",
  newsletter: "bg-[#f3f3f0] text-[#777]",
};

function fmt(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function ContactTracker({
  contacts,
  interestTags,
}: {
  contacts: Contact[];
  interestTags: string[];
}) {
  const router = useRouter();
  const [interestFilter, setInterestFilter] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  // Only tags someone actually has — an empty filter is just a dead end.
  const usedTags = useMemo(() => {
    const used = new Set(contacts.flatMap((c) => c.interests));
    return interestTags.filter((t) => used.has(t));
  }, [contacts, interestTags]);

  const visible = useMemo(
    () => (interestFilter ? contacts.filter((c) => c.interests.includes(interestFilter)) : contacts),
    [contacts, interestFilter]
  );

  // Selection survives a filter change on purpose — picking a few Partner
  // contacts, switching to Featured, and adding a few more is a normal way to
  // build a list. The confirm step always shows the full set before sending.
  const selectedContacts = useMemo(
    () => contacts.filter((c) => selected.has(c.email)),
    [contacts, selected]
  );

  const allVisibleSelected = visible.length > 0 && visible.every((c) => selected.has(c.email));

  function toggle(email: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  }

  function toggleAllVisible() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) visible.forEach((c) => next.delete(c.email));
      else visible.forEach((c) => next.add(c.email));
      return next;
    });
  }

  function send() {
    setError("");
    startTransition(async () => {
      try {
        const res = await sendOutreach(selectedContacts.map((c) => c.email), subject, body);
        setResult(res);
        setConfirming(false);
        setComposing(false);
        setSelected(new Set());
        setSubject("");
        setBody("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Send failed");
        setConfirming(false);
      }
    });
  }

  return (
    <div>
      {result && (
        <div className="mb-6 rounded-lg border border-[#00ae7a]/30 bg-[#00ae7a]/5 px-4 py-3 text-sm">
          <span className="text-[#00805a] font-medium">
            Sent to {result.sent} {result.sent === 1 ? "person" : "people"}.
          </span>
          {result.failed.length > 0 && (
            <span className="text-red-600">
              {" "}
              {result.failed.length} failed: {result.failed.map((f) => `${f.email} (${f.error})`).join("; ")}
            </span>
          )}
          <button onClick={() => setResult(null)} className="ml-3 text-[#999] underline text-xs">
            Dismiss
          </button>
        </div>
      )}

      <div className="mb-5 flex items-center gap-2 flex-wrap">
        <button className={pillCls(!interestFilter)} onClick={() => setInterestFilter(null)}>
          All ({contacts.length})
        </button>
        {usedTags.map((tag) => (
          <button
            key={tag}
            className={pillCls(interestFilter === tag)}
            onClick={() => setInterestFilter(interestFilter === tag ? null : tag)}
          >
            {tag} ({contacts.filter((c) => c.interests.includes(tag)).length})
          </button>
        ))}
        <a
          href="/api/admin/export/contacts"
          className="ml-auto text-xs px-3 py-1.5 rounded-full border border-[#e5e5e5] text-[#666] hover:border-[#999] transition-colors"
        >
          Export CSV
        </a>
      </div>

      <div className="mb-3 flex items-center gap-3">
        <button onClick={toggleAllVisible} className="text-xs text-[#888] hover:text-[#1a1a1a] underline">
          {allVisibleSelected ? "Clear these" : `Select all ${visible.length} shown`}
        </button>
        {selected.size > 0 && (
          <>
            <span className="text-xs text-[#888]">{selected.size} selected</span>
            <button onClick={() => setSelected(new Set())} className="text-xs text-[#bbb] underline">
              clear
            </button>
            <button
              onClick={() => setComposing(true)}
              className="ml-auto text-sm px-4 py-2 rounded-full bg-[#1a1a1a] text-white hover:opacity-80"
            >
              Write message to {selected.size}
            </button>
          </>
        )}
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="bg-white border border-[#e5e5e5] rounded-lg divide-y divide-[#f0f0f0]">
        {visible.length === 0 && <p className="px-5 py-6 text-sm text-[#999]">Nobody matches this filter.</p>}
        {visible.map((c) => (
          <div key={c.email} className="px-4 py-3">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selected.has(c.email)}
                onChange={() => toggle(c.email)}
                className="mt-1 w-4 h-4 accent-[#1a1a1a] cursor-pointer flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  {c.name && <span className="font-medium text-[0.92rem]">{c.name}</span>}
                  <a href={`mailto:${c.email}`} className="text-[0.85rem] text-[#666] underline underline-offset-2 decoration-[#ddd]">
                    {c.email}
                  </a>
                  {c.interests.map((i) => (
                    <span key={i} className="text-[0.7rem] bg-[#1a1a1a]/[0.06] text-[#555] px-2 py-0.5 rounded-full">
                      {i}
                    </span>
                  ))}
                  <span className="ml-auto text-[0.7rem] text-[#bbb]">{fmt(c.lastSeen)}</span>
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-2 text-[0.7rem]">
                  {c.sources.map((s) => (
                    <span key={s} className={`px-2 py-0.5 rounded-full ${SOURCE_STYLE[s] ?? "bg-[#f3f3f0] text-[#777]"}`}>
                      {s}
                    </span>
                  ))}
                  {c.outreach.length > 0 && (
                    <span className="text-[#00805a]">
                      messaged {c.outreach.length}×, last {fmt(c.outreach[0].at)}
                    </span>
                  )}
                  {c.possibleDuplicateOf.length > 0 && (
                    <span className="text-[#a84573]" title={c.possibleDuplicateOf.join(", ")}>
                      same name as {c.possibleDuplicateOf.join(", ")}
                    </span>
                  )}
                  <button
                    onClick={() => setExpanded(expanded === c.email ? null : c.email)}
                    className="text-[#999] underline"
                  >
                    {expanded === c.email ? "hide" : "history"}
                  </button>
                </div>

                {expanded === c.email && (
                  <div className="mt-3 pl-3 border-l-2 border-[#f0f0f0] space-y-3">
                    {c.touches.map((t, i) => (
                      <div key={i} className="text-[0.78rem]">
                        <span className="text-[#888]">
                          {fmt(t.at)} · {t.source}
                          {t.interests.length > 0 && ` · ${t.interests.join(", ")}`}
                        </span>
                        {t.message && (
                          <p className="text-[#555] whitespace-pre-wrap mt-0.5 leading-[1.6]">{t.message}</p>
                        )}
                      </div>
                    ))}
                    {c.outreach.map((o) => (
                      <div key={o.id} className="text-[0.78rem]">
                        <span className={o.status === "sent" ? "text-[#00805a]" : "text-red-600"}>
                          {fmt(o.at)} · you sent “{o.subject}”
                          {o.status !== "sent" && ` · FAILED: ${o.error}`}
                        </span>
                        <p className="text-[#555] whitespace-pre-wrap mt-0.5 leading-[1.6]">{o.body}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {composing && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-start justify-center p-6 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-[640px] p-6 my-8">
            <h2 className="text-lg font-medium mb-1">
              Message {selectedContacts.length} {selectedContacts.length === 1 ? "person" : "people"}
            </h2>
            <p className="text-xs text-[#888] mb-4">
              Sent individually from hello@artishere.org in the Art Here template, BCC&rsquo;d to you.
              Nobody sees anyone else&rsquo;s address.
            </p>

            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              className="w-full px-3 py-2 mb-3 border border-[#e5e5e5] rounded text-sm"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              placeholder="Write your message. Leave a blank line between paragraphs."
              className="w-full px-3 py-2 border border-[#e5e5e5] rounded text-sm leading-[1.6] resize-y"
            />

            <details className="mt-3">
              <summary className="text-xs text-[#888] cursor-pointer">
                Recipients ({selectedContacts.length})
              </summary>
              <p className="text-xs text-[#666] mt-2 leading-[1.7]">
                {selectedContacts.map((c) => c.name ?? c.email).join(", ")}
              </p>
            </details>

            <div className="flex items-center gap-3 mt-5">
              <button
                onClick={() => { setComposing(false); setConfirming(false); }}
                className="text-sm text-[#888] hover:text-[#1a1a1a]"
              >
                Cancel
              </button>
              <div className="ml-auto flex items-center gap-3">
                {confirming ? (
                  <>
                    <span className="text-xs text-[#a84573]">
                      This sends {selectedContacts.length} real{" "}
                      {selectedContacts.length === 1 ? "email" : "emails"}.
                    </span>
                    <button onClick={() => setConfirming(false)} className="text-sm text-[#888]">
                      Back
                    </button>
                    <button
                      onClick={send}
                      disabled={pending}
                      className="text-sm px-5 py-2 rounded-full bg-[#a84573] text-white hover:opacity-80 disabled:opacity-40"
                    >
                      {pending ? "Sending…" : `Yes, send ${selectedContacts.length}`}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirming(true)}
                    disabled={!subject.trim() || !body.trim()}
                    className="text-sm px-5 py-2 rounded-full bg-[#1a1a1a] text-white hover:opacity-80 disabled:opacity-30"
                  >
                    Review &amp; send
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
