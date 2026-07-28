import {
  Body,
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

const LOGO_URL =
  'https://gdrwkpxdxohbq3gn.public.blob.vercel-storage.com/brand/arthere-logo-email.png';

export function SurveyThankYouEmail() {
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
      <Preview>Thank you for completing the PDX Community Survey</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img src={LOGO_URL} width="80" alt="Art Here" style={logoImg} />
          </Section>

          <Heading style={heading}>Thank you!</Heading>

          <Text style={paragraph}>
            Thank you for completing Art Here&rsquo;s PDX Community Survey! If you expressed
            interest in getting involved, we&rsquo;ll be in touch soon.
          </Text>
          <Text style={paragraph}>
            Your answers help us understand what Portland&rsquo;s arts community needs — and how
            to better connect local artists with the neighbors, businesses, and organizations
            around them.
          </Text>

          <Hr style={hr} />

          <Text style={footnote}>
            &mdash; The Art Here Team<br />
            <a href="https://artishere.org" style={footerLink}>
              artishere.org
            </a>
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
  marginBottom: '32px',
  textAlign: 'center',
};

const logoImg: React.CSSProperties = {
  display: 'inline-block',
  width: '80px',
  height: 'auto',
  border: '0',
};

// Nunito is the intended web font; the fallback is plain system sans-serif
// (same stack as the body text) rather than a rounded mimic.
const headingFont =
  'Nunito, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';

const heading: React.CSSProperties = {
  fontFamily: headingFont,
  fontSize: '2rem',
  fontWeight: '700',
  letterSpacing: '-0.02em',
  color: '#1a1a1a',
  textAlign: 'center',
  margin: '0 0 28px',
};

const paragraph: React.CSSProperties = {
  fontSize: '1rem',
  lineHeight: '1.75',
  color: '#444',
  margin: '0 0 16px',
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
  margin: '0',
};

const footerLink: React.CSSProperties = {
  color: '#999',
};
