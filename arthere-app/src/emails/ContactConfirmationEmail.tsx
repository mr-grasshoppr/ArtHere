import { Heading, Text } from '@react-email/components';
import * as React from 'react';
import { EmailLayout, styles } from './EmailLayout';

/**
 * Sent back to whoever submits the site's contact form.
 *
 * Deliberately greets nobody by name. The form collects one "Your name"
 * field, and the only way to get a first name out of it is to split on
 * whitespace — which turns "Mary Ann Smith" into "Mary" and mangles any name
 * that doesn't decompose into two western-style parts. A greeting with no
 * name is never wrong; Artist.firstName exists for the places that genuinely
 * need one, and it's filled in by the artist during onboarding.
 */
export function ContactConfirmationEmail() {
  return (
    <EmailLayout preview="Thanks for reaching out to Art Here" centered>
      <Heading style={{ ...styles.heading, textAlign: 'center' }}>
        Thanks for reaching out!
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
