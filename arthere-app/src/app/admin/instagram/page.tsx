import { prisma } from "@/lib/db";
import { requireAdminPage } from "@/lib/admin";
import InstagramPostManager from "./InstagramPostManager";

export default async function AdminInstagramPage() {
  await requireAdminPage();
  const posts = await prisma.instagramPost.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div>
      <h1 className="text-2xl font-medium mb-2">Instagram Carousel</h1>
      <p className="text-sm text-[#888] mb-6 max-w-[640px]">
        The row of posts in the home page&rsquo;s &ldquo;Follow Us&rdquo; section, shown left to
        right in this order. Images are cropped to a 3:4 portrait tile, so portrait screenshots
        work best. Each tile opens the @arthereproject profile unless you give it a specific post
        link. The whole row is hidden on the site when there are no posts with images.
      </p>
      <InstagramPostManager initialPosts={posts} />
    </div>
  );
}
