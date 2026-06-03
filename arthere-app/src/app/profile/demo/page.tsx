/**
 * Static demo of what an artist profile looks like once populated.
 * Uses fixture data — no database required.
 * Remove this route before production launch.
 */
import Image from "next/image";
import Link from "next/link";

const DEMO_ARTIST = {
  name: "Isabella Cassini",
  bio: "I work in oil and encaustic, exploring the tension between stillness and motion in landscape. My studio is at NW Marine Art Works in Portland's Slabtown neighborhood, where I've been painting since 2014.\n\nRecent work focuses on the light of the Pacific coast — the way fog diffuses color into something almost tactile.",
  commissionStatus: "OPEN" as const,
  placeRelations: [{ place: { name: "NW Marine Art Works" }, relationship: "MEMBER" }],
  website: "https://isabellacassini.com",
  instagram: "isabellacassini",
  heroImage: {
    url: "https://images.squarespace-cdn.com/content/v1/5e1a2b7a8a61b46ef7c6d5a1/1600000000000-XXXXXX/hero.jpg",
    altText: "Rolling hills, oil on panel, 36×48″",
  },
  bioPhotoUrl: null, // will fall back to hero
  galleryImages: [
    {
      id: "1",
      url: "https://images.squarespace-cdn.com/content/v1/5e1a2b7a8a61b46ef7c6d5a1/1600000000000-YYYYYY/work1.jpg",
      altText: "Tide series #3, encaustic, 18×24″",
    },
    {
      id: "2",
      url: "https://images.squarespace-cdn.com/content/v1/5e1a2b7a8a61b46ef7c6d5a1/1600000000000-ZZZZZZ/work2.jpg",
      altText: "Morning burn, oil, 24×30″",
    },
    {
      id: "3",
      url: "https://images.squarespace-cdn.com/content/v1/5e1a2b7a8a61b46ef7c6d5a1/1600000000000-AAAAAA/work3.jpg",
      altText: "Salt flat, encaustic, 12×12″",
    },
  ],
  // AI-generated tags (what gets stored after upload analysis)
  aiTagsSample: {
    medium: "oil painting",
    colors: ["warm ochre", "misty blue", "deep umber"],
    scale: "large",
    style: "impressionist landscape",
    subjects: ["hills", "coastal fog", "natural light"],
    indoor_outdoor: "indoor",
    mood: "contemplative",
  },
};

const commissionBadge: Record<string, { label: string; cls: string }> = {
  OPEN: { label: "Open for commissions", cls: "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400" },
  CLOSED: { label: "Not taking commissions", cls: "bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400" },
  ON_REQUEST: { label: "Commissions by request", cls: "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400" },
};

// Use real artist images from the static site for demo
const DEMO_IMAGES = {
  hero: "/demo/isabella-hero.jpg",
  gallery: [
    "/demo/isabella-1.jpg",
    "/demo/isabella-2.jpg",
    "/demo/isabella-3.jpg",
  ],
};

export default function DemoProfilePage() {
  const artist = DEMO_ARTIST;
  const badge = commissionBadge[artist.commissionStatus];

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      {/* Demo banner */}
      <div className="mb-6 rounded-md bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 px-4 py-3 text-sm text-amber-800 dark:text-amber-300 flex items-center gap-2">
        <span>⚠</span>
        <span>Demo profile — static fixture data, no database required. <Link href="/login" className="underline">Sign in</Link> to see a real profile.</span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <a href="/" className="text-stone-400 dark:text-stone-500 text-sm hover:text-stone-600 dark:hover:text-stone-300 transition-colors">
          ← Art Here Portland
        </a>
        <button className="text-sm text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 px-4 py-2 rounded-md hover:border-stone-400 transition-colors cursor-not-allowed opacity-50">
          Edit profile
        </button>
      </div>

      {/* Hero image — uses a placeholder gradient when image 404s */}
      <div className="mb-8 rounded-lg overflow-hidden bg-stone-200 dark:bg-stone-800 h-72 flex items-center justify-center">
        <div className="text-stone-400 dark:text-stone-500 text-sm">
          [Hero image — 36×48″ oil on panel]
          <br />
          <span className="text-xs">(Connect a database and upload real images to see artwork here)</span>
        </div>
      </div>

      {/* Artist identity */}
      <div className="flex items-start gap-5 mb-8">
        {/* Bio photo falls back to hero if not set */}
        <div className="flex-shrink-0 w-20 h-20 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center text-stone-400 dark:text-stone-500 text-xs text-center leading-tight p-2">
          bio photo or hero fallback
        </div>
        <div>
          <h1 className="text-3xl font-medium text-stone-900 dark:text-stone-100">{artist.name}</h1>
          <p className="text-stone-500 dark:text-stone-400 mt-1">
            {artist.placeRelations.map((r) => r.place.name).join(" · ")}
          </p>
          <span className={`inline-block mt-2 text-xs font-medium px-2 py-1 rounded-full ${badge.cls}`}>
            {badge.label}
          </span>
        </div>
      </div>

      {/* Bio */}
      <p className="text-stone-600 dark:text-stone-300 leading-relaxed mb-10 whitespace-pre-wrap">{artist.bio}</p>

      {/* Gallery — adaptive 3-image grid */}
      <section className="mb-10">
        <h2 className="text-sm font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-4">Work</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {artist.galleryImages.map((img, i) => (
            <div key={img.id} className="rounded-lg overflow-hidden bg-stone-100 dark:bg-stone-800 aspect-square flex items-center justify-center">
              <span className="text-stone-400 dark:text-stone-500 text-xs text-center p-2">{img.altText}</span>
            </div>
          ))}
        </div>
      </section>

      {/* AI tags preview */}
      <section className="mb-10 rounded-lg bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 p-5">
        <h2 className="text-sm font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-3">
          AI-generated search tags (from image analysis)
        </h2>
        <div className="flex flex-wrap gap-2">
          {[
            artist.aiTagsSample.medium,
            `scale: ${artist.aiTagsSample.scale}`,
            artist.aiTagsSample.style,
            ...artist.aiTagsSample.colors,
            ...artist.aiTagsSample.subjects,
            artist.aiTagsSample.indoor_outdoor,
            artist.aiTagsSample.mood,
          ].map((tag) => (
            <span key={tag} className="text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 px-2 py-1 rounded-full">
              {tag}
            </span>
          ))}
        </div>
        <p className="text-stone-400 dark:text-stone-500 text-xs mt-3">These are generated automatically when an artist uploads artwork — never shown publicly.</p>
      </section>

      {/* Links */}
      <section className="border-t border-stone-100 dark:border-stone-800 pt-6 flex gap-4">
        <a href={artist.website} target="_blank" rel="noopener noreferrer"
          className="text-stone-500 dark:text-stone-400 text-sm hover:text-stone-800 dark:hover:text-stone-100 transition-colors">
          Website ↗
        </a>
        <a href={`https://instagram.com/${artist.instagram}`} target="_blank" rel="noopener noreferrer"
          className="text-stone-500 dark:text-stone-400 text-sm hover:text-stone-800 dark:hover:text-stone-100 transition-colors">
          @{artist.instagram} ↗
        </a>
      </section>
    </main>
  );
}
