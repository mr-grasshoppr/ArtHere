import { redirect } from 'next/navigation';

// artishere.org/about is a bare alias for the About section on the home
// page (id="about" in app/page.tsx) — there's no standalone About page.
export default function AboutRedirect() {
  redirect('/#about');
}
