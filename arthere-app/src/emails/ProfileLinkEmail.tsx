import { Button, Heading, Hr, Img, Section, Text } from '@react-email/components';
import * as React from 'react';
import { EmailLayout, styles } from './EmailLayout';

interface ProfileLinkEmailProps {
  /** Recipient's first name (artist) or venue name (place). "there" fallback. */
  name?: string | null;
  link: string;
  /** "profile" for artists, "page" for places — keeps the copy accurate. */
  noun?: 'profile' | 'page';
  /**
   * Overrides the default intro copy below the greeting — paragraphs
   * separated by a blank line. Lets an admin preview/edit the message before
   * it's sent without touching the surrounding template.
   */
  bodyText?: string;
  /** Optional screenshot of their current page, shown between the message and the button. */
  screenshotUrl?: string | null;
}

/**
 * Sent when an existing artist or place requests a fresh sign-in link (e.g.
 * from /my-art-here). Deliberately plain — this is a returning user coming back
 * to edit, not a first-time invitation, so it carries none of the onboarding /
 * "welcome, you're accepted" framing of MagicLinkEmail.
 */
// Exported so lib/magic-link.ts can prefill the same copy into the
// admin invite-preview modal, without the two drifting apart.
export function profileLinkDefaultBodyText(noun: 'profile' | 'page' = 'profile'): string {
  return `You can view and edit your Art Here ${noun} any time using the button below.`;
}

export function ProfileLinkEmail({ name, link, noun = 'profile', bodyText, screenshotUrl }: ProfileLinkEmailProps) {
  const paragraphs = (bodyText?.trim() || profileLinkDefaultBodyText(noun)).split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  return (
    <EmailLayout preview={`View and edit your Art Here ${noun}`}>
      <Heading style={styles.heading}>Your Art Here {noun}</Heading>

      <Text style={styles.paragraph}>Hi {name?.trim() || 'there'},</Text>
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
          View &amp; edit my {noun}
        </Button>
      </Section>

      <Hr style={styles.hr} />

      <Text style={styles.footnote}>
        This link works once and expires in 48 hours. If you need a new one, visit{' '}
        <a href="https://artishere.org/my-art-here" style={styles.footerLink}>
          artishere.org/my-art-here
        </a>{' '}
        and we&rsquo;ll send you a fresh one.
      </Text>
      <Text style={styles.footnote}>
        If you didn&rsquo;t request this link, you can safely ignore this email.
      </Text>
    </EmailLayout>
  );
}
