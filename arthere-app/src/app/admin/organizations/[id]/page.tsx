import { redirect } from "next/navigation";

// View and edit now live on one page — see ./edit. This bare route is kept
// only because emails and older links still point at it.
export default async function AdminOrgPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/admin/organizations/${id}/edit`);
}
