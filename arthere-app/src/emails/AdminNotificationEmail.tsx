import { Heading, Hr, Text } from '@react-email/components';
import * as React from 'react';
import { EmailLayout, styles } from './EmailLayout';

interface Row {
  label: string;
  /** Pass pre-escaped/trusted markup (e.g. via dangerouslySetInnerHTML upstream) or a plain string. */
  value: React.ReactNode;
}

interface AdminNotificationEmailProps {
  preview: string;
  heading: string;
  /** Freeform intro text/paragraphs shown above the table, if any. */
  message?: React.ReactNode;
  rows?: Row[];
  ctaLabel?: string;
  ctaHref?: string;
}

/**
 * Shared shell for the internal "something happened" notifications we send
 * ourselves (new contact form submission, new survey response, artist
 * submitted for review, etc.) — one consistent look instead of each route
 * hand-rolling its own inline HTML.
 */
export function AdminNotificationEmail({ preview, heading, message, rows, ctaLabel, ctaHref }: AdminNotificationEmailProps) {
  return (
    <EmailLayout preview={preview}>
      <Heading style={styles.headingCompact}>{heading}</Heading>

      {message && <Text style={styles.paragraph}>{message}</Text>}

      {rows && rows.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td style={styles.tableLabel}>{r.label}</td>
                <td style={styles.tableValue}>{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {ctaHref && (
        <>
          <Hr style={styles.hr} />
          <Text style={{ ...styles.footnote, margin: 0 }}>
            <a href={ctaHref} style={{ color: '#1a1a1a' }}>{ctaLabel ?? 'View in admin →'}</a>
          </Text>
        </>
      )}
    </EmailLayout>
  );
}
