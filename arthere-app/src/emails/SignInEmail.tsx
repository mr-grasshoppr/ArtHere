import { Button, Heading, Hr, Section, Text } from '@react-email/components';
import * as React from 'react';
import { EmailLayout, styles } from './EmailLayout';

interface SignInEmailProps {
  link: string;
}

/**
 * NextAuth's generic sign-in email — sent whenever someone types their email
 * into the plain /login form (as opposed to clicking an admin-sent invite or
 * a "my-art-here" resend link, which use MagicLinkEmail/ProfileLinkEmail).
 * Same shell/branding as every other email; content is deliberately minimal
 * since we don't know who this is yet.
 */
export function SignInEmail({ link }: SignInEmailProps) {
  return (
    <EmailLayout preview="Sign in to Art Here">
      <Heading style={styles.heading}>Sign in to Art Here</Heading>

      <Text style={styles.paragraph}>
        Click the button below to sign in. This link expires in 20 minutes.
      </Text>

      <Section style={styles.buttonSection}>
        <Button style={styles.button} href={link}>
          Sign in to your profile
        </Button>
      </Section>

      <Hr style={styles.hr} />

      <Text style={styles.footnote}>
        If you didn&rsquo;t request this, you can safely ignore this email.
      </Text>
    </EmailLayout>
  );
}
