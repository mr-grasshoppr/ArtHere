import { redirect } from 'next/navigation';

// Place magic links land here — forward to the shared token-verification handler.
export default async function PlaceSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  redirect(token ? `/profile/setup?token=${token}` : '/my-art-here');
}
