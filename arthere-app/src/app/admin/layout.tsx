import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

const ADMIN_EMAIL = "maryannamail@gmail.com";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#1a1a1a]" style={{ colorScheme: "light" }}>
      <header className="bg-white border-b border-[#e5e5e5] px-6 py-4 flex items-center gap-8">
        <Link href="/admin" className="font-medium text-[#1a1a1a]">
          Art Here Admin
        </Link>
        <nav className="flex gap-6 text-sm text-[#666]">
          <Link href="/admin" className="hover:text-[#1a1a1a] transition-colors">
            Overview
          </Link>
          <Link href="/admin/survey" className="hover:text-[#1a1a1a] transition-colors">
            Survey
          </Link>
          <Link href="/admin/artists" className="hover:text-[#1a1a1a] transition-colors">
            Artists
          </Link>
        </nav>
        <div className="ml-auto">
          <Link href="/" className="text-sm text-[#999] hover:text-[#1a1a1a] transition-colors">
            ← Site
          </Link>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-10">{children}</main>
    </div>
  );
}
