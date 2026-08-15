import { Heading, Text } from '@react-email/components';
import * as React from 'react';
import { EmailLayout, styles } from './EmailLayout';

/** Sent to whoever submits the homepage's quick "stay in touch" email signup. */
export function StayInTouchEmail() {
  return (
    <EmailLayout preview="Thanks for your interest in Art Here" centered>
      <Heading style={{ ...styles.heading, textAlign: 'center' }}>
        Hey! Thanks for your interest in Art Here.
      </Heading>
      <Text style={{ ...styles.paragraph, textAlign: 'center' }}>
        Looking forward to keeping you in the loop!
      </Text>
      <Text style={{ ...styles.footnote, textAlign: 'center', margin: '40px 0 0' }}>
        &mdash; The Art Here Team
      </Text>
    </EmailLayout>
  );
}
