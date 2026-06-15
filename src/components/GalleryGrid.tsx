"use client";

import React, { useState } from "react";
import Image from "next/image";
import { X, ZoomIn, Eye } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { translations, Language } from "@/lib/translations";

interface GalleryGridProps {
  gallery: any[];
  lang: Language;
}

export default function GalleryGrid({ gallery, lang }: GalleryGridProps) {
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const displayItems = gallery.slice(0, 8);
  const t = translations[lang];

  return (
    <section id="gallery" className="py-24 bg-brand-blush/10 border-b border-brand-border/40 relative overflow-hidden">
      {/* Desktop-only minimal background decoration */}
      <div className="absolute inset-0 z-0 hidden lg:block pointer-events-none">
        {/* 1. Dot Grid Overlay */}
        <div
          className="absolute bottom-0 right-0 w-[30%] h-[60%] opacity-[0.1]"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(0,168,150,0.15) 1.5px, transparent 1.5px)`,
            backgroundSize: "36px 36px",
          }}
        />
        {/* 2. Left rotated geometric square */}
        <div className="absolute top-[30%] left-[5%] w-7 h-7 rotate-[30deg] border border-teal/15" />
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
            <Eye className="w-4 h-4 text-teal" />
            <span>{t.galleryBadge}</span>
          </div>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-brand-ink mb-4">{t.galleryTitle}</h2>
          <p className="text-brand-muted text-sm sm:text-base">{t.galleryDesc}</p>
        </motion.div>

        {/* Gallery Grid */}
        {gallery.length === 0 ? (
          <div className="text-center py-12 text-brand-muted text-sm border border-dashed border-brand-border rounded-3xl bg-white max-w-md mx-auto">
            {lang === "en" ? "No gallery images uploaded yet." : "புகைப்படங்கள் ஏதும் இன்னும் பதிவேற்றப்படவில்லை."}
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {displayItems.map((item: any, idx: number) => (
                <motion.div
                  key={item._id}
                  onClick={() => setSelectedImg(item.imageUrl)}
                  initial={{ opacity: 0, scale: 0.92 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ duration: 0.45, delay: idx * 0.07, ease: "easeOut" }}
                  className={`relative aspect-square rounded-3xl overflow-hidden border border-brand-border cursor-pointer group shadow-sm bg-white ${idx >= 2 ? "hidden sm:block" : ""
                    }`}
                >
                  <Image
                    src={item.imageUrl}
                    alt={item.caption || "Clinic Photo"}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    quality={70}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />

                  {/* Default Green Layout Overlay (Visible initially, hides on hover) */}
                  <div className="absolute inset-0 bg-teal/8 mix-blend-multiply group-hover:opacity-0 transition-opacity duration-300 z-10 pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-t from-teal-dark/15 via-transparent to-transparent opacity-100 group-hover:opacity-0 transition-opacity duration-300 z-10 pointer-events-none" />

                  {/* Hover Clear Zoom Indicator */}
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20">
                    <div className="bg-white text-teal p-3.5 rounded-full shadow-md transform scale-75 group-hover:scale-100 transition-transform duration-300">
                      <ZoomIn className="w-5 h-5" />
                    </div>
                  </div>

                  {item.caption && (
                    <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl border border-brand-border text-xs text-brand-ink font-semibold truncate z-20">
                      {item.caption}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* See All Button */}
            {gallery.length > (gallery.length > 2 ? 2 : gallery.length) && (
              <div className="flex justify-center mt-12">
                <Link
                  href="/gallery"
                  className="px-8 py-3.5 rounded-full border border-teal text-teal hover:bg-teal hover:text-white font-bold text-sm transition-all duration-300 shadow-sm active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <span>{lang === "en" ? "See All Gallery Images" : "புகைப்படங்கள் அனைத்தும் காண்க"}</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Lightbox Modal */}
        {selectedImg && (
          <div className="fixed inset-0 z-50 bg-brand-ink/90 backdrop-blur-md flex items-center justify-center p-4">
            <button
              onClick={() => setSelectedImg(null)}
              className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all active:scale-95 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="relative w-full max-w-4xl max-h-[85vh] aspect-video rounded-3xl overflow-hidden flex items-center justify-center">
              <Image
                src={selectedImg}
                alt="Clinic Lightbox View"
                fill
                sizes="(max-width: 1024px) 100vw, 896px"
                quality={80}
                className="object-contain rounded-2xl"
              />
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
