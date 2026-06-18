"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ZoomIn, Eye, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useFocusTrap } from "@/lib/useFocusTrap";

interface AllGalleryViewProps {
  gallery: any[];
}

export default function AllGalleryView({ gallery }: AllGalleryViewProps) {
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const trapRef = useFocusTrap<HTMLDivElement>(!!selectedImg);

  // Lightbox a11y: close on Esc, lock background scroll while open.
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

  const categories = [
    { key: "all", label: "All Photos" },
    { key: "gallery", label: "Clinic Spaces" },
    { key: "doctors", label: "Doctors & Team" },
    { key: "services", label: "Services & Tech" },
  ];

  const filteredItems = gallery.filter((item) => {
    if (filter === "all") return true;
    return item.category === filter;
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
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-brand-border/60 pb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-tint text-teal-dark text-xs font-semibold mb-3">
              <Eye className="w-4 h-4 text-teal" />
              <span>Tour & Media</span>
            </div>
            <h1 className="font-heading font-bold text-3xl sm:text-4xl text-brand-ink">
              Sugam Clinic Media Library
            </h1>
            <p className="text-brand-muted text-sm mt-2">
              Explore our state-of-the-art diagnostic machines, consulting rooms, and clinic ambiance.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setFilter(cat.key)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  filter === cat.key
                    ? "bg-teal border-teal text-white shadow-md"
                    : "bg-white border-brand-border text-brand-muted hover:border-teal hover:text-teal"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Gallery Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-20 text-brand-muted text-sm border border-dashed border-brand-border rounded-3xl bg-white max-w-md mx-auto">
          No media files found in this category.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item._id}
              onClick={() => setSelectedImg(item.imageUrl)}
              className="relative aspect-square rounded-3xl overflow-hidden border border-brand-border cursor-pointer group shadow-sm bg-white"
            >
              <Image
                src={item.imageUrl}
                alt={item.caption || "Clinic Photo"}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                quality={72}
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
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
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal — portaled to body so it renders above the fixed navbar. */}
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
            <img
              src={selectedImg}
              alt="Clinic Lightbox View"
              decoding="async"
              className="object-contain max-w-full max-h-[85vh] rounded-2xl"
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
