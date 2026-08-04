import { prisma } from "@/lib/db";
import { requireAdminPage } from "@/lib/admin";
import LogoSlideManager from "./LogoSlideManager";

export default async function AdminLogoPage() {
  await requireAdminPage();
  const slides = await prisma.logoSlide.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div>
      <h1 className="text-2xl font-medium mb-2">Logo Animation</h1>
      <p className="text-sm text-[#888] mb-6 max-w-[640px]">
        The masked mark on the home, survey, and login pages cycles through these in order: solid
        color, wipe-reveal the image (credited to the artist name), hold, then dissolve into the{" "}
        <em>next</em> slide&apos;s color.
      </p>
      <LogoSlideManager initialSlides={slides} />
    </div>
  );
}
