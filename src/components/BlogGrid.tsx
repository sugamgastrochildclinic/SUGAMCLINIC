"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Calendar, User, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { translations, Language } from "@/lib/translations";

import ClientDate from "@/components/ClientDate";
import { postSlug } from "@/lib/seo";

interface BlogGridProps {
  posts: any[];
  lang: Language;
}

export default function BlogGrid({ posts, lang }: BlogGridProps) {
  const t = translations[lang];

  return (
    <section id="blog" className="py-24 bg-brand-blush/10 border-b border-brand-border/40 relative overflow-hidden">
      {/* Desktop-only minimal background decoration */}
      <div className="absolute inset-0 z-0 hidden lg:block pointer-events-none">
        {/* 1. Diagonal stripe band */}
        <div
          className="absolute top-0 left-0 w-[30%] h-full opacity-[0.04]"
          style={{
            background: `repeating-linear-gradient(
              -45deg,
              #00a896,
              #00a896 1.5px,
              transparent 1.5px,
              transparent 28px
            )`,
          }}
        />
        {/* 2. Top-right ring */}
        <div className="absolute top-[-40px] right-[-40px] w-48 h-48 rounded-full border border-pink/10" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        
        {/* Header */}
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-tint text-teal-dark text-xs font-semibold mb-4">
            <BookOpen className="w-4 h-4 text-teal" />
            <span>{t.blogBadge}</span>
          </div>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-brand-ink mb-4">{t.blogTitle}</h2>
          <p className="text-brand-muted text-sm sm:text-base">{t.blogDesc}</p>
        </motion.div>

        {/* Blogs Grid */}
        {posts.length === 0 ? (
          <div className="text-center text-sm text-brand-muted py-8">
            No health tips articles published yet.
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.slice(0, 3).map((post, idx) => (
                <Link
                  key={post._id}
                  href={`/blogs/${postSlug(post)}`}
                  className={`group bg-white rounded-3xl border border-brand-border overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between ${
                    idx >= 2 ? "hidden lg:block" : ""
                  }`}
                >
                  <div>
                    {/* Image */}
                    <div className="relative w-full aspect-video bg-teal-tint/30">
                      {post.image ? (
                        <Image
                          src={post.image}
                          alt={post.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          loading="lazy"
                          quality={70}
                          className="object-cover"
                        />
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

            {/* See All Button */}
            {posts.length > (posts.length > 2 ? 2 : posts.length) && (
              <div className="flex justify-center mt-12">
                <Link
                  href="/blogs"
                  className="px-8 py-3.5 rounded-full border border-teal text-teal hover:bg-teal hover:text-white font-bold text-sm transition-all duration-300 shadow-sm active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <span>{lang === "en" ? "See All Health Tips" : "அனைத்து கட்டுரைகளும் காண்க"}</span>
                </Link>
              </div>
            )}
          </div>
        )}

      </div>
    </section>
  );
}
