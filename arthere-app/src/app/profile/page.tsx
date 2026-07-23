import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ProfileHero, ProfileGallery } from "@/components/ProfileImages";

function hireForSentence(name: string, hireFor: string): string {
  const firstName = name.split(' ')[0];
  const items = hireFor.split(' · ').map(s => s.trim()).filter(Boolean);
  const verbs = items.map(item => {
    const l = item.toLowerCase();
    if (l.includes('sell') || l.includes('buying existing')) return 'sells artwork';
    if (l.includes('custom work')) return 'takes commissions';
    if (l.includes('teach') || l.includes('classes') || l.includes('lessons') || l.includes('workshop')) return 'teaches';
    if (l.includes('consultation')) return 'offers consultations';
    return l;
  });
  const unique = [...new Set(verbs)];
  if (unique.length === 0) return '';
  if (unique.length === 1) return `${firstName} ${unique[0]}.`;
  const last = unique[unique.length - 1];
  return `${firstName} ${unique.slice(0, -1).join(', ')}, and ${last}.`;
}

function socialPlatformName(url: string): string {
  if (!url.startsWith('http')) return 'Instagram';
  try {
    const host = new URL(url).hostname.replace('www.', '');
    if (host.includes('instagram.com')) return 'Instagram';
    if (host.includes('facebook.com') || host.includes('fb.com')) return 'Facebook';
    if (host.includes('etsy.com')) return 'Etsy';
    if (host.includes('twitter.com') || host.includes('x.com')) return 'X';
    if (host.includes('tiktok.com')) return 'TikTok';
    if (host.includes('linkedin.com')) return 'LinkedIn';
    if (host.includes('pinterest.com')) return 'Pinterest';
    if (host.includes('behance.net')) return 'Behance';
    if (host.includes('youtube.com')) return 'YouTube';
    return 'Social media';
  } catch { return 'Social media'; }
}

export default async function ProfilePage() {
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

  // First time: no artist profile yet
  if (!user.artist) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-white text-[#1a1a1a]" style={{ colorScheme: "light" }}>
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-medium mb-4">Welcome to Art Here Portland</h1>
          <p className="text-[#666] mb-8 leading-relaxed">
            You&rsquo;re signed in as <span className="text-[#1a1a1a]">{user.email}</span>.<br />
            Let&rsquo;s set up your artist profile.
          </p>
          <Link
            href="/onboarding"
            className="inline-block bg-[#1a1a1a] text-white px-8 py-3 rounded-full font-medium hover:opacity-80 transition-opacity"
          >
            Create your profile
          </Link>
        </div>
      </main>
    );
  }

  const artist = user.artist;
  const heroImage =
    artist.artworkImages.find((img) => img.isHero) ??
    artist.artworkImages[0] ??
    null;
  const bioPhoto = artist.bioPhotoUrl ?? heroImage?.url ?? null;
  const galleryImages = artist.artworkImages.filter(
    (img) => !img.isHero && img.id !== heroImage?.id
  );

  const commissionLabel: Record<string, string> = {
    OPEN: "Open for commissions",
    CLOSED: "Not taking commissions",
    ON_REQUEST: "Commissions by request",
    UNSPECIFIED: "",
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-12 bg-white text-[#1a1a1a]" style={{ colorScheme: "light" }}>
      {/* Header / nav */}
      <div className="flex justify-between items-center mb-10">
        <a href="/" className="text-[#999] text-sm hover:text-[#1a1a1a] transition-colors">
          ← Art Here Portland
        </a>
        <Link
          href="/onboarding"
          className="text-sm font-medium bg-[#1a1a1a] text-white px-5 py-2 rounded-full hover:opacity-80 transition-opacity"
        >
          Edit profile
        </Link>
      </div>

      {/* Hero image with bio photo */}
      <ProfileHero
        initialImages={artist.artworkImages}
        artistName={artist.name}
        bioPhotoUrl={bioPhoto}
      />

      {/* Artist identity */}
      <div className="mb-8">
        <div>
          <h1 className="text-3xl font-medium text-[#1a1a1a]">{artist.name}</h1>
          {(artist.medium || artist.neighborhood) && (
            <p className="text-[#888] mt-1">
              {[artist.medium, artist.neighborhood].filter(Boolean).join(" · ")}
            </p>
          )}
          {artist.placeRelations.length > 0 && (
            <p className="text-[#888] mt-0.5">
              {artist.placeRelations.map((r) => r.place.name).join(" · ")}
            </p>
          )}
        </div>
      </div>

      {/* Bio */}
      {artist.bio && (
        <p className="text-[#444] leading-relaxed mb-4 whitespace-pre-wrap">{artist.bio}</p>
      )}


      {/* Links */}
      {(artist.website || artist.instagram) && (
        <section className="border-t border-[#f0f0f0] pt-6 flex gap-4">
          {artist.website && (
            <a
              href={artist.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#888] text-sm hover:text-[#1a1a1a] transition-colors"
            >
              Website ↗
            </a>
          )}
          {artist.instagram && (
            <a
              href={artist.instagram.startsWith("http") ? artist.instagram : `https://instagram.com/${artist.instagram.replace(/^@/, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#888] text-sm hover:text-[#1a1a1a] transition-colors"
            >
              {socialPlatformName(artist.instagram)} ↗
            </a>
          )}
        </section>
      )}

      {/* Gallery — shown last */}
      <ProfileGallery initialImages={artist.artworkImages} />

      {artist.hireFor && (
        <p className="text-[#888] text-sm italic mt-6">
          {hireForSentence(artist.name, artist.hireFor)}
        </p>
      )}

      <div className="mt-10 pt-8 border-t border-[#f0f0f0]">
        <a href="/artists" className="text-sm text-[#888] hover:text-[#1a1a1a] transition-colors">
          ← Portland Artists
        </a>
      </div>
    </main>
  );
}
