import { prisma } from "@/lib/db";
import { requireAdminPage } from "@/lib/admin";
import StoryVideoManager from "./StoryVideoManager";

export default async function AdminVideosPage() {
  await requireAdminPage();
  const videos = await prisma.storyVideo.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div>
      <h1 className="text-2xl font-medium mb-2">Community Stories Videos</h1>
      <p className="text-sm text-[#888] mb-6 max-w-[640px]">
        The videos on the <a href="/stories" className="underline">/stories</a> page, shown top to
        bottom in this order. Upload the video to YouTube or Vimeo first, then paste its link here.
        A video appears on the site only when it is published and its link is recognized; until then
        the page keeps saying &ldquo;Coming soon!&rdquo;
      </p>
      <StoryVideoManager initialVideos={videos} />
    </div>
  );
}
