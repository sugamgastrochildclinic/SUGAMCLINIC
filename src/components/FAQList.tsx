"use client";

import React, { useState } from "react";
import { Plus, Minus, HelpCircle, ShieldCheck, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { translations, Language } from "@/lib/translations";

interface FAQListProps {
  faqs: any[];
  lang: Language;
}

export default function FAQList({ faqs, lang }: FAQListProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const t = translations[lang];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const checklistItems = [
    lang === "en" ? "Track infant milestones monthly" : "குழந்தை வளர்ச்சி மைல்கற்கள்",
    lang === "en" ? "Schedule standard vaccinations" : "முறையான தடுப்பூസി திட்டங்கள்",
    lang === "en" ? "Consult on digestive conditions" : "செരിமானப் பிரச்சனைகள் தீர்வு",
    lang === "en" ? "Get personalized diet consultations" : "தனிப்பட்ட உணவு முறைகள்",
  ];

  return (
    <section id="faqs" className="py-24 bg-white border-b border-brand-border/40 relative overflow-hidden">
      {/* Desktop-only minimal background decoration */}
      <div className="absolute inset-0 z-0 hidden lg:block pointer-events-none">
        {/* 1. Dot Grid Overlay */}
        <div
          className="absolute top-0 right-0 w-[25%] h-full opacity-[0.12]"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(0,168,150,0.2) 1.5px, transparent 1.5px)`,
            backgroundSize: "32px 32px",
          }}
        />
        {/* 2. Top-left subtle glow */}
        <div className="absolute top-[-10%] left-[-10%] w-[30vw] h-[30vw] rounded-full bg-teal-tint/15 blur-[80px]" />
        {/* 3. Bottom-right plus marker */}
        <div className="absolute bottom-[12%] right-[5%] flex flex-col items-center opacity-40">
          <div className="w-[2px] h-6 bg-pink/30 rounded-full" />
          <div className="w-6 h-[2px] bg-pink/30 rounded-full -mt-[13px]" />
        </div>
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
            <HelpCircle className="w-4 h-4 text-teal" />
            <span>{t.faqBadge}</span>
          </div>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-brand-ink mb-4">{t.faqTitle}</h2>
          <p className="text-brand-muted text-sm sm:text-base">{t.faqDesc}</p>
        </motion.div>

        {/* Split Section Layout: Equal-Height Columns achieved via items-stretch */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">

          {/* Left Side: FAQs Accordion wrapped inside a Card (7/12 width) */}
          <motion.div
            className="lg:col-span-7 h-full flex flex-col"
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <div className="bg-white border border-brand-border/80 p-8 rounded-3xl flex-1 flex flex-col justify-start shadow-sm">
              {faqs.length === 0 ? (
                <div className="text-center text-sm text-brand-muted py-8 w-full">
                  No FAQs available.
                </div>
              ) : (
                <div className="space-y-4 w-full">
                  {faqs.map((faq, index) => {
                    const isOpen = openIndex === index;
                    return (
                      <div
                        key={faq._id}
                        className="bg-brand-cream/35 border border-brand-border/60 rounded-2xl overflow-hidden transition-all duration-300 w-full"
                      >
                        <button
                          onClick={() => toggleFAQ(index)}
                          className="w-full flex items-center justify-between p-5 text-left focus:outline-none"
                        >
                          <span className="font-heading font-bold text-sm sm:text-base text-brand-ink pr-4">
                            {faq.question}
                          </span>
                          <span className="shrink-0 p-1.5 rounded-full bg-white border border-brand-border text-teal">
                            {isOpen ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                          </span>
                        </button>

                        {isOpen && (
                          <div className="px-5 pb-5 pt-1 border-t border-brand-border/30 text-xs sm:text-sm text-brand-muted leading-relaxed">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>

          {/* Right Side: Creative Graphic Card Panel (5/12 width) */}
          <motion.div
            className="lg:col-span-5 h-full flex flex-col"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
          >
            <div className="bg-brand-blush border border-pink/15 p-8 rounded-3xl flex-1 flex flex-col justify-between relative overflow-hidden shadow-sm">
              {/* Graphic Blob */}
              <div className="absolute bottom-[-20px] right-[-20px] w-32 h-32 bg-pink/5 rounded-full blur-2xl" />

              <div>
                <div className="w-12 h-12 rounded-xl bg-pink/10 flex items-center justify-center mb-6">
                  <ShieldCheck className="w-6 h-6 text-pink-safe" />
                </div>

                <h3 className="font-heading font-bold text-xl text-brand-ink mb-3">
                  {t.faqRightTitle}
                </h3>
                <p className="text-xs sm:text-sm text-brand-muted leading-relaxed mb-8">
                  {t.faqRightDesc}
                </p>

                {/* Illustrated Checklist */}
                <div className="space-y-4">
                  {checklistItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-pink-safe shrink-0" />
                      <span className="text-xs sm:text-sm font-semibold text-brand-ink">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visual mini-pill */}
              <div className="mt-8 p-4 bg-white/70 backdrop-blur-sm border border-brand-border/60 rounded-2xl flex items-center gap-3 shadow-xs">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="text-[10px] sm:text-xs font-bold text-brand-ink uppercase tracking-wider">
                  {lang === "en" ? "Pediatric Helpline active" : "உதவி எண் தயார்"}
                </span>
              </div>

            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
}
