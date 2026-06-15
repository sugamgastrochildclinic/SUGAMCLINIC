"use client";
import React from "react";
import { Award, Compass, Eye, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { translations, Language } from "@/lib/translations";

interface AboutProps {
  settings: any;
  lang: Language;
}

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: "easeOut" },
  }),
};

const fadeLeft = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

const fadeRight = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

export default function About({ settings, lang }: AboutProps) {
  const t = translations[lang];

  return (
    <section id="about" className="py-24 bg-white border-b border-brand-border/40 relative overflow-hidden">

      {/* Desktop-only minimal background decoration */}
      <div className="absolute inset-0 z-0 hidden lg:block pointer-events-none">
        {/* 1. Dot Grid Overlay */}
        <div
          className="absolute top-0 right-0 w-[30%] h-full opacity-[0.12]"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(0,168,150,0.2) 1.5px, transparent 1.5px)`,
            backgroundSize: "32px 32px",
          }}
        />
        {/* 2. Top-right subtle outline ring */}
        <div className="absolute top-12 right-[-80px] w-64 h-64 rounded-full border border-teal/10" />
        {/* 3. Bottom-left plus marker */}
        <div className="absolute bottom-16 left-[5%] flex flex-col items-center opacity-40">
          <div className="w-[2px] h-6 bg-pink/40 rounded-full" />
          <div className="w-6 h-[2px] bg-pink/40 rounded-full -mt-[13px]" />
        </div>
      </div>

      {/* Ticker scrolling text */}
      <div className="w-full overflow-hidden bg-brand-blush/30 border-b border-brand-border/30 py-2 mb-12 select-none relative z-10">
        <div className="flex gap-8 whitespace-nowrap animate-marquee-reverse">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="flex gap-8 text-[10px] font-bold text-pink-safe uppercase tracking-widest">
              <span>✦ Gentle Treatment</span>
              <span>✦ Experienced Doctors</span>
              <span>✦ Modern Medical Instruments</span>
              <span>✦ Caring Clinic Coordinators</span>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-stretch">

          {/* Left Column: Feature Cards */}
          <motion.div
            className="grid grid-cols-2 gap-6 h-full"
            variants={fadeLeft}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            <div className="space-y-6 flex flex-col justify-between">
              <motion.div
                custom={0} variants={fadeUp} initial="hidden"
                whileInView="visible" viewport={{ once: true }}
                className="bg-teal-tint p-8 rounded-3xl border border-teal/10 hover:shadow-lg transition-all flex-1 flex flex-col justify-center"
              >
                <Compass className="w-10 h-10 text-teal mb-4 shrink-0" />
                <h4 className="font-heading font-semibold text-lg text-brand-ink mb-2">{t.aboutMission}</h4>
                <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">{t.aboutMissionDesc}</p>
              </motion.div>
              <motion.div
                custom={1} variants={fadeUp} initial="hidden"
                whileInView="visible" viewport={{ once: true }}
                className="bg-brand-blush p-8 rounded-3xl border border-pink/10 hover:shadow-lg transition-all flex-1 flex flex-col justify-center"
              >
                <Eye className="w-10 h-10 text-pink-safe mb-4 shrink-0" />
                <h4 className="font-heading font-semibold text-lg text-brand-ink mb-2">{t.aboutVision}</h4>
                <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">{t.aboutVisionDesc}</p>
              </motion.div>
            </div>
            <div className="flex items-stretch h-full">
              <motion.div
                custom={2} variants={fadeUp} initial="hidden"
                whileInView="visible" viewport={{ once: true }}
                className="bg-brand-cream p-8 rounded-3xl border border-[#F0D590]/20 hover:shadow-lg transition-all w-full flex flex-col justify-center"
              >
                <Award className="w-10 h-10 text-[#C19C38] mb-4 shrink-0" />
                <h4 className="font-heading font-semibold text-lg text-brand-ink mb-2">{t.aboutPremium}</h4>
                <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">{t.aboutPremiumDesc}</p>
              </motion.div>
            </div>
          </motion.div>

          {/* Right Column: Text Card */}
          <motion.div
            className="flex flex-col justify-center h-full bg-teal-tint/10 border border-teal/10 p-8 sm:p-10 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden"
            variants={fadeRight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {/* Soft decorative background circles inside the card */}
            <div className="absolute -top-16 -right-16 w-36 h-36 bg-teal-tint/30 rounded-full blur-2xl" />
            <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-brand-blush/20 rounded-full blur-2xl" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-tint text-teal-dark text-xs font-semibold mb-4 w-fit">
                <ShieldCheck className="w-4 h-4 text-teal" />
                <span>{t.aboutBadge}</span>
              </div>
              <h2 className="font-heading font-bold text-2xl sm:text-3xl lg:text-4xl text-brand-ink mb-6 leading-tight">
                {t.aboutTitle}
              </h2>
              <p className="text-brand-muted text-sm sm:text-base leading-relaxed mb-6">{t.aboutDesc1}</p>
              <p className="text-brand-muted text-sm sm:text-base leading-relaxed">{t.aboutDesc2}</p>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
