"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ArrowLeft, BookOpen, Calendar, User, ArrowUpRight, Search } from "lucide-react";
import Link from "next/link";
import ClientDate from "@/components/ClientDate";
import { postSlug } from "@/lib/seo";

interface AllBlogsViewProps {
  posts: any[];
}

export default function AllBlogsView({ posts }: AllBlogsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = ["all", ...Array.from(new Set(posts.map((p) => p.category || "General Health")))];

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      {/* Back Button & Title */}
      <div className="mb-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-teal font-bold hover:text-teal-dark transition-all text-sm mb-6 group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Home</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-brand-border/60 pb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-tint text-teal-dark text-xs font-semibold mb-3">
              <BookOpen className="w-4 h-4 text-teal" />
              <span>Health Library</span>
            </div>
            <h1 className="font-heading font-bold text-3xl sm:text-4xl text-brand-ink">
              Sugam Health Advice & Blogs
            </h1>
            <p className="text-brand-muted text-sm mt-2">
              Stay informed with medical tips and parenting guides written by our doctors.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full max-w-xs shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
            <input
              type="text"
              placeholder="Search health tips..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-brand-border focus:border-teal focus:outline-none text-xs text-brand-ink"
            />
          </div>
        </div>

        {/* Categories filters */}
        <div className="flex flex-wrap gap-2 mt-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer capitalize ${
                selectedCategory === cat
                  ? "bg-teal border-teal text-white shadow-md"
                  : "bg-white border-brand-border text-brand-muted hover:border-teal hover:text-teal"
              }`}
            >
              {cat === "all" ? "All Articles" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <h2 className="sr-only">All Articles</h2>
      {filteredPosts.length === 0 ? (
        <div className="text-center py-20 text-brand-muted text-sm border border-dashed border-brand-border rounded-3xl bg-white max-w-md mx-auto">
          No articles matching your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map((post) => (
            <Link
              key={post._id}
              href={`/blogs/${postSlug(post)}`}
              className="group bg-white rounded-3xl border border-brand-border overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Image */}
                <div className="relative w-full aspect-video bg-teal-tint/30">
                  {post.image ? (
                    <Image src={post.image} alt={post.title} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-teal-tint text-teal/40 font-heading font-semibold text-lg">
                      Sugam Clinic
                    </div>
                  )}
                  <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-[10px] font-bold px-3 py-1 rounded-full text-teal-dark border border-brand-border uppercase">
                    {post.category}
                  </span>
                </div>

                {/* Body */}
                <div className="p-6">
                  <div className="flex items-center gap-4 text-[10px] text-brand-muted font-bold uppercase mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <ClientDate date={post.createdAt} />
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {post.author}
                    </span>
                  </div>

                  <h3 className="font-heading font-bold text-lg text-brand-ink mb-3 leading-snug line-clamp-2">
                    {post.title}
                  </h3>

                  <p className="text-sm text-brand-muted leading-relaxed line-clamp-3 mb-4">
                    {post.content}
                  </p>
                </div>
              </div>

              <div className="px-6 pb-6 pt-0">
                <span className="flex items-center gap-1 text-teal font-semibold text-xs group-hover:text-teal-dark transition-colors">
                  <span>Read Article</span>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
