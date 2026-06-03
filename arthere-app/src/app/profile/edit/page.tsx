import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import ProfileEditor from "@/components/ProfileEditor";

export default async function ProfileEditPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      artist: {
        include: {
          artworkImages: { orderBy: { sortOrder: "asc" } },
          placeRelations: { include: { place: true } },
          intake: true,
        },
      },
    },
  });

  if (!user) redirect("/login");

  const places = await prisma.place.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <a href="/profile" className="text-stone-400 text-sm hover:text-stone-600 transition-colors">
          ← Back to profile
        </a>
      </div>
      <h1 className="text-2xl font-medium text-stone-900 mb-8">
        {user.artist ? "Edit your profile" : "Create your profile"}
      </h1>
      <ProfileEditor
        initialArtist={user.artist}
        places={places}
        userEmail={user.email}
      />
    </main>
  );
}
