"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { StoryVideo } from "@prisma/client";
import { createStoryVideo, updateStoryVideo, deleteStoryVideo, moveStoryVideo } from "./actions";
import { storyVideoEmbedUrl } from "@/lib/story-video";

const BTN =
  "text-xs px-3 py-1.5 rounded-full border border-[#e5e5e5] text-[#555] hover:border-[#999] transition-colors disabled:opacity-40 disabled:pointer-events-none";
const INPUT = "px-2.5 py-1.5 border border-[#e5e5e5] rounded text-sm text-[#1a1a1a]";

type Fields = { title?: string; byline?: string; description?: string; videoUrl?: string };

export default function StoryVideoManager({ initialVideos }: { initialVideos: StoryVideo[] }) {
  const router = useRouter();
  const [videos, setVideos] = useState(initialVideos);
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setVideos(initialVideos), [initialVideos]);

  function patchLocal(id: string, data: Partial<StoryVideo>) {
    setVideos((prev) => prev.map((v) => (v.id === id ? { ...v, ...data } : v)));
  }

  function edit(id: string, data: Fields) {
    patchLocal(id, data);
    clearTimeout(saveTimers.current[id]);
    saveTimers.current[id] = setTimeout(() => {
      updateStoryVideo(id, data).catch(() => {});
    }, 500);
  }

  async function handleAdd() {
    await createStoryVideo();
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this video from Community Stories?")) return;
    setVideos((prev) => prev.filter((v) => v.id !== id));
    await deleteStoryVideo(id);
    router.refresh();
  }

  async function handleMove(id: string, direction: "up" | "down") {
    await moveStoryVideo(id, direction);
    router.refresh();
  }

  async function handlePublished(id: string, published: boolean) {
    patchLocal(id, { published });
    await updateStoryVideo(id, { published });
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={handleAdd}
        className="text-sm px-4 py-2 rounded-full bg-[#1a1a1a] text-white hover:opacity-80 transition-opacity"
      >
        + Add video
      </button>
      <p className="text-xs text-[#888] -mt-1">New videos are added to the top. They stay hidden until you publish them.</p>

      {videos.map((video, i) => {
        const embed = video.videoUrl ? storyVideoEmbedUrl(video.videoUrl) : null;
        return (
          <div key={video.id} className="bg-white border border-[#e5e5e5] rounded-lg p-4 flex gap-4 items-start flex-wrap sm:flex-nowrap">
            <div className="relative w-full sm:w-64 aspect-video rounded-md overflow-hidden bg-[#f0f0f0] flex-shrink-0">
              {embed ? (
                <iframe
                  src={embed}
                  title={video.title || "Video preview"}
                  className="w-full h-full"
                  allow="fullscreen; picture-in-picture"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#ccc] text-xs text-center px-2">
                  {video.videoUrl ? "link not recognized" : "no video yet"}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-3">
              <label className="text-xs text-[#888] flex flex-col gap-1">
                Video link <span className="text-[#bbb]">(YouTube or Vimeo)</span>
                <input
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=…"
                  value={video.videoUrl}
                  onChange={(e) => edit(video.id, { videoUrl: e.target.value })}
                  className={INPUT}
                />
              </label>
              <label className="text-xs text-[#888] flex flex-col gap-1">
                Title
                <input type="text" value={video.title} onChange={(e) => edit(video.id, { title: e.target.value })} className={INPUT} />
              </label>
              <label className="text-xs text-[#888] flex flex-col gap-1">
                Who is telling the story <span className="text-[#bbb]">(optional, e.g. &ldquo;Maria Lopez, muralist&rdquo;)</span>
                <input type="text" value={video.byline} onChange={(e) => edit(video.id, { byline: e.target.value })} className={INPUT} />
              </label>
              <label className="text-xs text-[#888] flex flex-col gap-1">
                Description <span className="text-[#bbb]">(optional)</span>
                <textarea
                  rows={3}
                  value={video.description}
                  onChange={(e) => edit(video.id, { description: e.target.value })}
                  className={INPUT}
                />
              </label>

              <div className="flex items-center gap-2 flex-wrap">
                <label className="text-xs text-[#555] flex items-center gap-1.5 mr-2">
                  <input
                    type="checkbox"
                    checked={video.published}
                    onChange={(e) => handlePublished(video.id, e.target.checked)}
                  />
                  Published
                </label>
                <button type="button" className={BTN} disabled={i === 0} onClick={() => handleMove(video.id, "up")}>
                  Move up
                </button>
                <button type="button" className={BTN} disabled={i === videos.length - 1} onClick={() => handleMove(video.id, "down")}>
                  Move down
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(video.id)}
                  className="text-xs px-3 py-1.5 rounded-full border border-red-200 text-red-500 hover:border-red-400 transition-colors"
                >
                  Delete
                </button>
                {video.published && !embed && (
                  <span className="text-xs text-[#c48a00]">Hidden from the site until the link is a recognized YouTube or Vimeo link</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
