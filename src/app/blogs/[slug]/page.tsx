import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, User, Tag } from "lucide-react";
import { connectToDatabase } from "@/lib/db";
import BlogPost from "@/models/BlogPost";
import JsonLd from "@/components/JsonLd";
import {
  graph,
  breadcrumbSchema,
  blogPostSchema,
  postSlug,
  idFromSlug,
  abs,
  SITE_NAME,
} from "@/lib/seo";

// ISR — cached, busted on demand via revalidatePath in admin mutations.
export const revalidate = 300;

const isValidId = (id: string) => /^[a-f0-9]{24}$/i.test(id);

async function getPost(slug: string) {
  const id = idFromSlug(slug);
  if (!isValidId(id)) return null;
  try {
    await connectToDatabase();
    return await BlogPost.findById(id).lean<any>();
  } catch (err) {
    console.error("Blog post load error:", err);
    return null;
  }
}

const serialize = (p: any) => ({
  ...p,
  _id: p._id ? p._id.toString() : "",
  createdAt: p.createdAt ? p.createdAt.toISOString() : new Date().toISOString(),
  updatedAt: p.updatedAt ? p.updatedAt.toISOString() : new Date().toISOString(),
});

// Pre-render every existing post at build; new ones render on first request (ISR).
export async function generateStaticParams() {
  try {
    await connectToDatabase();
    const posts = await BlogPost.find().select("title").lean<any[]>();
    return posts.map((p) => ({ slug: postSlug({ title: p.title, _id: p._id.toString() }) }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Article Not Found" };

  const desc = String(post.content || "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 155);
  const canonical = `/blogs/${postSlug({ title: post.title, _id: post._id.toString() })}`;

  return {
    title: `${post.title} | ${SITE_NAME}`,
    description: desc,
    ...(post.tags?.length && { keywords: post.tags }),
    alternates: { canonical },
    openGraph: {
      title: post.title,
      description: desc,
      url: canonical,
      type: "article",
      ...(post.image && { images: [{ url: abs(post.image) }] }),
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const raw = await getPost(slug);
  if (!raw) notFound();

  const post = serialize(raw);
  const url = abs(`/blogs/${postSlug({ title: post.title, _id: post._id })}`);
  const structuredData = graph(
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Blog", path: "/blogs" },
      { name: post.title, path: `/blogs/${postSlug({ title: post.title, _id: post._id })}` },
    ]),
    blogPostSchema(post, url)
  );

  return (
    <div className="pt-32 pb-24">
      <JsonLd data={structuredData} />
      <article className="max-w-3xl lg:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <Link
          href="/blogs"
          className="inline-flex items-center gap-2 text-teal font-bold hover:text-teal-dark transition-all text-sm mb-6 group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Blog</span>
        </Link>

        {/* Mobile: single column (title → meta → image → content), unchanged.
            Desktop (lg+): image as a sticky left column, text on the right. */}
        <div className="flex flex-col lg:flex-row lg:gap-12 lg:items-stretch">
          {/* Desktop-only left image column — fills the full column height */}
          {post.image && (
            <div className="hidden lg:block lg:w-[42%] lg:shrink-0">
              <div className="relative w-full h-full min-h-[28rem] rounded-2xl overflow-hidden border border-brand-border bg-teal-tint/30">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  priority
                  sizes="42vw"
                  className="object-contain"
                />
              </div>
            </div>
          )}

          <div className="lg:flex-1">
            <span className="text-[10px] font-bold bg-teal-tint px-3 py-1 rounded-full text-teal-dark border border-teal/20 uppercase tracking-wider">
              {post.category}
            </span>

            <h1 className="font-heading font-bold text-3xl sm:text-4xl text-brand-ink mt-4 mb-4">
              {post.title}
            </h1>

            <div className="flex items-center gap-4 text-xs text-brand-muted font-bold uppercase mb-6 pb-6 border-b border-brand-border">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {post.author}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(post.createdAt).toLocaleDateString()}
              </span>
            </div>

            {/* Mobile-only inline image — keeps the original stacked layout */}
            {post.image && (
              <div className="lg:hidden relative w-full aspect-video rounded-2xl overflow-hidden mb-8 border border-brand-border bg-teal-tint/30">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  priority
                  sizes="100vw"
                  className="object-cover"
                />
              </div>
            )}

            <div className="text-sm sm:text-base text-brand-ink leading-relaxed space-y-4 whitespace-pre-wrap">
              {post.content}
            </div>

            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-10 pt-6 border-t border-brand-border">
                <Tag className="w-4 h-4 text-brand-muted shrink-0" />
                {post.tags.map((tag: string, i: number) => (
                  <span key={i} className="text-xs bg-brand-blush text-pink-safe px-2.5 py-1 rounded-lg font-semibold">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
