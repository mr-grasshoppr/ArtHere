"use client";

import { useState, useTransition } from "react";
import { INVOLVEMENT_FEATURED, INVOLVEMENT_VOLUNTEER, RAFFLE_YES } from "@/lib/survey-constants";
import { setResponseIsTest } from "./actions";

type SurveyResponse = {
  id: string;
  createdAt: Date;
  email: string | null;
  raffleOptIn: string | null;
  artistStatus: string | null;
  artistStatusOther: string | null;
  zipCode: string | null;
  neighborhoods: string | null;
  portlandFamiliarity: string | null;
  portlandWords: string[];
  portlandHelpers: string | null;
  mvFamiliarity: string | null;
  mvWords: string[];
  mvHelpers: string | null;
  multnomahDaysInvolvement: string[];
  practiceActivities: string[];
  practiceGoals: string[];
  practiceGoalsOther: string | null;
  practiceSupport: string | null;
  featuredArtistInterest: string | null;
  stayConnected: string[];
  involvementInterests: string[];
  involvementInterestsOther: string | null;
  completedAt: Date | null;
  connectionSuggestions: string | null;
  openFeedback: string | null;
  learnedAbout: string[];
  source: string | null;
  isTest: boolean;
};

// Legacy-aware accessors: pre-redesign responses stored involvement answers
// in stayConnected / featuredArtistInterest / multnomahDaysInvolvement.
function wantsToVolunteer(r: SurveyResponse) {
  return r.involvementInterests.includes(INVOLVEMENT_VOLUNTEER) || r.stayConnected.includes("Volunteer");
}
function wantsToBeFeatured(r: SurveyResponse) {
  return r.involvementInterests.includes(INVOLVEMENT_FEATURED) || !!r.featuredArtistInterest?.startsWith("Yes");
}
function isCompleted(r: SurveyResponse) {
  return r.completedAt != null || r.learnedAbout.length > 0 || !!r.openFeedback;
}

function Field({ label, value }: { label: string; value: string | string[] | null | undefined }) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  const display = Array.isArray(value) ? value.join(", ") : value;
  return (
    <div className="mb-2">
      <span className="text-xs text-[#999] uppercase tracking-wide mr-2">{label}</span>
      <span className="text-sm text-[#333]">{display}</span>
    </div>
  );
}

