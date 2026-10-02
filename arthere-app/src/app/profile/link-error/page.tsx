import { Suspense } from 'react';
import LinkErrorClient from './LinkErrorClient';
import { getLogoSlides } from '@/lib/logo-slides';

export default async function LinkErrorPage() {
  const { slides: logoSlides, focals: logoFocals } = await getLogoSlides();

  return (
    <Suspense>
      <LinkErrorClient logoSlides={logoSlides} logoFocals={logoFocals} />
    </Suspense>
  );
}
