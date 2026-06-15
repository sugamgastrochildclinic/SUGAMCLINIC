"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const MIN_DURATION = 600; // ms the loader stays up
const FADE_DURATION = 500; // ms cross-fade out (matches CSS transition below)

/**
 * Brand loading screen — intentionally framer-motion-FREE.
 *
 * This overlay renders before everything else, so keeping it on pure CSS
 * (Tailwind `animate-spin`/`animate-ping` + a few keyframes in globals.css)
 * means no animation library sits on the first-paint critical path.
 * Content is already server-rendered behind it; this is just a brand flash.
 */
export default function LoadingScreen() {
  const [mounted, setMounted] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Respect reduced-motion: skip the loader entirely.
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      setMounted(false);
      return;
    }

    const fadeTimer = window.setTimeout(() => setFading(true), MIN_DURATION);
    const unmountTimer = window.setTimeout(
      () => setMounted(false),
      MIN_DURATION + FADE_DURATION
    );
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(unmountTimer);
    };
  }, []);

  // Lock scroll while the loader is up.
  useEffect(() => {
    document.body.style.overflow = mounted ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-white transition-opacity duration-500 ease-in-out ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Logo group is the centered flex child, so the logo sits at the EXACT
          center of the viewport on every screen size. The progress bar + text
          are absolutely positioned below the center and therefore never push
          the logo off-center. */}
      <div className="relative flex items-center justify-center animate-loader-pop">
        {/* Soft pulsing halo */}
        <span className="absolute h-36 w-36 rounded-full bg-teal-tint/50 animate-ping" />

        {/* Spinning gradient ring */}
        <span className="absolute h-32 w-32 rounded-full border-4 border-teal-tint border-t-teal border-r-teal/60 animate-spin" />

        {/* Logo — dead center of the screen */}
        <div className="relative h-24 w-24 overflow-hidden rounded-full bg-white shadow-lg ring-1 ring-teal/20">
          <Image
            src="/hero-logo.jpg"
            alt="Sugam Child & Gastro Care Clinic"
            fill
            priority
            sizes="96px"
            className="object-cover"
          />
        </div>
      </div>

      {/* Progress bar + label, pinned below the centered logo (does not affect
          the logo's centering). */}
      <div className="absolute left-1/2 top-[calc(50%+5.5rem)] -translate-x-1/2 flex flex-col items-center w-full px-4">
        <div className="h-1 w-44 max-w-[70vw] overflow-hidden rounded-full bg-teal-tint">
          <div className="h-full w-1/3 rounded-full bg-teal animate-loader-bar" />
        </div>
        <p className="mt-5 font-heading text-sm tracking-wide text-brand-muted text-center animate-loader-fade-up">
          Sugam Child &amp; Gastro Care
        </p>
      </div>
    </div>
  );
}
