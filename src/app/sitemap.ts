import type { MetadataRoute } from "next";
import { connectToDatabase } from "@/lib/db";
import BlogPost from "@/models/BlogPost";
import Service from "@/models/Service";
import Gallery from "@/models/Gallery";

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
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  // Defaults so the sitemap still builds if the DB is unreachable.
  let servicesUpdated = new Date();
  let galleryUpdated = new Date();
  let blogsUpdated = new Date();

  try {
    await connectToDatabase();
    [servicesUpdated, galleryUpdated, blogsUpdated] = await Promise.all([
      latestUpdate(Service),
      latestUpdate(Gallery, {
        category: { $in: ["gallery", "services", "doctors"] },
      }),
      latestUpdate(BlogPost),
    ]);
  } catch (err) {
    console.error("Sitemap DB error:", err);
  }

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
      priority: 0.8,
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
  ];
}
