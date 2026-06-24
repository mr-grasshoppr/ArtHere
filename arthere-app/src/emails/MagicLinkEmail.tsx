import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface MagicLinkEmailProps {
  artistName: string;
  link: string;
}

export function MagicLinkEmail({ artistName, link }: MagicLinkEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Set up your Art Here artist profile</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={logoSection}>
            <Text style={logoText}>Art Here</Text>
          </Section>

          <Heading style={heading}>You&rsquo;re in.</Heading>

          <Text style={paragraph}>Hi {artistName},</Text>
          <Text style={paragraph}>
            Thanks for completing the Art Here community survey and expressing interest in being
            a featured artist. We&rsquo;re excited to have you.
          </Text>
          <Text style={paragraph}>
            Click the button below to set up your artist profile. Once it&rsquo;s live, you&rsquo;ll
            appear in the Art Here directory for Portland.
          </Text>

          <Section style={buttonSection}>
            <Button style={button} href={link}>
              Set up your profile
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footnote}>
            This link works once and expires in 72 hours. If you need a new one, visit{' '}
            <a href="https://artishere.org/pages/survey.html" style={footerLink}>
              artishere.org
            </a>{' '}
            and click &ldquo;Already a member? Edit your profile.&rdquo;
          </Text>
          <Text style={footnote}>
            If you didn&rsquo;t fill out the Art Here survey, you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const body: React.CSSProperties = {
  backgroundColor: '#ffffff',
  fontFamily:
    '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const container: React.CSSProperties = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '48px 28px 64px',
};

const logoSection: React.CSSProperties = {
  marginBottom: '40px',
};

const logoText: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: '700',
  letterSpacing: '0.04em',
  color: '#1a1a1a',
  margin: '0',
};

const heading: React.CSSProperties = {
  fontSize: '2rem',
  fontWeight: '700',
  letterSpacing: '-0.02em',
  color: '#1a1a1a',
  margin: '0 0 24px',
};

const paragraph: React.CSSProperties = {
  fontSize: '1rem',
  lineHeight: '1.75',
  color: '#444',
  margin: '0 0 16px',
};

const buttonSection: React.CSSProperties = {
  margin: '36px 0',
};

const button: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#1a1a1a',
  color: '#ffffff',
  fontSize: '0.95rem',
  fontWeight: '500',
  textDecoration: 'none',
  padding: '14px 32px',
  borderRadius: '9999px',
};

const hr: React.CSSProperties = {
  border: 'none',
  borderTop: '1px solid #f0f0f0',
  margin: '32px 0',
};

const footnote: React.CSSProperties = {
  fontSize: '0.82rem',
  lineHeight: '1.65',
  color: '#999',
  margin: '0 0 10px',
};

const footerLink: React.CSSProperties = {
  color: '#999',
};
