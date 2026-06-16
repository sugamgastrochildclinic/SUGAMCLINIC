"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X, ZoomIn, Eye, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { translations, Language } from "@/lib/translations";
import { useFocusTrap } from "@/lib/useFocusTrap";

interface GalleryGridProps {
  gallery: any[];
  lang: Language;
}

// Bento layout. The 7-tile pattern below tiles a 4-col grid (desktop) and a
// 2-col grid (mobile) with no gaps when grid-flow-dense is on. Fewer images
// degrade gracefully; dense packing backfills any holes.
//   idx0 = 2x2 feature, idx3/idx4 = 2x1 wide, the rest = 1x1.
// Bento spans are md-prefixed so they apply on desktop only. On mobile every
// tile is a uniform 1x1 cell in the 2-col grid.
const SPANS = [
  "md:col-span-2 md:row-span-2",
  "md:col-span-1 md:row-span-1",
  "md:col-span-1 md:row-span-1",
  "md:col-span-2 md:row-span-1",
  "md:col-span-2 md:row-span-1",
  "md:col-span-1 md:row-span-1",
  "md:col-span-1 md:row-span-1",
];

export default function GalleryGrid({ gallery, lang }: GalleryGridProps) {
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const trapRef = useFocusTrap<HTMLDivElement>(!!selectedImg);

  // Lightbox a11y: close on Esc and lock background scroll while open.
  useEffect(() => {
    if (!selectedImg) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedImg(null);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [selectedImg]);
  const displayItems = gallery.slice(0, 4);
  const remaining = gallery.length - displayItems.length;
  const t = translations[lang];

  return (
    <section id="gallery" className="py-24 bg-brand-blush/10 border-b border-brand-border/40 relative overflow-hidden">
      {/* Desktop-only minimal background decoration */}
      <div className="absolute inset-0 z-0 hidden lg:block pointer-events-none">
        <div
          className="absolute bottom-0 right-0 w-[30%] h-[60%] opacity-[0.1]"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(0,168,150,0.15) 1.5px, transparent 1.5px)`,
            backgroundSize: "36px 36px",
          }}
        />
        <div className="absolute top-[30%] left-[5%] w-7 h-7 rotate-[30deg] border border-teal/15" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">

        {/* Header */}
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-tint text-teal-dark text-xs font-semibold mb-4">
            <Eye className="w-4 h-4 text-teal" />
            <span>{t.galleryBadge}</span>
          </div>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-brand-ink mb-4">{t.galleryTitle}</h2>
          <p className="text-brand-muted text-sm sm:text-base">{t.galleryDesc}</p>
        </motion.div>

        {/* Bento Gallery */}
        {gallery.length === 0 ? (
          <div className="text-center py-12 text-brand-muted text-sm border border-dashed border-brand-border rounded-3xl bg-white max-w-md mx-auto">
            {lang === "en" ? "No gallery images uploaded yet." : "புகைப்படங்கள் ஏதும் இன்னும் பதிவேற்றப்படவில்லை."}
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 grid-flow-dense gap-3 sm:gap-4 auto-rows-[150px] sm:auto-rows-[175px] lg:auto-rows-[210px]">
              {displayItems.map((item: any, idx: number) => {
                const span = SPANS[idx % SPANS.length];
                const isFeature = idx === 0;
                return (
                  <motion.button
                    type="button"
                    key={item._id}
                    onClick={() => setSelectedImg(item.imageUrl)}
                    initial={{ opacity: 0, scale: 0.94 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, amount: 0.1 }}
                    transition={{ duration: 0.5, delay: idx * 0.06, ease: [0.22, 1, 0.36, 1] }}
                    className={`group relative overflow-hidden rounded-3xl border border-brand-border bg-white shadow-sm text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 ${span}`}
                    aria-label={item.caption || "View clinic photo"}
                  >
                    <Image
                      src={item.imageUrl}
                      alt={item.caption || "Clinic Photo"}
                      fill
                      sizes={span.includes("col-span-2")
                        ? "(max-width: 768px) 50vw, 50vw"
                        : "(max-width: 768px) 50vw, 25vw"}
                      quality={isFeature ? 90 : 70}
                      priority={isFeature}
                      className="object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                    />

                    {/* Resting tint, lifts on hover to reveal full color */}
                    <div className="absolute inset-0 z-10 bg-teal/[0.07] mix-blend-multiply transition-opacity duration-300 group-hover:opacity-0 pointer-events-none" />
                    <div className="absolute inset-0 z-10 bg-gradient-to-t from-teal-dark/25 via-transparent to-transparent transition-opacity duration-300 group-hover:opacity-0 pointer-events-none" />

                    {/* Hover zoom affordance */}
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-brand-ink/15 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <span className="rounded-full bg-white p-3.5 text-teal shadow-lg scale-75 transition-transform duration-300 group-hover:scale-100">
                        <ZoomIn className="w-5 h-5" />
                      </span>
                    </div>

                    {item.caption && (
                      <div className="absolute inset-x-3 bottom-3 z-20 sm:inset-x-4 sm:bottom-4">
                        <span
                          className={`block truncate rounded-xl border border-brand-border bg-white/90 px-3 py-2 font-semibold text-brand-ink backdrop-blur-sm ${
                            isFeature ? "text-sm" : "text-xs"
                          }`}
                        >
                          {item.caption}
                        </span>
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* See More — shows 4 tiles, rest behind button (desktop + mobile) */}
            {remaining > 0 && (
              <div className="flex justify-center mt-10 sm:mt-12">
                <Link
                  href="/gallery"
                  className="group flex items-center gap-2 rounded-full border border-teal bg-white px-7 py-3 sm:px-8 sm:py-3.5 text-sm font-bold text-teal shadow-sm transition-all duration-300 hover:bg-teal hover:text-white active:scale-95 cursor-pointer"
                >
                  <span>{lang === "en" ? "See More" : "மேலும் காண்க"}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Lightbox Modal — portaled to body so it escapes the section's
          stacking context and renders above the fixed navbar. */}
      {mounted && selectedImg && createPortal(
        <div ref={trapRef} className="fixed inset-0 z-[100] bg-brand-ink/90 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setSelectedImg(null)} role="dialog" aria-modal="true" aria-label="Gallery image viewer">
          <button
            onClick={() => setSelectedImg(null)}
            className="absolute top-6 right-6 z-[110] bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all active:scale-95 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="relative w-full max-w-4xl max-h-[85vh] aspect-video rounded-3xl overflow-hidden flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <Image
              src={selectedImg}
              alt="Clinic Lightbox View"
              fill
              sizes="(max-width: 1024px) 100vw, 896px"
              quality={90}
              className="object-contain rounded-2xl"
            />
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}
