"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { InstagramPost } from "@prisma/client";
import {
  createInstagramPost,
  updateInstagramPost,
  deleteInstagramPost,
  moveInstagramPost,
} from "./actions";
import { resizeImageForUpload } from "@/lib/client-image-resize";

const BTN =
  "text-xs px-3 py-1.5 rounded-full border border-[#e5e5e5] text-[#555] hover:border-[#999] transition-colors disabled:opacity-40 disabled:pointer-events-none";

export default function InstagramPostManager({ initialPosts }: { initialPosts: InstagramPost[] }) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setPosts(initialPosts), [initialPosts]);

  function scheduleSave(id: string, data: { alt?: string; permalink?: string }) {
    clearTimeout(saveTimers.current[id]);
    saveTimers.current[id] = setTimeout(() => {
      updateInstagramPost(id, data).catch(() => {});
    }, 500);
  }

  function patchLocal(id: string, data: Partial<InstagramPost>) {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
  }

  async function handleAdd() {
    await createInstagramPost();
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this post from the carousel?")) return;
    setPosts((prev) => prev.filter((p) => p.id !== id));
    await deleteInstagramPost(id);
    router.refresh();
  }

  async function handleMove(id: string, direction: "up" | "down") {
    await moveInstagramPost(id, direction);
    router.refresh();
  }

  async function handleImageUpload(id: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingId(id);
    try {
      const form = new FormData();
      form.append("file", await resizeImageForUpload(file));
      form.append("prefix", "instagram");
      const res = await fetch("/api/admin/upload/blob", { method: "POST", body: form });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Upload failed");
      const { url } = (await res.json()) as { url: string };
      patchLocal(id, { imageUrl: url });
      await updateInstagramPost(id, { imageUrl: url });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    }
    setUploadingId(null);
    e.target.value = "";
  }

  return (
    <div className="space-y-4">
      {posts.map((post, i) => (
        <div key={post.id} className="bg-white border border-[#e5e5e5] rounded-lg p-4 flex gap-4 items-start">
          {/* 3:4 preview — the same portrait crop the carousel renders. */}
          <div className="relative w-24 aspect-[3/4] rounded-md overflow-hidden bg-[#f0f0f0] flex-shrink-0">
            {post.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#ccc] text-xs text-center px-1">
                no image
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            <label className="text-xs text-[#888] flex flex-col gap-1">
              Alt text <span className="text-[#bbb]">(describes the photo for screen readers)</span>
              <input
                type="text"
                defaultValue={post.alt}
                onChange={(e) => {
                  patchLocal(post.id, { alt: e.target.value });
                  scheduleSave(post.id, { alt: e.target.value });
                }}
                className="px-2.5 py-1.5 border border-[#e5e5e5] rounded text-sm text-[#1a1a1a]"
              />
            </label>

            <label className="text-xs text-[#888] flex flex-col gap-1">
              Post link <span className="text-[#bbb]">(optional — blank links to the @arthereproject profile)</span>
              <input
                type="text"
                placeholder="https://www.instagram.com/p/…"
                defaultValue={post.permalink}
                onChange={(e) => {
                  patchLocal(post.id, { permalink: e.target.value });
                  scheduleSave(post.id, { permalink: e.target.value });
                }}
                className="px-2.5 py-1.5 border border-[#e5e5e5] rounded text-sm text-[#1a1a1a]"
              />
            </label>

            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleImageUpload(post.id, e)}
                className="hidden"
                id={`ig-upload-${post.id}`}
              />
              <label htmlFor={`ig-upload-${post.id}`} className={`${BTN} cursor-pointer`}>
                {uploadingId === post.id ? "Uploading…" : post.imageUrl ? "Replace image" : "Upload image"}
              </label>

              <button type="button" className={BTN} disabled={i === 0} onClick={() => handleMove(post.id, "up")}>
                Move up
              </button>
              <button
                type="button"
                className={BTN}
                disabled={i === posts.length - 1}
                onClick={() => handleMove(post.id, "down")}
              >
                Move down
              </button>
              <button
                type="button"
                onClick={() => handleDelete(post.id)}
                className="text-xs px-3 py-1.5 rounded-full border border-red-200 text-red-500 hover:border-red-400 transition-colors"
              >
                Delete
              </button>

              {!post.imageUrl && (
                <span className="text-xs text-[#c48a00]">Hidden from the site until an image is added</span>
              )}
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={handleAdd}
        className="text-sm px-4 py-2 rounded-full bg-[#1a1a1a] text-white hover:opacity-80 transition-opacity"
      >
        + Add post
      </button>
    </div>
  );
}
