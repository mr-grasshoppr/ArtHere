import { Heading, Text } from '@react-email/components';
import * as React from 'react';
import { EmailLayout, styles } from './EmailLayout';

/**
 * A message an admin composed in /admin/contact-tracking, in the same shell as
 * every other Art Here email.
 *
 * The body arrives as plain text the admin typed, so it's split on blank lines
 * into paragraphs rather than rendered as HTML — admin-authored or not, piping
 * a text field straight into an email as markup is how a stray angle bracket
 * silently mangles a send to a hundred people.
 */
export function AdminOutreachEmail({ subject, body }: { subject: string; body: string }) {
  const paragraphs = body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <EmailLayout preview={subject}>
      <Heading style={styles.heading}>{subject}</Heading>
      {paragraphs.map((p, i) => (
        // Single newlines inside a paragraph are meaningful in a typed
        // message (a signature, a list), so they're kept as line breaks.
        <Text key={i} style={styles.paragraph}>
          {p.split('\n').map((line, j, all) => (
            <React.Fragment key={j}>
              {line}
              {j < all.length - 1 && <br />}
            </React.Fragment>
          ))}
        </Text>
      ))}
    </EmailLayout>
  );
}
