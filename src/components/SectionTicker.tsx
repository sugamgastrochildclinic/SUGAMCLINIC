"use client";

import React from "react";

interface SectionTickerProps {
  words: string[];
  reverse?: boolean;
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
}

export default function SectionTicker({
  words,
  reverse = false,
  bgColor = "bg-brand-blush/30",
  textColor = "text-pink-safe",
  borderColor = "border-brand-border/30",
}: SectionTickerProps) {
  return (
    <div className={`w-full overflow-hidden ${bgColor} border-y ${borderColor} py-2.5 select-none`}>
      <div className={`flex gap-8 whitespace-nowrap ${reverse ? "animate-marquee-reverse" : "animate-marquee"}`}>
        {[...Array(5)].map((_, idx) => (
          <div key={idx} className={`flex gap-8 text-[10px] font-bold uppercase tracking-widest ${textColor}`}>
            {words.map((word, wIdx) => (
              <span key={wIdx}>✦ {word}</span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
