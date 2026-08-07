import { Heading, Hr, Text } from '@react-email/components';
import * as React from 'react';
import { EmailLayout, styles } from './EmailLayout';

export function SurveyThankYouEmail() {
  return (
    <EmailLayout preview="Thank you for completing the PDX Community Survey" centered>
      <Heading style={{ ...styles.heading, textAlign: 'center' }}>Thank you!</Heading>

      <Text style={styles.paragraph}>
        Thank you for completing Art Here&rsquo;s PDX Community Survey! If you expressed
        interest in getting involved, we&rsquo;ll be in touch soon.
      </Text>
      <Text style={styles.paragraph}>
        Your answers help us understand what Portland&rsquo;s arts community needs — and how
        to better connect local artists with the neighbors, businesses, and organizations
        around them.
      </Text>

      <Hr style={styles.hr} />

      <Text style={{ ...styles.footnote, margin: 0 }}>
        &mdash; The Art Here Team<br />
        <a href="https://artishere.org" style={styles.footerLink}>
          artishere.org
        </a>
      </Text>
    </EmailLayout>
  );
}
