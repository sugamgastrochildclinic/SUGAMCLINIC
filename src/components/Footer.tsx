import React from "react";
import Link from "next/link";
import { Facebook, Instagram, Youtube, Linkedin, Mail, MapPin, Phone } from "lucide-react";
import { Language } from "@/lib/translations";

interface FooterProps {
  settings: any;
  lang: Language;
}

export default function Footer({ settings, lang }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const clinicName = settings?.clinicName || "Sugam Clinic";

  return (
    <footer className="bg-brand-ink text-white pt-16 pb-8 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Logo & Description */}
          <div>
            <h3 className="font-heading font-bold text-2xl text-teal mb-4 tracking-tight">
              {clinicName}
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              {settings?.tagline ||
                "Providing trustable child health, neonatal monitoring, gastroenterology, and liver disease consults."}
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-4">
              {settings?.facebook && (
                <a
                  href={settings.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-teal hover:bg-teal hover:text-white transition-all duration-300"
                >
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {settings?.instagram && (
                <a
                  href={settings.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-teal hover:bg-teal hover:text-white transition-all duration-300"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {settings?.youtube && (
                <a
                  href={settings.youtube}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-teal hover:bg-teal hover:text-white transition-all duration-300"
                >
                  <Youtube className="w-5 h-5" />
                </a>
              )}
              {settings?.linkedin && (
                <a
                  href={settings.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-teal hover:bg-teal hover:text-white transition-all duration-300"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-semibold text-lg text-white mb-6">
              {lang === "en" ? "Quick Links" : "விரைவான இணைப்புகள்"}
            </h4>
            <div className="flex flex-col gap-3">
              <Link href="#home" className="text-gray-400 hover:text-teal text-sm transition-colors">
                {lang === "en" ? "Home" : "முகப்பு"}
              </Link>
              <Link href="#about" className="text-gray-400 hover:text-teal text-sm transition-colors">
                {lang === "en" ? "About Us" : "எங்களைப் பற்றி"}
              </Link>
              <Link href="#doctors" className="text-gray-400 hover:text-teal text-sm transition-colors">
                {lang === "en" ? "Doctors" : "மருத்துவர்கள்"}
              </Link>
              <Link href="#services" className="text-gray-400 hover:text-teal text-sm transition-colors">
                {lang === "en" ? "Services" : "சேவைகள்"}
              </Link>
              <Link href="#gallery" className="text-gray-400 hover:text-teal text-sm transition-colors">
                {lang === "en" ? "Gallery" : "புகைப்படங்கள்"}
              </Link>
            </div>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="font-heading font-semibold text-lg text-white mb-6">
              {lang === "en" ? "Contact Info" : "தொடர்பு விபరం"}
            </h4>
            <div className="flex flex-col gap-4 text-sm text-gray-400">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-teal shrink-0 mt-0.5" />
                <span>{settings?.address || "Clinic Address"}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-teal shrink-0" />
                <a href={`tel:${settings?.phone}`} className="hover:text-teal transition-colors">
                  {settings?.phone || "+91 94432 12345"}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-teal shrink-0" />
                <a href={`mailto:${settings?.email}`} className="hover:text-teal transition-colors">
                  {settings?.email || "info@sugamclinic.com"}
                </a>
              </div>
            </div>
          </div>

          {/* Working Hours */}
          <div>
            <h4 className="font-heading font-semibold text-lg text-white mb-6">
              {lang === "en" ? "Clinic Hours" : "பணி நேரம்"}
            </h4>
            <p className="text-gray-400 text-sm leading-relaxed">
              {settings?.workingHours || "Mon - Sat: 9:00 AM - 8:30 PM"}
            </p>
          </div>
        </div>

        {/* Divider & Copyright */}
        <div className="border-t border-white/5 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© {currentYear} {clinicName}. All Rights Reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-teal transition-colors">
              {lang === "en" ? "Admin Login" : "நிர்வாகி உள்நுழைவு"}
            </Link>
          </div>
        </div>

        {/* Developer credit */}
        <div className="mt-4 text-center text-xs text-gray-500">
          <p>
            {lang === "en" ? "Developed by" : "உருவாக்கியவர்"}{" "}
            <a
              href="https://www.fiverr.com/senthilragu"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-teal hover:text-white transition-colors"
            >
              Senthil
            </a>{" "}
            &amp;{" "}
            <a
              href="https://www.fiverr.com/skateranbu"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-teal hover:text-white transition-colors"
            >
              Anbu
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
