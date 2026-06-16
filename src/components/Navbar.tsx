"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Menu, X, Globe, Calendar, UserCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { translations, Language } from "@/lib/translations";

interface NavbarProps {
  settings: any;
  lang: Language;
  setLang?: (l: Language) => void;
}

export default function Navbar({ settings, lang, setLang }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeLang, setActiveLang] = useState<Language>(lang);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const { data: session } = useSession();

  const t = translations[activeLang];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
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
        setActiveLang(code as Language);
      }
    }
  }, []);

  const handleLangChange = (newLang: Language) => {
    setActiveLang(newLang);
    
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

    if (setLang) {
      setLang(newLang);
    } else {
      window.location.reload();
    }
  };

  const navLinks = [
    { name: t.navHome, href: "#home" },
    { name: t.navAbout, href: "#about" },
    { name: t.navDoctors, href: "#doctors" },
    { name: t.navServices, href: "#services" },
    { name: t.navGallery, href: "#gallery" },
    { name: t.navBlog, href: "#blog" },
    { name: t.navContact, href: "#contact" },
  ];

  const languages = [
    { code: "en", label: "English" },
    { code: "ta", label: "தமிழ்" },
    { code: "ml", label: "മലയാളം" },
    { code: "kn", label: "ಕನ್ನಡ" },
    { code: "te", label: "తెలుగు" },
    { code: "hi", label: "हिन्दी" },
  ];

  const clinicName = settings?.clinicName || "Sugam Clinic";
  const logoUrl = settings?.logo;

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled
          ? "bg-white/85 dark:bg-[#20262E]/85 backdrop-blur-md shadow-md border-b border-brand-border/40 py-2 sm:py-2"
          : "bg-transparent py-3 sm:py-3"
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-11 sm:h-12">

          {/* Logo / Title */}
          <Link href="#home" className="flex items-center gap-2 shrink-0">
            {logoUrl ? (
              <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border border-teal shrink-0">
                <Image
                  src={logoUrl}
                  alt="Sugam Clinic Logo"
                  fill
                  sizes="36px"
                  quality={70}
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-teal-tint flex items-center justify-center text-teal font-bold text-base border border-teal/20 shrink-0">
                S
              </div>
            )}
            <span className="font-heading font-bold text-base sm:text-lg md:text-xl text-brand-ink tracking-tight truncate max-w-[160px] xs:max-w-none">
              {clinicName}
            </span>
          </Link>

          {/* Desktop Nav Items */}
          <div className="hidden lg:flex items-center gap-6">
            <div className="flex items-center gap-5">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-medium text-xs md:text-sm text-brand-ink hover:text-teal transition-colors duration-200 relative group"
                >
                  {link.name}
                  <span className="absolute bottom-[-4px] left-0 w-0 h-0.5 bg-teal transition-all duration-300 group-hover:w-full"></span>
                </Link>
              ))}

              {/* Admin Dashboard link visible in Desktop Navbar */}
              <Link
                href={session ? "/admin" : "/login"}
                className="font-bold text-xs md:text-sm text-pink-safe hover:underline flex items-center gap-1"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>{t.navAdmin}</span>
              </Link>
            </div>

            {/* Custom Language Dropdown Selector & CTA Icon */}
            <div className="flex items-center gap-3 border-l border-brand-border/60 pl-5">
              <div className="relative notranslate" translate="no">
                <button
                  onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                  aria-label="Select language"
                  aria-haspopup="menu"
                  aria-expanded={langDropdownOpen}
                  className="flex items-center gap-1.5 bg-teal-tint/50 border border-teal/15 px-3 py-1 rounded-full text-teal-dark font-bold text-xs hover:bg-teal-tint transition-all cursor-pointer shadow-sm"
                >
                  <Globe className="w-3.5 h-3.5 text-teal shrink-0" />
                  <span>{languages.find((l) => l.code === activeLang)?.label || "English"}</span>
                </button>

                <AnimatePresence>
                  {langDropdownOpen && (
                    <>
                      {/* Click outside backdrop */}
                      <div className="fixed inset-0 z-40" onClick={() => setLangDropdownOpen(false)} />
                      
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute right-0 mt-2 w-40 bg-white/95 dark:bg-[#20262E]/95 backdrop-blur-md border border-brand-border rounded-2xl shadow-xl py-2 z-50 overflow-hidden"
                      >
                        {languages.map((l) => (
                          <button
                            key={l.code}
                            onClick={() => {
                              handleLangChange(l.code as Language);
                              setLangDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-teal-tint hover:text-teal-dark transition-all flex items-center justify-between cursor-pointer ${
                              activeLang === l.code ? "text-teal bg-teal-tint/30" : "text-brand-ink"
                            }`}
                          >
                            <span>{l.label}</span>
                            {activeLang === l.code && <div className="w-1.5 h-1.5 rounded-full bg-teal" />}
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Icon-Only Booking Button for Desktop Header */}
              <Link
                href="#booking"
                className="w-10 h-10 bg-pink hover:bg-pink-hover text-white rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg glow-pink shrink-0"
                title={t.heroBtnBook}
              >
                <Calendar className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Mobile hamburger — animates between Menu & X */}
          <div className="lg:hidden flex items-center gap-2">
            <motion.button
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-expanded={isOpen}
              className="p-1.5 rounded-md text-brand-ink hover:text-teal focus:outline-none shrink-0"
              animate={{ rotate: isOpen ? 90 : 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Panel — Framer Motion slide-down */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="lg:hidden bg-white/95 dark:bg-[#20262E]/95 backdrop-blur-md border-b border-brand-border py-4 px-6 absolute top-full left-0 w-full shadow-lg overflow-hidden"
          >
            <div className="flex flex-col gap-1">
              {navLinks.map((link, idx) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.22, delay: idx * 0.055, ease: "easeOut" }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="block text-base font-semibold text-brand-ink hover:text-teal py-2.5 border-b border-brand-border/30 transition-colors"
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.22, delay: navLinks.length * 0.055, ease: "easeOut" }}
              >
                <Link
                  href={session ? "/admin" : "/login"}
                  onClick={() => setIsOpen(false)}
                  className="text-base font-bold text-pink-safe py-2.5 border-b border-brand-border/30 flex items-center gap-2 transition-colors"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{t.navAdmin}</span>
                </Link>
              </motion.div>


              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: (navLinks.length + 1) * 0.055, ease: "easeOut" }}
                className="mt-3"
              >
                <Link
                  href="#booking"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center justify-center gap-2 bg-pink text-white py-3 rounded-xl font-bold text-center shadow-md"
                >
                  <Calendar className="w-5 h-5" />
                  <span>{t.heroBtnBook}</span>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
