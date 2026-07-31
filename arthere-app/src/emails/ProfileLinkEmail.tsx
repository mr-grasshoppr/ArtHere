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

interface ProfileLinkEmailProps {
  /** Recipient's first name (artist) or venue name (place). "there" fallback. */
  name?: string | null;
  link: string;
  /** "profile" for artists, "page" for places — keeps the copy accurate. */
  noun?: 'profile' | 'page';
  /**
   * Overrides the default intro copy below the greeting — paragraphs
   * separated by a blank line. Lets an admin preview/edit the message before
   * it's sent without touching the surrounding template.
   */
  bodyText?: string;
}

/**
 * Sent when an existing artist or place requests a fresh sign-in link (e.g.
 * from /my-art-here). Deliberately plain — this is a returning user coming back
 * to edit, not a first-time invitation, so it carries none of the onboarding /
 * "welcome, you're accepted" framing of MagicLinkEmail.
 */
// Exported so lib/magic-link.ts can prefill the same copy into the
// admin invite-preview modal, without the two drifting apart.
export function profileLinkDefaultBodyText(noun: 'profile' | 'page' = 'profile'): string {
  return `You can view and edit your Art Here ${noun} any time using the button below.`;
}

export function ProfileLinkEmail({ name, link, noun = 'profile', bodyText }: ProfileLinkEmailProps) {
  const paragraphs = (bodyText?.trim() || profileLinkDefaultBodyText(noun)).split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  return (
    <Html>
      <Head>
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
      <Preview>View and edit your Art Here {noun}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img src={LOGO_URL} width="80" alt="Art Here" style={logoImg} />
          </Section>

          <Heading style={heading}>Your Art Here {noun}</Heading>

          <Text style={paragraph}>Hi {name?.trim() || 'there'},</Text>
          {paragraphs.map((p, i) => (
            <Text key={i} style={paragraph}>{p}</Text>
          ))}

          <Section style={buttonSection}>
            <Button style={button} href={link}>
              View &amp; edit my {noun}
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footnote}>
            This link works once and expires in 48 hours. If you need a new one, visit{' '}
            <a href="https://artishere.org/my-art-here" style={footerLink}>
              artishere.org/my-art-here
            </a>{' '}
            and we&rsquo;ll send you a fresh one.
          </Text>
          <Text style={footnote}>
            If you didn&rsquo;t request this link, you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// ─── Styles (mirrors MagicLinkEmail so both mails look identical) ───────────────

const body: React.CSSProperties = {
  backgroundColor: '#ffffff',
  fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
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
// (same stack as the body text) rather than a rounded mimic.
const heading: React.CSSProperties = {
  fontFamily: 'Nunito, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
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
