import { prisma } from "@/lib/db";
import {
  INVOLVEMENT_FEATURED,
  INVOLVEMENT_NEWS,
  INVOLVEMENT_PARTNER,
  INVOLVEMENT_VOLUNTEER,
  INVOLVEMENT_PARADE,
  INVOLVEMENT_OTHER,
} from "@/lib/survey-constants";

// Interest is expressed through two unrelated doors — the survey's "Get
// involved" checkboxes and the website contact form's ?type= intent — using
// different wording for the same thing. These are the canonical tags both get
// mapped onto, so the admin can filter for "everyone interested in being
// featured" without caring which door they came through.

export const INTEREST_FEATURED = "Featured";
export const INTEREST_PARTNER = "Partner";
export const INTEREST_BRING = "Bring Art Here";
export const INTEREST_INVITE = "Request invite";
export const INTEREST_NEWS = "News";
export const INTEREST_VOLUNTEER = "Volunteer";
export const INTEREST_PARADE = "Parade (past)";
export const INTEREST_OTHER = "Other";

/** Display order for filters and columns; also the canonical tag list. */
export const INTEREST_TAGS = [
  INTEREST_FEATURED,
  INTEREST_PARTNER,
  INTEREST_BRING,
  INTEREST_INVITE,
  INTEREST_VOLUNTEER,
  INTEREST_NEWS,
  INTEREST_OTHER,
  INTEREST_PARADE,
];

const SURVEY_INTEREST: Record<string, string> = {
  [INVOLVEMENT_FEATURED]: INTEREST_FEATURED,
  [INVOLVEMENT_PARTNER]: INTEREST_PARTNER,
  [INVOLVEMENT_NEWS]: INTEREST_NEWS,
  [INVOLVEMENT_VOLUNTEER]: INTEREST_VOLUNTEER,
  [INVOLVEMENT_PARADE]: INTEREST_PARADE,
  [INVOLVEMENT_OTHER]: INTEREST_OTHER,
};

const CONTACT_INTENT_INTEREST: Record<string, string> = {
  featured: INTEREST_FEATURED,
  partner: INTEREST_PARTNER,
  bring: INTEREST_BRING,
  invite: INTEREST_INVITE,
};

export type ContactSource = "survey" | "contact form" | "newsletter";

export interface ContactTouch {
  source: ContactSource;
  at: string;
  /** The contact form's free-text message; absent for the other sources. */
  message?: string | null;
  interests: string[];
}

export interface OutreachRecord {
  id: string;
  subject: string;
  body: string;
  at: string;
  status: string;
  error: string | null;
}

export interface Contact {
  /** Lowercased — the only join key available across the three sources. */
  email: string;
  /** Best name seen for this address; the survey doesn't collect one. */
  name: string | null;
  interests: string[];
  sources: ContactSource[];
  touches: ContactTouch[];
  firstSeen: string;
  lastSeen: string;
  outreach: OutreachRecord[];
  /** Other addresses whose name matches this one — a possible duplicate person. */
  possibleDuplicateOf: string[];
}

function normalizeEmail(value: string | null | undefined): string | null {
  const v = (value ?? "").trim().toLowerCase();
  return v.includes("@") ? v : null;
}

/**
 * One row per email address, merging survey involvement answers, website
 * contact-form submissions, newsletter signups, and any outreach already sent.
 *
 * Purely derived — nothing here writes to SurveyResponse or
 * ContactSubmission, so the Survey and Contacts tabs are unaffected and this
 * view can be removed without touching the underlying data.
 */
export async function getContacts(): Promise<Contact[]> {
  const [surveys, submissions, signups, outreach] = await Promise.all([
    // Test rows are excluded to match what the Survey tab reports; archived
    // rows are NOT, since archiving there means "out of the way", not "not a
    // real person", and these are real people to contact.
    prisma.surveyResponse.findMany({
      where: { completedAt: { not: null }, isTest: false, email: { not: null } },
      select: {
        email: true,
        createdAt: true,
        involvementInterests: true,
        involvementInterestsOther: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.contactSubmission.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.newsletterSignup.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.outreachRecipient.findMany({
      include: { message: true },
      orderBy: { message: { createdAt: "desc" } },
    }),
  ]);

  const byEmail = new Map<string, Contact>();

  function contactFor(email: string): Contact {
    let c = byEmail.get(email);
    if (!c) {
      c = {
        email,
        name: null,
        interests: [],
        sources: [],
        touches: [],
        firstSeen: "",
        lastSeen: "",
        outreach: [],
        possibleDuplicateOf: [],
      };
      byEmail.set(email, c);
    }
    return c;
  }

  function addTouch(email: string, touch: ContactTouch, name?: string | null) {
    const c = contactFor(email);
    c.touches.push(touch);
    if (!c.sources.includes(touch.source)) c.sources.push(touch.source);
    for (const i of touch.interests) if (!c.interests.includes(i)) c.interests.push(i);
    // The contact form collects a name, the survey doesn't — so the first
    // real name wins rather than the most recent touch.
    if (!c.name && name?.trim()) c.name = name.trim();
  }

  for (const s of surveys) {
    const email = normalizeEmail(s.email);
    if (!email) continue;
    const interests = s.involvementInterests
      .map((i) => SURVEY_INTEREST[i])
      .filter((i): i is string => !!i);
    addTouch(email, {
      source: "survey",
      at: s.createdAt.toISOString(),
      message: s.involvementInterestsOther?.trim() || null,
      interests,
    });
  }

  for (const s of submissions) {
    const email = normalizeEmail(s.email);
    if (!email) continue;
    const mapped = s.intent ? CONTACT_INTENT_INTEREST[s.intent] : undefined;
    addTouch(
      email,
      {
        source: "contact form",
        at: s.createdAt.toISOString(),
        message: s.message,
        interests: mapped ? [mapped] : [],
      },
      s.name
    );
  }

  for (const s of signups) {
    const email = normalizeEmail(s.email);
    if (!email) continue;
    addTouch(email, {
      source: "newsletter",
      at: s.createdAt.toISOString(),
      interests: [INTEREST_NEWS],
    });
  }

  for (const r of outreach) {
    const email = normalizeEmail(r.email);
    if (!email || !byEmail.has(email)) continue;
    contactFor(email).outreach.push({
      id: r.message.id,
      subject: r.message.subject,
      body: r.message.body,
      at: (r.sentAt ?? r.message.createdAt).toISOString(),
      status: r.status,
      error: r.error,
    });
  }

  const contacts = [...byEmail.values()];

  for (const c of contacts) {
    c.touches.sort((a, b) => a.at.localeCompare(b.at));
    c.firstSeen = c.touches[0]?.at ?? "";
    c.lastSeen = c.touches[c.touches.length - 1]?.at ?? "";
    c.interests.sort((a, b) => INTEREST_TAGS.indexOf(a) - INTEREST_TAGS.indexOf(b));
  }

  // Email is the only join key, so someone who used a personal address one
  // time and a work address the next shows up twice. Rather than merge on a
  // guess, flag same-name pairs and let the admin judge.
  const byName = new Map<string, Contact[]>();
  for (const c of contacts) {
    if (!c.name) continue;
    const key = c.name.toLowerCase().replace(/\s+/g, " ");
    byName.set(key, [...(byName.get(key) ?? []), c]);
  }
  for (const group of byName.values()) {
    if (group.length < 2) continue;
    for (const c of group) {
      c.possibleDuplicateOf = group.filter((o) => o.email !== c.email).map((o) => o.email);
    }
  }

  return contacts.sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));
}
