import { Suspense } from 'react';
import LoginPageClient from './LoginPageClient';
import { getLogoSlides } from '@/lib/logo-slides';

export default async function LoginPage() {
  const { slides: logoSlides, focals: logoFocals } = await getLogoSlides();

  return (
    <Suspense>
      <LoginPageClient logoSlides={logoSlides} logoFocals={logoFocals} />
    </Suspense>
  );
}
