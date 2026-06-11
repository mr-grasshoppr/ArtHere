import { Nunito } from 'next/font/google';

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-nunito',
  display: 'swap',
});

// Mirrors src/app/cities/layout.tsx — loads the Nunito heading font so
// artist profile pages can use the `font-heading` utility for names/titles,
// matching the look of the /cities directory pages.
export default function ArtistsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${nunito.variable} h-full`}>
      {children}
    </div>
  );
}
