import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

// Comma-separated list of admin emails. Falls back to the founding admin so
// existing deployments keep working until ADMIN_EMAILS is configured.
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "maryannamail@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * Returns the current session if the signed-in user is an admin, else null.
 * Use in API routes: `if (!(await getAdminSession())) return 401`.
 */
export async function getAdminSession() {
  const session = await auth();
  return isAdminEmail(session?.user?.email) ? session : null;
}

/**
 * Throws if the current user is not an admin. Use in server actions and
 * server components. Every /admin page must call this itself — the admin
 * layout also checks, but layouts are not a security boundary in the App
 * Router.
 */
export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

/**
 * Page variant: redirects to /login instead of throwing. Call at the top of
 * every /admin page component.
 */
export async function requireAdminPage() {
  if (!(await getAdminSession())) redirect("/login");
}
