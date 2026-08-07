"use client";

import { useState } from "react";

/**
 * Interstitial shown before an admin-triggered invite email actually goes
 * out. Lets the admin see the exact subject/message that will be sent, edit
 * either one, or skip sending entirely and just copy the one-time login link
 * to send some other way (text, Slack, in person, etc).
 */
export function InvitePreviewModal({
  email,
  link,
  greetingName,
  initialSubject,
  initialBodyText,
  onSend,
  onClose,
}: {
  email: string;
  link: string;
  /** Name shown in the "Hi ___," greeting — same value the actual email uses. Null/blank shows as "there". */
  greetingName?: string | null;
  initialSubject: string;
  initialBodyText: string;
  onSend: (subject: string, bodyText: string) => Promise<void>;
  onClose: () => void;
}) {
  const [subject, setSubject] = useState(initialSubject);
  const [bodyText, setBodyText] = useState(initialBodyText);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't copy — select and copy the link manually.");
    }
  }

  async function handleSend() {
    setSending(true);
    setError("");
    try {
      await onSend(subject, bodyText);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
    }
    setSending(false);
  }

  return (
    <div
      className="fixed inset-0 z-[300] bg-black/60 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl w-full max-w-[560px] max-h-[90vh] overflow-y-auto shadow-xl p-6">
        {sent ? (
          <>
            <h3 className="text-base font-medium text-[#1a1a1a] mb-2">Sent</h3>
            <p className="text-sm text-[#666] mb-5">The invite email was sent to {email}.</p>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-full bg-[#1a1a1a] text-white text-sm hover:opacity-80 transition-opacity"
            >
              Done
            </button>
          </>
        ) : (
          <>
            <h3 className="text-base font-medium text-[#1a1a1a] mb-1">Preview invite</h3>
            <p className="text-xs text-[#999] mb-5">To: {email}</p>

            <div className="mb-4">
              <label className="block text-xs text-[#888] uppercase tracking-wide mb-1.5">One-time login link</label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={link}
                  onFocus={(e) => e.target.select()}
                  className="flex-1 min-w-0 px-3 py-2 border border-[#e5e5e5] rounded-lg bg-[#fafafa] text-[#666] text-xs font-mono focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="shrink-0 px-3 py-2 border border-[#e5e5e5] rounded-lg text-xs text-[#555] hover:border-[#999] transition-colors"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <p className="text-[0.7rem] text-[#bbb] mt-1.5">Works once, expires in 48 hours. Send this yourself instead of emailing, if you&rsquo;d rather.</p>
            </div>

            <div className="mb-4">
              <label className="block text-xs text-[#888] uppercase tracking-wide mb-1.5">Subject</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:outline-none focus:border-[#999]"
              />
            </div>

            <div className="mb-5">
              <label className="block text-xs text-[#888] uppercase tracking-wide mb-1.5">Message</label>
              <p className="text-sm text-[#1a1a1a] mb-2">Hi {greetingName?.trim() || "there"},</p>
              <textarea
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:outline-none focus:border-[#999] resize-y"
              />
              <p className="text-[0.7rem] text-[#bbb] mt-1.5">The greeting above isn&rsquo;t editable. The logo, sign-in button, and footer stay the same.</p>
            </div>

            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSend}
                disabled={sending || !subject.trim() || !bodyText.trim()}
                className="px-5 py-2 rounded-full bg-[#1a1a1a] text-white text-sm hover:opacity-80 transition-opacity disabled:opacity-40"
              >
                {sending ? "Sending…" : "Send email"}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={sending}
                className="px-5 py-2 rounded-full border border-[#e5e5e5] text-sm text-[#666] hover:border-[#999] transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
