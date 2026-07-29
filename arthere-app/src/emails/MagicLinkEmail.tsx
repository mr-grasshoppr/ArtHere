import {
  Body,
  Button,
  Container,
  Font,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

// Colored (pink/green gradient) version — the plain black mark doesn't read
// against a dark background in clients rendered with dark mode.
const LOGO_URL =
  'https://gdrwkpxdxohbq3gn.public.blob.vercel-storage.com/brand/arthere-logo-email-color.png';

interface MagicLinkEmailProps {
  /**
   * Name used in the greeting — an artist's first name, or a place's full
   * name. Blank/absent for profiles we hold no real name for (the survey
   * never asks for one), in which case the greeting falls back to "Hi there".
   * Never pass a name derived from an email address.
   */
  artistName?: string | null;
  link: string;
}

export function MagicLinkEmail({ artistName, link }: MagicLinkEmailProps) {
  return (
    <Html>
      <Head>
        {/* Matches the site's heading font. Clients that strip webfonts fall
            back to plain system sans-serif — see headingFont below. */}
        <Font
          fontFamily="Nunito"
          fallbackFontFamily="Arial"
          webFont={{
            url: 'https://fonts.gstatic.com/s/nunito/v32/XRXI3I6Li01BKofiOc5wtlZ2di8HDFwmdTQ3j6zbXWjgeg.woff2',
            format: 'woff2',
          }}
          fontWeight={700}
          fontStyle="normal"
        />
      </Head>
      <Preview>Set up your Art Here artist profile</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img src={LOGO_URL} width="80" alt="Art Here" style={logoImg} />
          </Section>

          <Heading style={heading}>Welcome to Art Here</Heading>

          <Text style={paragraph}>Hi {artistName?.trim() || 'there'},</Text>
          <Text style={paragraph}>
            Thanks for expressing interest in joining Art Here as a featured artist! We&rsquo;re
            excited to have you.
          </Text>
          <Text style={paragraph}>
            Click the button below to set up your artist profile. After we launch, your profile
            and artwork will appear alongside other Portland-area artists.
          </Text>

          <Section style={buttonSection}>
            <Button style={button} href={link}>
              Set up your profile
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footnote}>
            This link works once and expires in 48 hours. If you need a new one, visit{' '}
            <a href="https://artishere.org/my-art-here" style={footerLink}>
              artishere.org/my-art-here
            </a>{' '}
            and we&rsquo;ll send you a fresh sign-in link.
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

const logoImg: React.CSSProperties = {
  display: 'block',
  width: '80px',
  height: 'auto',
  border: '0',
};

// Nunito is the intended web font; the fallback is plain system sans-serif
// (same stack as the body text) rather than a rounded mimic — clients that
// strip web fonts (Outlook desktop, some older mail apps) should degrade to
// a clean, unremarkable sans, not a font that only exists on macOS.
const headingFont =
  'Nunito, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';

const heading: React.CSSProperties = {
  fontFamily: headingFont,
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
