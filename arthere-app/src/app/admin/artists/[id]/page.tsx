import { redirect } from "next/navigation";

// View and edit now live on one page — see ./edit. This bare route is kept
// only because it's still bookmarked/linked from a few older list pages.
export default async function AdminArtistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/admin/artists/${id}/edit`);
}
