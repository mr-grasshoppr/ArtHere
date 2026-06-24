import type { Metadata } from 'next';
import { NavBar } from '@/components/NavBar';
import { SurveyPageContent } from './SurveyPageContent';

export const metadata: Metadata = {
  title: 'Community Survey — Art Here',
  description: 'Tell us about Portland, Multnomah Village, and your art practice.',
};

export default function SurveyPage() {
  return (
    <div className="min-h-full bg-white text-[#1a1a1a] pt-14 pb-14">
      <NavBar theme="light" />

      <SurveyPageContent />

      <footer className="px-10 py-10 text-center text-[#bbb] text-[0.78rem] tracking-[0.05em] border-t border-[#f0f0f0]">
        © 2026 Art Here · A project of Art Experience Lab
      </footer>
    </div>
  );
}
