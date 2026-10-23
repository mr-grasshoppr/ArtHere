import { Button, Heading, Hr, Section, Text } from '@react-email/components';
import * as React from 'react';
import { EmailLayout, styles } from './EmailLayout';

interface EventsPromptEmailProps {
  /** Venue/org name for the greeting. */
  name?: string | null;
  /** One-click sign-in straight to the "add an event" form. */
  link: string;
}

/**
 * Periodic nudge to organizations: do you have an event to share? The button
 * is a magic link that lands on the short event form, so a busy owner can
 * add one from their phone in a minute.
 */
export function EventsPromptEmail({ name, link }: EventsPromptEmailProps) {
  return (
    <EmailLayout preview="Have a show, opening or gathering coming up? Share it on Art Here.">
      <Heading style={styles.heading}>Anything coming up?</Heading>

      <Text style={styles.paragraph}>Hi {name?.trim() || 'there'},</Text>
      <Text style={styles.paragraph}>
        If you have a show, opening, workshop or gathering coming up, we&rsquo;d love to share it on your Art Here
        page &mdash; and there&rsquo;s no need to retype anything. Just paste a link to wherever you already share it
        (your event page, Eventbrite, a flyer or PDF). We&rsquo;ll pull in the name, dates and times, price, ages and
        photo, and you&rsquo;ll get to review and approve it before it&rsquo;s listed.
      </Text>

      <Section style={styles.buttonSection}>
        <Button style={styles.button} href={link}>
          Add an event
        </Button>
      </Section>

      <Text style={styles.paragraph}>Nothing on the calendar right now? No worries &mdash; you can ignore this one.</Text>

      <Hr style={styles.hr} />

      <Text style={styles.footnote}>
        This link works once and expires in 7 days. If it has lapsed, visit{' '}
        <a href="https://artishere.org/my-art-here" style={styles.footerLink}>
          artishere.org/my-art-here
        </a>{' '}
        and we&rsquo;ll send you a fresh one.
      </Text>
    </EmailLayout>
  );
}
