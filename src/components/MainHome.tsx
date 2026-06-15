"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import Hero from "@/components/Hero";
import SectionTicker from "@/components/SectionTicker";

import { Language } from "@/lib/translations";

const About = dynamic(() => import("@/components/About"));
const Doctors = dynamic(() => import("@/components/Doctors"));
const Services = dynamic(() => import("@/components/Services"));
const BookingForm = dynamic(() => import("@/components/BookingForm"));
const Testimonials = dynamic(() => import("@/components/Testimonials"));
const GalleryGrid = dynamic(() => import("@/components/GalleryGrid"));
const FAQList = dynamic(() => import("@/components/FAQList"));
const BlogGrid = dynamic(() => import("@/components/BlogGrid"));
const Contact = dynamic(() => import("@/components/Contact"));
const Chatbot = dynamic(() => import("@/components/Chatbot"), { ssr: false });

interface MainHomeProps {
  settings: any;
  doctors: any[];
  services: any[];
  reviews: any[];
  faqs: any[];
  blogs: any[];
  gallery: any[];
}

export default function MainHome({
  settings,
  doctors,
  services,
  reviews,
  faqs,
  blogs,
  gallery,
}: MainHomeProps) {
  const [lang, setLang] = useState<Language>("en");

  React.useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(";").shift();
      return null;
    };
    const transCookie = getCookie("googtrans");
    if (transCookie) {
      const code = transCookie.split("/").pop();
      if (code && ["en", "ta", "ml", "kn", "te", "hi"].includes(code)) {
        setLang(code as Language);
      }
    }
  }, []);

  const handleLangChange = (newLang: Language) => {
    setLang(newLang);
    
    // Clear existing googtrans cookies on all potential domains
    const domains = [
      window.location.hostname,
      '.' + window.location.hostname,
      window.location.hostname.replace(/^www\./, ''),
      '.' + window.location.hostname.replace(/^www\./, '')
    ];
    
    domains.forEach(d => {
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${d};`;
    });

    // Set new cookie
    document.cookie = `googtrans=/en/${newLang}; path=/;`;
    document.cookie = `googtrans=/en/${newLang}; path=/; domain=${window.location.hostname};`;
    document.cookie = `googtrans=/en/${newLang}; path=/; domain=.${window.location.hostname.replace(/^www\./, '')};`;
    
    if (window.location.hostname === 'localhost') {
      document.cookie = `googtrans=/en/${newLang}; path=/;`;
    }

    // Programmatically trigger Google Translate combo change if present
    try {
      const combo = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      if (combo) {
        combo.value = newLang;
        combo.dispatchEvent(new Event('change'));
      }
    } catch (e) {
      console.error(e);
    }

    window.location.reload();
  };

  return (
    <>
      {/* Sections render inside PublicLayoutWrapper's <main> (Navbar/Footer/
          FloatingActions live there), so this component emits only content —
          no extra <main>/wrapper div, which would nest mains and break a11y. */}
      <Hero settings={settings} lang={lang} />
        
        <About settings={settings} lang={lang} />
        
        <SectionTicker 
          words={["Pediatric Gastroenterology", "Expert Liver Care", "Milestone Tracking", "Newborn Screening"]} 
          bgColor="bg-teal-tint/20"
          textColor="text-teal-dark"
        />
        
        <Doctors doctors={doctors} lang={lang} />
        
        <Services services={services} lang={lang} />
        
        <SectionTicker 
          words={["Quick Scheduling", "WhatsApp Bookings", "Instant Confirmation", "Child Vaccination Tracker"]} 
          reverse={true}
          bgColor="bg-brand-blush/20"
          textColor="text-pink-safe"
        />
        
        <BookingForm doctors={doctors} lang={lang} />
        
        <SectionTicker 
          words={["Verified Parents Feedback", "Aesthetic Clinical Experience", "Premium Pediatrics", "Sugam Patient Stories"]}
          bgColor="bg-teal-tint/20"
          textColor="text-teal-dark"
        />
        
        <Testimonials reviews={reviews} lang={lang} />
        
        <SectionTicker 
          words={["Modern Diagnostic Tools", "Child-friendly Waiting Area", "State-of-the-Art Operations", "Virtual Tour"]}
          reverse={true}
          bgColor="bg-brand-blush/20"
          textColor="text-pink-safe"
        />
        
        <GalleryGrid gallery={gallery} lang={lang} />
        
        <SectionTicker 
          words={["Doctor Health Advice", "Newborn Care Tips", "Clinical FAQs answered", "Sugam Blogs"]}
          bgColor="bg-teal-tint/20"
          textColor="text-teal-dark"
        />
        
        <BlogGrid posts={blogs} lang={lang} />
        
        <SectionTicker 
          words={["Common Concerns", "Timings & Consultation", "Vaccination Calendars", "Your Questions Answered"]}
          reverse={true}
          bgColor="bg-brand-blush/20"
          textColor="text-pink-safe"
        />
        
        <FAQList faqs={faqs} lang={lang} />
        
        <SectionTicker 
          words={["Visit Sugam Clinic", "Direct Call Channels", "WhatsApp Connect", "We Are Here To Help"]}
          bgColor="bg-teal-tint/20"
          textColor="text-teal-dark"
        />
        
        <Contact settings={settings} lang={lang} />

      {/* Chatbot Assistant */}
      <Chatbot settings={settings} doctors={doctors} />
    </>
  );
}