function Row({ r, onTestToggle }: { r: SurveyResponse; onTestToggle: (id: string, isTest: boolean) => void }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleMarkTest(e: React.MouseEvent) {
    e.stopPropagation();
    startTransition(async () => {
      await setResponseIsTest(r.id, !r.isTest);
      onTestToggle(r.id, !r.isTest);
    });
  }

  return (
    <>
      <tr
        id={r.id}
        className={`border-b border-[#f0f0f0] hover:bg-[#fafafa] cursor-pointer ${r.isTest ? "opacity-50" : ""}`}
        onClick={() => setOpen((o) => !o)}
      >
        <td className="px-4 py-3 text-sm text-[#999]">
          {new Date(r.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
          {!isCompleted(r) && (
            <span className="ml-2 text-[10px] uppercase tracking-wide bg-[#f0f0f0] text-[#999] px-1.5 py-0.5 rounded">draft</span>
          )}
          {r.isTest && (
            <span className="ml-2 text-[10px] uppercase tracking-wide bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">test</span>
          )}
        </td>
        <td className="px-4 py-3 text-sm font-medium">{r.email ?? <span className="text-[#bbb]">Anonymous</span>}</td>
        <td className="px-4 py-3 text-sm">{r.artistStatus ?? <span className="text-[#bbb]">—</span>}</td>
        <td className="px-4 py-3 text-sm">{r.neighborhoods ?? <span className="text-[#bbb]">—</span>}</td>
        <td className="px-4 py-3 text-sm">
          {wantsToBeFeatured(r)
            ? <span className="text-blue-700 font-medium">Yes</span>
            : <span className="text-[#bbb]">—</span>}
        </td>
        <td className="px-4 py-3 text-sm">
          {wantsToVolunteer(r)
            ? <span className="text-amber-700 font-medium">Yes</span>
            : <span className="text-[#bbb]">—</span>}
        </td>
        <td className="px-4 py-3 text-sm">{r.raffleOptIn ?? <span className="text-[#bbb]">—</span>}</td>
        <td className="px-4 py-3 text-[#bbb] text-xs">{open ? "▲" : "▼"}</td>
      </tr>
      {open && (
        <tr className="border-b border-[#f0f0f0] bg-[#f7f7f7]">
          <td colSpan={8} className="px-6 py-4">
            <div className="grid md:grid-cols-2 gap-x-10 gap-y-1">
              <div>
                <p className="text-xs font-semibold text-[#888] uppercase tracking-wide mb-2">About Portland</p>
                <Field label="Familiarity" value={r.portlandFamiliarity} />
                <Field label="Words" value={r.portlandWords} />
                <Field label="What helps" value={r.portlandHelpers} />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#888] uppercase tracking-wide mb-2">Multnomah Village</p>
                <Field label="Familiarity" value={r.mvFamiliarity} />
                <Field label="Words" value={r.mvWords} />
                <Field label="What helps" value={r.mvHelpers} />
                <Field label="Multnomah Days" value={r.multnomahDaysInvolvement} />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#888] uppercase tracking-wide mb-2">About You</p>
                <Field label="Status" value={r.artistStatus} />
                <Field label="Status (other)" value={r.artistStatusOther} />
                <Field label="Zip" value={r.zipCode} />
                <Field label="Neighborhoods" value={r.neighborhoods} />
                <Field label="Source" value={r.source} />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#888] uppercase tracking-wide mb-2">Your Practice</p>
                <Field label="Activities" value={r.practiceActivities} />
                <Field label="Goals" value={r.practiceGoals} />
                <Field label="Goals (other)" value={r.practiceGoalsOther} />
                <Field label="Support needed" value={r.practiceSupport} />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#888] uppercase tracking-wide mb-2">Get Involved</p>
                <Field label="Involvement" value={r.involvementInterests} />
                <Field label="Involvement (other)" value={r.involvementInterestsOther} />
                <Field label="Channels (legacy)" value={r.stayConnected} />
                <Field label="Featured (legacy)" value={r.featuredArtistInterest} />
                <Field label="Email" value={r.email} />
                <Field label="Raffle" value={r.raffleOptIn} />
                <Field label="Connections" value={r.connectionSuggestions} />
                <Field label="Feedback" value={r.openFeedback} />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#e5e5e5]">
              <button
                onClick={handleMarkTest}
                disabled={pending}
                className={`text-xs px-3 py-1.5 rounded border transition-colors ${
                  r.isTest
                    ? "border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100"
                    : "border-[#e5e5e5] text-[#888] hover:border-orange-300 hover:text-orange-700"
                }`}
              >
                {pending ? "Saving…" : r.isTest ? "Unmark as test" : "Mark as test"}
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function applyCategoryFilter(responses: SurveyResponse[], category: string): SurveyResponse[] {
  switch (category) {
    case "volunteer":
      return responses.filter(wantsToVolunteer);
    case "featured":
      return responses.filter(wantsToBeFeatured);
    case "raffle":
      return responses.filter((r) => r.raffleOptIn === RAFFLE_YES);
    default:
      return responses;
  }
}

function applyFieldFilter(
  responses: SurveyResponse[],
  field: string | undefined,
  value: string | undefined
): SurveyResponse[] {
  if (!field || !value) return responses;
  return responses.filter((r) => {
    const v = r[field as keyof SurveyResponse];
    if (Array.isArray(v)) return v.includes(value);
    if (field === "participate") {
      return (
        r.involvementInterests.includes(value) ||
        r.stayConnected.includes(value) ||
        r.multnomahDaysInvolvement.includes(value)
      );
    }
    return v === value;
  });
}

export default function SurveyTable({
  responses,
  initialFilter = "total",
  fieldFilter,
}: {
  responses: SurveyResponse[];
  initialFilter?: string;
  fieldFilter?: { field: string; value: string };
}) {
  const [textFilter, setTextFilter] = useState("");
  const [showTests, setShowTests] = useState(false);
  const [localIsTest, setLocalIsTest] = useState<Record<string, boolean>>({});

  function handleTestToggle(id: string, isTest: boolean) {
    setLocalIsTest((prev) => ({ ...prev, [id]: isTest }));
  }

  const responsesWithLocal = responses.map((r) => ({
    ...r,
    isTest: r.id in localIsTest ? localIsTest[r.id] : r.isTest,
  }));

  const visibleResponses = showTests
    ? responsesWithLocal
    : responsesWithLocal.filter((r) => !r.isTest);

  const categoryFiltered = applyCategoryFilter(visibleResponses, initialFilter);
  const fieldFiltered = applyFieldFilter(categoryFiltered, fieldFilter?.field, fieldFilter?.value);
  const filtered = textFilter
    ? fieldFiltered.filter(
        (r) =>
          r.email?.toLowerCase().includes(textFilter.toLowerCase()) ||
          r.artistStatus?.toLowerCase().includes(textFilter.toLowerCase()) ||
          r.zipCode?.includes(textFilter) ||
          r.neighborhoods?.toLowerCase().includes(textFilter.toLowerCase())
      )
    : fieldFiltered;

  const testCount = responsesWithLocal.filter((r) => r.isTest).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <input
          type="text"
          placeholder="Filter by email, status, zip…"
          value={textFilter}
          onChange={(e) => setTextFilter(e.target.value)}
          className="w-full max-w-sm px-4 py-2 border border-[#e5e5e5] rounded-lg text-sm bg-white focus:outline-none focus:border-[#999]"
        />
        <div className="flex items-center gap-3 flex-shrink-0">
          {testCount > 0 && (
            <button
              onClick={() => setShowTests((s) => !s)}
              className={`text-xs px-3 py-1.5 rounded border transition-colors ${
                showTests
                  ? "border-orange-300 bg-orange-50 text-orange-700"
                  : "border-[#e5e5e5] text-[#999] hover:border-[#ccc]"
              }`}
            >
              {showTests ? `Hide ${testCount} test${testCount !== 1 ? "s" : ""}` : `Show ${testCount} test${testCount !== 1 ? "s" : ""}`}
            </button>
          )}
          <span className="text-sm text-[#888]">{filtered.length} shown</span>
        </div>
      </div>
      <div className="bg-white border border-[#e5e5e5] rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-[#e5e5e5]">
            <tr className="text-xs uppercase tracking-wide text-[#999]">
              <th className="px-4 py-3 text-left font-medium">Date</th>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Neighborhood</th>
              <th className="px-4 py-3 text-left font-medium">Featured?</th>
              <th className="px-4 py-3 text-left font-medium">Volunteer</th>
              <th className="px-4 py-3 text-left font-medium">Raffle</th>
              <th className="px-4 py-3 text-left font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-[#bbb]">
                  No responses found.
                </td>
              </tr>
            )}
            {filtered.map((r) => (
              <Row key={r.id} r={r} onTestToggle={handleTestToggle} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
