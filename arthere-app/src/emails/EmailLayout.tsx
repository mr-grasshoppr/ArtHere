import { Body, Container, Font, Head, Html, Img, Preview, Section } from '@react-email/components';
import * as React from 'react';

// Single source of truth for every email's branding (font, logo, colors,
// spacing). Every template in this folder should render through this shell
// and use these style constants rather than declaring its own — that
// duplication is exactly how emails drifted out of sync with each other (and
// with the site) before.

// Colored (pink/green gradient) version — the plain black mark doesn't read
// against a dark background in clients rendered with dark mode. v5 (this
// one) is generated from public/images/arthere_color_logo_update_Sept1.png
// — the wordmark's letter spacing was widened on that date; the old master
// (public/images/arthere_logo_green_pink.png, still used as the mask shape
// for the site's dark/white logo and the animated hero — see
// REQUIRED-DESIGN-FEATURES.md's LOGO section) has the old tight spacing.
// Resized with sharp (lanczos3) to 240px (3x the 80px display size —
// comfortably retina-sharp without the slow-load flash a 480px/146KB
// version caused, see git history) and NOT flattened — this asset keeps
// its real alpha channel. Do not flatten it onto opaque white to "fix" a
// Gmail dark-mode halo, even if one turns up — that trade was already
// made once (v2) and produced a worse, more visible defect: a plain white
// box behind the logo in dark-mode clients that don't share Gmail's
// specific quirk. Regenerate + re-upload (see git history) if the source
// logo ever changes.
export const LOGO_URL =
  'https://gdrwkpxdxohbq3gn.public.blob.vercel-storage.com/brand/arthere-logo-email-color-v5.png';

const NUNITO_WOFF2_URL =
  'https://fonts.gstatic.com/s/nunito/v32/XRXI3I6Li01BKofiOc5wtlZ2di8HDFwmdTQ3j6zbXWjgeg.woff2';

// Nunito is the intended web font for headings (matches the site); the
// fallback is plain system sans-serif rather than a rounded mimic — clients
// that strip web fonts (Outlook desktop, some older mail apps) should
// degrade to a clean, unremarkable sans, not a font that only exists on
// macOS. Body copy uses DM Sans/system-sans throughout, never a serif.
export const headingFont =
  'Nunito, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';

export const styles = {
  body: {
    backgroundColor: '#ffffff',
    fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  } as React.CSSProperties,
  container: {
    maxWidth: '560px',
    margin: '0 auto',
    padding: '48px 28px 64px',
  } as React.CSSProperties,
  logoSection: {
    marginBottom: '40px',
  } as React.CSSProperties,
  logoImg: {
    display: 'block',
    width: '80px',
    height: 'auto',
    border: '0',
  } as React.CSSProperties,
  heading: {
    fontFamily: headingFont,
    fontSize: '2rem',
    fontWeight: '700',
    letterSpacing: '-0.02em',
    color: '#1a1a1a',
    margin: '0 0 24px',
  } as React.CSSProperties,
  // Smaller heading for terse internal notifications, which don't need the
  // full hero treatment user-facing emails get — same font/color/weight,
  // just less visual weight.
  headingCompact: {
    fontFamily: headingFont,
    fontSize: '1.35rem',
    fontWeight: '700',
    letterSpacing: '-0.01em',
    color: '#1a1a1a',
    margin: '0 0 20px',
  } as React.CSSProperties,
  paragraph: {
    fontSize: '1rem',
    lineHeight: '1.75',
    color: '#444',
    margin: '0 0 16px',
  } as React.CSSProperties,
  buttonSection: {
    margin: '36px 0',
  } as React.CSSProperties,
  button: {
    display: 'inline-block',
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    fontSize: '0.95rem',
    fontWeight: '500',
    textDecoration: 'none',
    padding: '14px 32px',
    borderRadius: '9999px',
  } as React.CSSProperties,
  hr: {
    border: 'none',
    borderTop: '1px solid #f0f0f0',
    margin: '32px 0',
  } as React.CSSProperties,
  footnote: {
    fontSize: '0.82rem',
    lineHeight: '1.65',
    color: '#999',
    margin: '0 0 10px',
  } as React.CSSProperties,
  footerLink: {
    color: '#999',
  } as React.CSSProperties,
  // Used by AdminNotificationEmail's key/value table.
  tableLabel: {
    padding: '8px 12px 8px 0',
    color: '#888',
    whiteSpace: 'nowrap',
    verticalAlign: 'top',
  } as React.CSSProperties,
  tableValue: {
    padding: '8px 0',
    color: '#1a1a1a',
  } as React.CSSProperties,
};

export function EmailLayout({
  preview,
  centered,
  children,
}: {
  preview: string;
  /** Centers the logo and is available for content to opt into as well — used by the short, centered confirmation-style emails. */
  centered?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Html>
      <Head>
        <Font
          fontFamily="Nunito"
          fallbackFontFamily="Arial"
          webFont={{ url: NUNITO_WOFF2_URL, format: 'woff2' }}
          fontWeight={700}
          fontStyle="normal"
        />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={{ ...styles.logoSection, ...(centered ? { textAlign: 'center' } : {}) }}>
            <Img
              src={LOGO_URL}
              width="80"
              alt="Art Here"
              style={{ ...styles.logoImg, ...(centered ? { display: 'inline-block' } : {}) }}
            />
          </Section>
          {children}
        </Container>
      </Body>
    </Html>
  );
}
