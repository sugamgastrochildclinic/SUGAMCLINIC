"use client";

import React from "react";
import Image from "next/image";
import { Phone, Clock, Award, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { translations, Language } from "@/lib/translations";

interface DoctorsProps {
  doctors: any[];
  lang: Language;
}

export default function Doctors({ doctors, lang }: DoctorsProps) {
  const t = translations[lang];

  return (
    <section id="doctors" className="py-24 bg-brand-blush/20 border-b border-brand-border/40 relative overflow-hidden">
      {/* Desktop-only minimal background decoration */}
      <div className="absolute inset-0 z-0 hidden lg:block pointer-events-none">
        {/* 1. Diagonal stripe band */}
        <div
          className="absolute top-0 left-0 w-[40%] h-full opacity-[0.05]"
          style={{
            background: `repeating-linear-gradient(
              -45deg,
              #00a896,
              #00a896 1.5px,
              transparent 1.5px,
              transparent 24px
            )`,
          }}
        />
        {/* 2. Bottom-left ring */}
        <div className="absolute bottom-[-60px] left-[-60px] w-52 h-52 rounded-full border border-pink/10" />
        {/* 3. Rotated geometric square */}
        <div className="absolute top-[20%] right-[8%] w-6 h-6 rotate-45 border border-teal/15" />
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
            <Shield className="w-4 h-4 text-teal" />
            <span>{t.doctorsBadge}</span>
          </div>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-brand-ink mb-4">{t.doctorsTitle}</h2>
          <p className="text-brand-muted text-sm sm:text-base">{t.doctorsDesc}</p>
        </motion.div>

        {/* Doctors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {doctors.map((doc: any, idx: number) => (
            <motion.div
              key={doc._id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.6, delay: idx * 0.15, ease: "easeOut" }}
              className="bg-white rounded-3xl border border-brand-border overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row items-stretch"
            >
              {/* Photo */}
              <div className="relative w-full md:w-2/5 aspect-[4/5] bg-teal-tint/30 shrink-0">
                {doc.photo ? (
                  <Image
                    src={doc.photo}
                    alt={doc.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 320px"
                    loading="lazy"
                    quality={72}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-teal-tint text-teal font-heading font-bold text-5xl">
                    {doc.name.charAt(4) || "D"}
                  </div>
                )}
                <span className="absolute top-4 left-4 z-10 text-[10px] font-bold px-2.5 py-1 rounded-full border bg-white flex items-center gap-1 shadow-sm uppercase tracking-wider">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    doc.availability === "Available Today" ? "bg-emerald-500" : doc.availability === "Fully Booked" ? "bg-amber-500" : "bg-rose-500"
                  }`} />
                  {doc.availability}
                </span>
              </div>

              {/* Details */}
              <div className="p-8 flex flex-col justify-between flex-1">
                <div>
                  <h3 className="font-heading font-bold text-lg sm:text-xl text-brand-ink mb-1">{doc.name}</h3>
                  <p className="text-teal-dark font-medium text-xs sm:text-sm mb-3">{doc.specialization}</p>
                  <p className="text-[10px] text-brand-muted mb-4 font-semibold flex items-center gap-1 uppercase tracking-wider">
                    <Award className="w-4 h-4 text-teal" />
                    {doc.qualification}
                  </p>
                  <p className="text-xs sm:text-sm text-brand-muted leading-relaxed mb-6">{doc.description}</p>
                </div>
                <div className="space-y-3 pt-4 border-t border-brand-border/60">
                  <div className="flex items-center gap-2 text-xs text-brand-ink font-semibold">
                    <Clock className="w-4 h-4 text-teal shrink-0" />
                    <span>{doc.consultingTime}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-brand-ink font-semibold">
                    <Phone className="w-4 h-4 text-teal shrink-0" />
                    <a href={`tel:${doc.phone}`} className="hover:text-teal transition-colors">{doc.phone}</a>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>

      {/* Ticker */}
      <div className="w-full overflow-hidden bg-brand-blush/35 border-t border-brand-border/40 py-2.5 mt-16 select-none">
        <div className="flex gap-8 whitespace-nowrap animate-marquee-reverse">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="flex gap-8 text-[10px] font-bold text-pink-safe uppercase tracking-widest">
              <span>✦ Pediatric Gastro Specialist Care</span>
              <span>✦ Childhood Liver Treatments</span>
              <span>✦ Milestone & Growth Monitoring</span>
              <span>✦ Newborn Jaundice Guidance</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
