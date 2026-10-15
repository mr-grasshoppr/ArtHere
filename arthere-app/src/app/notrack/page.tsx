import type { Metadata } from 'next';
import { NoTrackToggle } from './NoTrackToggle';

export const metadata: Metadata = {
  title: 'Analytics opt-out',
  robots: { index: false, follow: false },
};

export default function NoTrackPage() {
  return (
    <main className="max-w-[560px] mx-auto px-5 py-24">
      <h1 className="font-heading text-[1.6rem] font-bold mb-3">Analytics opt-out</h1>
      <p className="text-[0.95rem] text-[#555] leading-relaxed mb-8">
        Turn this on in each browser you use to browse the site yourself, so your own visits and clicks
        aren&rsquo;t counted. It&rsquo;s remembered per browser and device; clearing site data resets it.
      </p>
      <NoTrackToggle />
    </main>
  );
}
