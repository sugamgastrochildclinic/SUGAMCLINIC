"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Award, Smile, CheckCircle, Calendar, Phone, Star, Users, Clock, Shield } from "lucide-react";
import { translations, Language } from "@/lib/translations";

interface HeroProps {
  settings: any;
  lang: Language;
}

export default function Hero({ settings, lang }: HeroProps) {
  const t = translations[lang];
  const heroImage = settings?.heroImage || "/hero-logo.jpg";

  return (
    <section
      id="home"
      className="relative min-h-screen flex flex-col justify-between pt-24 sm:pt-40 lg:pt-36 overflow-hidden pb-8 sm:pb-12"
    >
      {/* Background Image - Spans entire hero area (z-0 to sit above section base) */}
      <div className="absolute inset-0 z-0 w-full h-full">
        <Image
          src={heroImage}
          alt="Sugam Clinic background"
          fill
          priority
          fetchPriority="high"
          quality={100}
          className="object-cover object-[80%_center] md:object-center"
        />
      </div>

      {/* Gradient overlay: White on left (desktop) or top (mobile), fading to transparent where the baby is */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-white/80 via-white/50 to-white/10 md:bg-gradient-to-r md:from-white/95 md:via-white/70 md:to-transparent" />

      {/* Main Content Area (z-20 to sit on top of background & gradient overlay) */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 flex flex-col justify-between">
        
        {/* Top/Middle Text Content - Pushed lower on desktop, higher on mobile */}
        <div className="w-full max-w-3xl mt-4 sm:mt-16">
          {/* Pill Badge */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-teal-tint/90 border border-teal/20 text-teal-dark text-xs sm:text-sm font-semibold mb-4 sm:mb-6 w-fit shadow-sm"
          >
            <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal" />
            <span>{t.heroBadge}</span>
          </div>

          {/* Heading */}
          <h1
            className="font-heading font-bold text-[46px] sm:text-5xl lg:text-6xl text-brand-ink leading-[1.1] sm:leading-[1.15] tracking-tight mb-4 sm:mb-6"
          >
            {t.heroTitlePrefix}
            <span className="text-teal font-extrabold relative inline-block">
              {t.heroTitleHighlight}
            </span>
            {t.heroTitleSuffix}
          </h1>

          {/* Tagline / Description */}
          <p
            className="text-sm sm:text-lg text-brand-muted leading-relaxed mb-6 sm:mb-8 max-w-xl font-semibold bg-white/60 p-3 rounded-2xl border border-white/30 shadow-sm w-fit"
          >
            {settings?.tagline || t.heroDesc}
          </p>

          {/* Call to Actions */}
          <div
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-10 sm:mb-14"
          >
            <Link
              href="#booking"
              className="flex items-center justify-center gap-2 bg-teal hover:bg-teal-dark text-white px-6 py-3.5 sm:px-8 sm:py-4 rounded-2xl font-bold text-base sm:text-lg transition-all duration-300 shadow-md hover:shadow-lg glow-teal"
            >
              <Calendar className="w-5 h-5" />
              <span>{t.heroBtnBook}</span>
            </Link>
            <Link
              href="#services"
              className="flex items-center justify-center gap-2 border border-teal/30 bg-white/80 hover:bg-white text-teal-dark px-6 py-3.5 sm:px-8 sm:py-4 rounded-2xl font-bold text-base sm:text-lg transition-all duration-300 shadow-sm"
            >
              <span>{t.heroBtnCall}</span>
            </Link>
          </div>
        </div>

        {/* Premium Floating Stats Card at the bottom */}
        <div className="w-full bg-white/80 rounded-3xl p-5 sm:p-6 border border-white/60 shadow-xl mt-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 sm:gap-6">
            
            {/* Rating Stat */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              </div>
              <div>
                <div className="font-heading font-extrabold text-lg sm:text-xl text-brand-ink">4.9</div>
                <div className="text-[10px] sm:text-xs text-brand-muted uppercase font-bold tracking-wider leading-tight">Rating</div>
                <div className="text-[9px] text-teal font-semibold">Verified Reviews</div>
              </div>
            </div>

            {/* Patients Stat */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal/10 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-teal" />
              </div>
              <div>
                <div className="font-heading font-extrabold text-lg sm:text-xl text-brand-ink">15K+</div>
                <div className="text-[10px] sm:text-xs text-brand-muted uppercase font-bold tracking-wider leading-tight">Happy Patients</div>
              </div>
            </div>

            {/* Experience Stat */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-pink/10 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5 text-pink" />
              </div>
              <div>
                <div className="font-heading font-extrabold text-lg sm:text-xl text-brand-ink">15+</div>
                <div className="text-[10px] sm:text-xs text-brand-muted uppercase font-bold tracking-wider leading-tight">Years Experience</div>
              </div>
            </div>

            {/* Pediatric Care Stat */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <div className="font-heading font-extrabold text-lg sm:text-xl text-brand-ink">Expert</div>
                <div className="text-[10px] sm:text-xs text-brand-muted uppercase font-bold tracking-wider leading-tight">Pediatric Care</div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
