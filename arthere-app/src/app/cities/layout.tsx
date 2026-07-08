import { Nunito } from 'next/font/google';
import { PortlandGate } from '@/components/PortlandGate';

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-nunito',
  display: 'swap',
});

export default function CitiesLayout({ children }: { children: React.ReactNode }) {
  // This shared layout only loads the Nunito heading font (used by both the
  // dark "now playing" pages and the lighter directory pages). Background
  // color and scroll behavior are set per-page so each page can pick its
  // own look.
  return (
    <div className={`${nunito.variable} h-full`}>
      <PortlandGate>{children}</PortlandGate>
    </div>
  );
}
