import type { Metadata } from 'next';
import { NavBar } from '@/components/NavBar';
import { SurveyPageContent } from './SurveyPageContent';
import { SiteFooter } from '@/components/SiteFooter';

export const metadata: Metadata = {
  title: 'Community Survey — Art Here',
  description: 'Tell us about Portland, Multnomah Village, and your art practice.',
};

export default function SurveyPage() {
  return (
    <div className="min-h-full bg-white text-[#1a1a1a] pt-14 pb-14">
      <NavBar theme="light" />

      <SurveyPageContent />

      <SiteFooter />
    </div>
  );
}
