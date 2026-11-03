import { ImageResponse } from 'next/og';

export const alt = 'Art Here — local artists on the map';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Default share card for any page without its own. Deliberately text-only:
// artwork stays off third-party preview cards unless an artist opts in.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 80,
          background: '#f96a9b',
          color: '#ffffff',
        }}
      >
        <div style={{ fontSize: 160, fontWeight: 800, letterSpacing: -4 }}>Art Here</div>
        <div style={{ fontSize: 56, marginTop: 16 }}>Local artists, on the map.</div>
        <div style={{ fontSize: 36, marginTop: 48, opacity: 0.9 }}>artishere.org</div>
      </div>
    ),
    size,
  );
}
