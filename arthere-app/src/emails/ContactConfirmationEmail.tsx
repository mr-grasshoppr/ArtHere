import { Heading, Text } from '@react-email/components';
import * as React from 'react';
import { EmailLayout, styles } from './EmailLayout';

interface ContactConfirmationEmailProps {
  firstName: string;
}

/** Sent back to whoever submits the site's contact form. */
export function ContactConfirmationEmail({ firstName }: ContactConfirmationEmailProps) {
  return (
    <EmailLayout preview="Thanks for reaching out to Art Here" centered>
      <Heading style={{ ...styles.heading, textAlign: 'center' }}>
        Thanks for reaching out, {firstName}.
      </Heading>
      <Text style={{ ...styles.paragraph, textAlign: 'center' }}>
        We received your message and will be in touch soon.
      </Text>
      <Text style={{ ...styles.footnote, textAlign: 'center', margin: '40px 0 0' }}>
        &mdash; The Art Here Team
      </Text>
    </EmailLayout>
  );
}
