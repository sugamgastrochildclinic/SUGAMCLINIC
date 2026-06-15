"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { MapPin, Phone, Mail, Clock, Send, MessageSquare, Loader2, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { translations, Language } from "@/lib/translations";

const contactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number is required"),
  message: z.string().min(5, "Message must be at least 5 characters"),
});

type ContactFormValues = z.infer<typeof contactSchema>;

interface ContactProps {
  settings: any;
  lang: Language;
}

export default function Contact({ settings, lang }: ContactProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const t = translations[lang];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormValues) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || "Failed to send message");
      }

      setSuccess(true);
      reset();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to send. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const address = settings?.address || "14/2, Hospital Road, Near Bus Stand, Sugam Clinic Area";
  const phone = settings?.phone || "+91 94432 12345";
  const email = settings?.email || "contact@sugamclinic.com";
  const workingHours = settings?.workingHours || "Mon - Sat: 9:00 AM - 8:30 PM";
  let mapsUrl = settings?.mapsUrl || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3886.5709971936357!2d80.21852877593259!3d13.062402113203498!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a5267b14dcd69eb%3A0xe54e604f3263a2!2sApollo%20Children&#39;s%20Hospitals!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin";
  if (mapsUrl.includes("<iframe")) {
    const srcMatch = mapsUrl.match(/src="([^"]+)"/);
    if (srcMatch && srcMatch[1]) {
      mapsUrl = srcMatch[1];
    }
  }

  return (
    <section id="contact" className="py-24 bg-white relative overflow-hidden">
      {/* Desktop-only minimal background decoration */}
      <div className="absolute inset-0 z-0 hidden lg:block pointer-events-none">
        {/* 1. Bottom-right ring */}
        <div className="absolute bottom-[-80px] right-[-80px] w-72 h-72 rounded-full border border-teal/10" />
        {/* 2. Left rotated geometric square */}
        <div className="absolute top-[40%] left-[4%] w-6 h-6 rotate-45 border border-pink/15" />
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
            <MessageSquare className="w-4 h-4 text-teal" />
            <span>{t.contactBadge}</span>
          </div>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-brand-ink mb-4">{t.contactTitle}</h2>
          <p className="text-brand-muted text-sm sm:text-base">{t.contactDesc}</p>
        </motion.div>

        {/* Equal-Height columns achieved via items-stretch */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">

          {/* Left Column: Contact Cards */}
          <motion.div
            className="lg:col-span-5 h-full flex flex-col"
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <div className="bg-gradient-to-br from-brand-blush/60 via-white to-teal-tint/25 border border-brand-border p-8 sm:p-10 rounded-3xl flex-1 flex flex-col justify-between shadow-sm relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-teal-tint/30 rounded-full blur-3xl" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-brand-blush/40 rounded-full blur-3xl" />

              <div className="relative space-y-8">
                {/* Header */}
                <div>
                  <h3 className="font-heading font-bold text-xl text-brand-ink mb-1.5">Sugam Clinic Details</h3>
                  <p className="text-xs text-brand-muted">Get in touch directly or visit our pediatric premises.</p>
                </div>

                <div className="space-y-6">
                  {/* Address */}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-teal-tint text-teal flex items-center justify-center shrink-0 border border-teal/10">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-brand-ink uppercase tracking-wider mb-1">{t.contactLocation}</h4>
                      <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">{address}</p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-teal-tint text-teal flex items-center justify-center shrink-0 border border-teal/10">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-brand-ink uppercase tracking-wider mb-1">{t.contactCall}</h4>
                      <a href={`tel:${phone}`} className="text-xs sm:text-sm text-teal-dark font-bold hover:underline block">{phone}</a>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-pink/10 text-pink-safe flex items-center justify-center shrink-0 border border-pink/10">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-brand-ink uppercase tracking-wider mb-1">{t.contactMail}</h4>
                      <a href={`mailto:${email}`} className="text-xs sm:text-sm text-pink-safe font-bold hover:underline block">{email}</a>
                    </div>
                  </div>

                  {/* Timings */}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-teal-tint text-teal flex items-center justify-center shrink-0 border border-teal/10">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-brand-ink uppercase tracking-wider mb-1">{t.contactHours}</h4>
                      <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">{workingHours}</p>
                    </div>
                  </div>

                  {/* Google Maps Button */}
                  <a
                    href={mapsUrl.includes("<iframe") ? "https://maps.google.com" : mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 flex items-center justify-center gap-2 bg-teal hover:bg-teal-dark text-white font-bold py-3 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer w-full text-sm"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>Open in Google Maps</span>
                  </a>
                </div>
              </div>

              {/* Verified Badge */}
              <div className="relative mt-8 pt-4 border-t border-brand-border/40 flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-teal animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-ink">
                  Professional Family Healthcare
                </span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Contact Message Form */}
          <motion.div
            className="lg:col-span-7 h-full flex flex-col"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
          >
            <div className="bg-white p-8 sm:p-10 rounded-3xl border border-brand-border shadow-md h-full flex flex-col justify-center flex-1">

              {success ? (
                <div className="text-center py-8 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-teal-tint text-teal flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="font-heading font-bold text-2xl text-brand-ink mb-2">Message Sent Successfully!</h3>
                  <p className="text-brand-muted text-sm max-w-sm mb-6">
                    Thank you for reaching out. We will review your message and reply shortly.
                  </p>
                  <button
                    onClick={() => setSuccess(false)}
                    className="bg-teal text-white hover:bg-teal-dark px-6 py-2.5 rounded-full font-semibold transition-all cursor-pointer"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {errorMsg && (
                    <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 text-sm rounded-xl">
                      {errorMsg}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold uppercase text-brand-ink mb-2">Your Name</label>
                      <input
                        type="text"
                        placeholder="Name"
                        {...register("name")}
                        className="w-full px-4 py-3 rounded-xl border border-brand-border focus:border-teal focus:outline-none text-sm text-brand-ink"
                      />
                      {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-brand-ink mb-2">Phone Number</label>
                      <input
                        type="tel"
                        placeholder="Phone Number"
                        {...register("phone")}
                        className="w-full px-4 py-3 rounded-xl border border-brand-border focus:border-teal focus:outline-none text-sm text-brand-ink"
                      />
                      {errors.phone && <p className="text-xs text-rose-600 mt-1">{errors.phone.message}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-brand-ink mb-2">Email Address</label>
                    <input
                      type="email"
                      placeholder="email@example.com"
                      {...register("email")}
                      className="w-full px-4 py-3 rounded-xl border border-brand-border focus:border-teal focus:outline-none text-sm text-brand-ink"
                    />
                    {errors.email && <p className="text-xs text-rose-600 mt-1">{errors.email.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-brand-ink mb-2">Message</label>
                    <textarea
                      rows={3}
                      placeholder="Write your query here..."
                      {...register("message")}
                      className="w-full px-4 py-3 rounded-xl border border-brand-border focus:border-teal focus:outline-none text-sm text-brand-ink"
                    />
                    {errors.message && <p className="text-xs text-rose-600 mt-1">{errors.message.message}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-teal hover:bg-teal-dark text-white py-4 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </form>
              )}

            </div>
          </motion.div>

        </div>

        {/* Map Embed Section */}
        {(mapsUrl.includes("google.com/maps/embed") || mapsUrl.includes("google.com/maps/d/embed")) && (
          <div className="mt-16 w-full h-[400px] rounded-3xl overflow-hidden border border-brand-border shadow-sm bg-brand-blush/10 relative flex flex-col items-center justify-center p-6 text-center">
            <iframe
              src={mapsUrl}
              width="100%"
              height="100%"
              className="absolute inset-0 w-full h-full border-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Clinic Location Map"
            ></iframe>
          </div>
        )}

      </div>
    </section>
  );
}
