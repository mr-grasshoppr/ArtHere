"use client";

import { useState } from "react";
import { ARTIST_INVITE_TEMPLATES } from "@/lib/invite-templates";

/**
 * Interstitial shown before an admin-triggered invite email actually goes
 * out. Lets the admin see the exact subject/message that will be sent, edit
 * either one, or skip sending entirely and just copy the one-time login link
 * to send some other way (text, Slack, in person, etc).
 */
export function InvitePreviewModal({
  email,
  link,
  initialGreetingName,
  initialSubject,
  initialBodyText,
  onSend,
  onCaptureScreenshot,
  onClose,
  showArtistTemplates = false,
  linkLabel = "One-time login link",
  linkNote = "Works once, expires in 48 hours. Send this yourself instead of emailing, if you\u2019d rather.",
  title = "Preview invite",
  buttonNote = "The logo, sign-in button, and footer stay the same.",
}: {
  email: string;
  link: string;
  /** Starting value for the editable "Hi ___," greeting. Null/blank shows as "there". */
  initialGreetingName?: string | null;
  initialSubject: string;
  initialBodyText: string;
  onSend: (subject: string, bodyText: string, greetingName: string | null, screenshotUrl: string | null) => Promise<void>;
  /** When provided, offers a "send screenshot of their current page" option; resolves to the stored image URL. */
  onCaptureScreenshot?: () => Promise<string>;
  onClose: () => void;
  /** Offer the artist message presets (draft profile / from scratch) above the message box. */
  showArtistTemplates?: boolean;
  linkLabel?: string;
  linkNote?: string;
  title?: string;
  buttonNote?: string;
}) {
  const [greetingName, setGreetingName] = useState(initialGreetingName?.trim() ?? "");
  const [subject, setSubject] = useState(initialSubject);
  const [bodyText, setBodyText] = useState(initialBodyText);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [includeShot, setIncludeShot] = useState(false);
  const [shotUrl, setShotUrl] = useState<string | null>(null);
  const [shotLoading, setShotLoading] = useState(false);
  const [shotError, setShotError] = useState("");

  async function captureShot() {
    if (!onCaptureScreenshot) return;
    setShotLoading(true);
    setShotError("");
    try {
      setShotUrl(await onCaptureScreenshot());
    } catch (err) {
      setShotError(err instanceof Error ? err.message : "Couldn't capture the page");
      setIncludeShot(false);
    }
    setShotLoading(false);
  }

  function toggleShot(on: boolean) {
    setIncludeShot(on);
    if (on && !shotUrl) void captureShot();
  }

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
      await onSend(subject, bodyText, greetingName.trim() || null, includeShot ? shotUrl : null);
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
            <p className="text-sm text-[#666] mb-5">The email was sent to {email}.</p>
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
            <h3 className="text-base font-medium text-[#1a1a1a] mb-1">{title}</h3>
            <p className="text-xs text-[#999] mb-5">To: {email}</p>

            <div className="mb-4">
              <label className="block text-xs text-[#888] uppercase tracking-wide mb-1.5">{linkLabel}</label>
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
              <p className="text-[0.7rem] text-[#bbb] mt-1.5">{linkNote}</p>
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
              <div className="flex items-baseline gap-1.5 mb-2">
                <span className="text-sm text-[#1a1a1a]">Hi</span>
                <input
                  value={greetingName}
                  onChange={(e) => setGreetingName(e.target.value)}
                  placeholder="there"
                  className="w-32 px-1.5 py-0.5 border-b border-[#e5e5e5] text-sm text-[#1a1a1a] bg-transparent focus:outline-none focus:border-[#999]"
                />
                <span className="text-sm text-[#1a1a1a]">,</span>
              </div>
              {showArtistTemplates && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-[#888]">Use template:</span>
                  {ARTIST_INVITE_TEMPLATES.map((t) => (
                    <button
                      key={t.label}
                      type="button"
                      onClick={() => setBodyText(t.bodyText)}
                      className={`px-3 py-1 rounded-full border text-xs transition-colors ${
                        bodyText === t.bodyText ? "border-[#1a1a1a] text-[#1a1a1a]" : "border-[#e5e5e5] text-[#666] hover:border-[#999]"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}
              <textarea
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:outline-none focus:border-[#999] resize-y"
              />
              <p className="text-[0.7rem] text-[#bbb] mt-1.5">Use a nickname or preferred name if that&rsquo;s not what they go by. {buttonNote}</p>
            </div>

            {onCaptureScreenshot && (
              <div className="mb-5">
                <label className="flex items-center gap-2 text-sm text-[#1a1a1a] cursor-pointer">
                  <input type="checkbox" checked={includeShot} onChange={(e) => toggleShot(e.target.checked)} />
                  Send screenshot of their current page
                </label>
                {shotLoading && <p className="text-xs text-[#999] mt-2">Capturing the page… (about 10 seconds)</p>}
                {shotError && <p className="text-xs text-red-500 mt-2">{shotError}</p>}
                {includeShot && shotUrl && !shotLoading && (
                  <div className="mt-2">
                    <p className="text-[0.7rem] text-[#bbb] mb-1.5">Preview &mdash; this image appears above the button in the email.</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={shotUrl} alt="Screenshot preview" className="w-full rounded-lg border border-[#e5e5e5]" />
                    <button type="button" onClick={captureShot} className="mt-1.5 text-xs text-[#666] underline hover:text-[#1a1a1a]">
                      Retake (after editing the page)
                    </button>
                  </div>
                )}
              </div>
            )}

            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSend}
                disabled={sending || shotLoading || !subject.trim() || !bodyText.trim() || (includeShot && !shotUrl)}
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
