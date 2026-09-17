import { permanentRedirect } from 'next/navigation';

// The artwork browser is the city page now — this URL is kept only so old
// links and search results still land somewhere.
export default async function ArtworkRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  permanentRedirect(`/cities/${slug}`);
}
