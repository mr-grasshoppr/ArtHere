import type { Metadata } from 'next';
import { NavBar } from '@/components/NavBar';
import { SurveyPageContent } from './SurveyPageContent';
import { SiteFooter } from '@/components/SiteFooter';
import { TechSupportLink } from '@/components/TechSupportLink';
import { getLogoSlides } from '@/lib/logo-slides';

export const metadata: Metadata = {
  title: 'Community Survey — Art Here',
  description: 'Tell us about Portland, Multnomah Village, and your art practice.',
};

export default async function SurveyPage() {
  const { slides: logoSlides, focals: logoFocals } = await getLogoSlides();

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a] pt-14 pb-14">
      <NavBar theme="light" />

      <SurveyPageContent logoSlides={logoSlides} logoFocals={logoFocals} />

      <SiteFooter />
      <TechSupportLink />
    </div>
  );
}
