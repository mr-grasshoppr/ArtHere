import { Button, Heading, Hr, Img, Section, Text } from '@react-email/components';
import * as React from 'react';
import { EmailLayout, styles } from './EmailLayout';
import { ARTIST_DRAFT_PROFILE_BODY_TEXT } from '@/lib/invite-templates';

interface MagicLinkEmailProps {
  /**
   * Name used in the greeting — an artist's first name, or a place's full
   * name. Blank/absent for profiles we hold no real name for (the survey
   * never asks for one), in which case the greeting falls back to "Hi there".
   * Never pass a name derived from an email address.
   */
  artistName?: string | null;
  link: string;
  /**
   * Overrides the default intro copy below the greeting — paragraphs
   * separated by a blank line. Lets an admin preview/edit the message before
   * it's sent without touching the surrounding template (logo, button,
   * footer legal text stay standard).
   */
  bodyText?: string;
  /** Optional screenshot of their current page, shown between the message and the button. */
  screenshotUrl?: string | null;
  /** What the button says to set up — 'profile' for artists (default), 'page' for places. */
  noun?: 'profile' | 'page';
}

// Exported so lib/magic-link.ts can prefill the same copy into the
// admin invite-preview modal, without the two drifting apart.
export const MAGIC_LINK_DEFAULT_BODY_TEXT = ARTIST_DRAFT_PROFILE_BODY_TEXT;

// Same welcome email, but for a Place (gallery/studio/shop/venue) rather
// than an individual artist — kept separate so the two never drift onto
// each other's copy again (see lib/magic-link.ts createPlaceInvitePreview).
export const PLACE_MAGIC_LINK_DEFAULT_BODY_TEXT =
  "Thanks for expressing interest in joining Art Here as a featured community space! We're excited to have you.\n\nClick the button below to edit your page. After you submit, your page will appear in our arts community directory alongside other organizations and places that support local artists.";

const DEFAULT_BODY_TEXT = MAGIC_LINK_DEFAULT_BODY_TEXT;

export function MagicLinkEmail({ artistName, link, bodyText, screenshotUrl, noun = 'profile' }: MagicLinkEmailProps) {
  const paragraphs = (bodyText?.trim() || DEFAULT_BODY_TEXT).split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  return (
    <EmailLayout preview={noun === 'page' ? 'Set up your Art Here page' : 'Set up your Art Here artist profile'}>
      <Heading style={styles.heading}>Welcome to Art Here</Heading>

      <Text style={styles.paragraph}>Hi {artistName?.trim() || 'there'},</Text>
      {paragraphs.map((p, i) => (
        <Text key={i} style={styles.paragraph}>{p}</Text>
      ))}

      {screenshotUrl && (
        <Section style={{ margin: '8px 0 16px' }}>
          <Img
            src={screenshotUrl}
            alt={`Screenshot of your current Art Here ${noun}`}
            width="100%"
            style={{ width: '100%', maxWidth: '520px', height: 'auto', border: '1px solid #e5e5e5', borderRadius: '8px' }}
          />
        </Section>
      )}

      <Section style={styles.buttonSection}>
        <Button style={styles.button} href={link}>
          Set up your {noun}
        </Button>
      </Section>

      <Hr style={styles.hr} />

      <Text style={styles.footnote}>
        This link works once and expires in 48 hours. If you need a new one, visit{' '}
        <a href="https://artishere.org/my-art-here" style={styles.footerLink}>
          artishere.org/my-art-here
        </a>{' '}
        and we&rsquo;ll send you a fresh sign-in link.
      </Text>
      <Text style={styles.footnote}>
        If you weren&rsquo;t expecting this invitation, you can safely ignore this email.
      </Text>
    </EmailLayout>
  );
}
