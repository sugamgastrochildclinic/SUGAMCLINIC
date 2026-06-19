import type { MetadataRoute } from "next";
import { connectToDatabase } from "@/lib/db";
import BlogPost from "@/models/BlogPost";
import Service from "@/models/Service";
import Gallery from "@/models/Gallery";
import { postSlug } from "@/lib/seo";

// Regenerate alongside the ISR pages so lastModified tracks content changes.
export const revalidate = 300;

// Latest updatedAt across a collection → realistic lastModified for list pages.
async function latestUpdate(model: any, filter: Record<string, any> = {}) {
  try {
    const doc = await model
      .findOne(filter)
      .sort({ updatedAt: -1 })
      .select("updatedAt")
      .lean();
    return (doc as any)?.updatedAt ? new Date((doc as any).updatedAt) : new Date();
  } catch {
    return new Date();
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Public origin — NOT NEXTAUTH_URL (an auth var). Set NEXT_PUBLIC_SITE_URL to
  // the real domain in production so emitted URLs aren't localhost.
  // Strip any trailing slash so `${base}/services` never produces a "//" URL
  // (the env var is sometimes set with a trailing slash).
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://sugamgastrochildclinic.com").replace(/\/+$/, "");

  // Defaults so the sitemap still builds if the DB is unreachable.
  let servicesUpdated = new Date();
  let galleryUpdated = new Date();
  let blogsUpdated = new Date();
  let blogPosts: any[] = [];

  try {
    await connectToDatabase();
    [servicesUpdated, galleryUpdated, blogsUpdated, blogPosts] = await Promise.all([
      latestUpdate(Service),
      latestUpdate(Gallery, {
        category: { $in: ["gallery", "services", "doctors"] },
      }),
      latestUpdate(BlogPost),
      BlogPost.find().select("title updatedAt").lean(),
    ]);
  } catch (err) {
    console.error("Sitemap DB error:", err);
  }

  // One entry per published blog post (the indexable /blogs/[slug] detail pages).
  const blogPostEntries: MetadataRoute.Sitemap = (blogPosts || []).map((p: any) => ({
    url: `${base}/blogs/${postSlug({ title: p.title, _id: p._id.toString() })}`,
    lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${base}/services`,
      lastModified: servicesUpdated,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${base}/gallery`,
      lastModified: galleryUpdated,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${base}/blogs`,
      lastModified: blogsUpdated,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...blogPostEntries,
  ];
}
