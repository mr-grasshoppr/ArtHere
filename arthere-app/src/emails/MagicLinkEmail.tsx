import { Button, Heading, Hr, Section, Text } from '@react-email/components';
import * as React from 'react';
import { EmailLayout, styles } from './EmailLayout';

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
}

// Exported so lib/magic-link.ts can prefill the same copy into the
// admin invite-preview modal, without the two drifting apart.
export const MAGIC_LINK_DEFAULT_BODY_TEXT =
  "Thanks for expressing interest in joining Art Here as a featured artist! We're excited to have you.\n\nClick the button below to set up your artist profile. After we launch, your profile and artwork will appear alongside other Portland-area artists.";
const DEFAULT_BODY_TEXT = MAGIC_LINK_DEFAULT_BODY_TEXT;

export function MagicLinkEmail({ artistName, link, bodyText }: MagicLinkEmailProps) {
  const paragraphs = (bodyText?.trim() || DEFAULT_BODY_TEXT).split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  return (
    <EmailLayout preview="Set up your Art Here artist profile">
      <Heading style={styles.heading}>Welcome to Art Here</Heading>

      <Text style={styles.paragraph}>Hi {artistName?.trim() || 'there'},</Text>
      {paragraphs.map((p, i) => (
        <Text key={i} style={styles.paragraph}>{p}</Text>
      ))}

      <Section style={styles.buttonSection}>
        <Button style={styles.button} href={link}>
          Set up your profile
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
        If you didn&rsquo;t fill out the Art Here survey, you can safely ignore this email.
      </Text>
    </EmailLayout>
  );
}
