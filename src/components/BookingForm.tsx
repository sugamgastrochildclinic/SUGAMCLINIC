"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Calendar, Clock, User, Phone, Mail, MessageSquare, Baby, CheckCircle2, Loader2, Heart, Stethoscope, ClipboardList } from "lucide-react";
import { translations, Language } from "@/lib/translations";
import { TIME_SLOTS, todayInClinicTZ } from "@/lib/slots";
import { VISIT_REASONS } from "@/lib/visitReasons";

type SlotInfo = { time: string; available: boolean; past: boolean; full: boolean };

const bookingSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  date: z.string().min(1, "Please select a date"),
  time: z.string().min(1, "Please select a preferred slot"),
  doctor: z.string().min(1, "Please select a doctor"),
  visitReason: z.string().min(1, "Please select a reason for the visit"),
  symptoms: z.string().optional(),
  additionalNotes: z.string().optional(),
  message: z.string().optional(),
  isChild: z.boolean().default(false),
  childName: z.string().optional(),
  childDob: z.string().optional(),
  vaccinationReminderEnabled: z.boolean().default(false),
  // Honeypot: hidden from humans, only bots fill it. Server drops if set.
  website: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

interface BookingFormProps {
  doctors: any[];
  lang: Language;
}

export default function BookingForm({ doctors, lang }: BookingFormProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const t = translations[lang];

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      email: "",
      isChild: false,
      vaccinationReminderEnabled: false,
    },
  });

  const isChildChecked = watch("isChild");
  const selectedDoctor = watch("doctor");
  const selectedDate = watch("date");

  const today = todayInClinicTZ();
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Fetch real availability whenever doctor + date are both chosen. Booked /
  // past slots come back unavailable so we can disable them. Server re-checks
  // on submit, so this is purely to stop users picking a dead slot.
  const loadAvailability = React.useCallback(async (doctor: string, date: string) => {
    if (!doctor || !date) {
      setSlots([]);
      return;
    }
    setSlotsLoading(true);
    try {
      const res = await fetch(`/api/appointments/availability?doctor=${doctor}&date=${date}`);
      const data = await res.json();
      setSlots(Array.isArray(data.slots) ? data.slots : []);
    } catch {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Slot taken for one doctor/date may be free for another — clear stale pick.
    setValue("time", "");
    loadAvailability(selectedDoctor, selectedDate);
  }, [selectedDoctor, selectedDate, setValue, loadAvailability]);

  useEffect(() => {
    if (selectedDoctor) {
      const doc = doctors.find((d) => d._id === selectedDoctor);
      if (doc && doc.name && doc.name.toLowerCase().includes("rajesh kannan")) {
        setValue("isChild", true);
      }
    }
  }, [selectedDoctor, doctors, setValue]);

  const slotsReady = Boolean(selectedDoctor && selectedDate);
  const noSlotsFree = slotsReady && !slotsLoading && slots.length > 0 && slots.every((s) => !s.available);

  const onSubmit = async (data: BookingFormValues) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || "Failed to book appointment");
      }

      setSuccess(true);
      reset();
      setSlots([]);
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong. Please try again.");
      // A 409 (slot just taken) or any rejection may mean availability changed —
      // refresh so the just-booked slot shows as unavailable.
      if (selectedDoctor && selectedDate) loadAvailability(selectedDoctor, selectedDate);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="booking" className="py-24 bg-gradient-to-tr from-teal-tint/50 via-white to-brand-blush/30 border-b border-brand-border/40 relative overflow-hidden">
      {/* Desktop-only minimal background decoration */}
      <div className="absolute inset-0 z-0 hidden lg:block pointer-events-none">
        {/* 1. Top-left rings */}
        <div className="absolute top-[-50px] left-[-50px] w-48 h-48 rounded-full border border-teal/10" />
        {/* 2. Rotated geometric square */}
        <div className="absolute bottom-[15%] right-[5%] w-8 h-8 rotate-12 border border-pink/15" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        {/* Equal-Height columns achieved via items-stretch */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
          
          {/* Left Column: CTA Info wrapped in matching Card container */}
          <div className="lg:col-span-5 h-full flex flex-col">
            <div className="bg-brand-cream/80 border border-brand-border/80 p-8 sm:p-10 rounded-3xl flex-1 flex flex-col justify-between shadow-sm relative overflow-hidden">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink/10 text-pink-safe text-xs font-semibold mb-6 w-fit">
                  <Calendar className="w-4 h-4 text-pink-safe" />
                  <span>{t.bookingBadge}</span>
                </div>
                
                <h2 className="font-heading font-bold text-2xl sm:text-3xl text-brand-ink mb-6">
                  {t.bookingTitle}
                </h2>
                
                <p className="text-brand-muted text-xs sm:text-sm leading-relaxed mb-8">
                  {t.bookingDesc}
                </p>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4.5 h-4.5 text-teal shrink-0" />
                    <span className="text-xs sm:text-sm font-semibold text-brand-ink">
                      {t.bookingBullet1}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4.5 h-4.5 text-teal shrink-0" />
                    <span className="text-xs sm:text-sm font-semibold text-brand-ink">
                      {t.bookingBullet2}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4.5 h-4.5 text-teal shrink-0" />
                    <span className="text-xs sm:text-sm font-semibold text-brand-ink">
                      {t.bookingBullet3}
                    </span>
                  </div>
                </div>
              </div>

              {/* Decorative graphic indicator */}
              <div className="mt-8 pt-4 border-t border-brand-border/40 flex items-center gap-2 text-xs text-brand-muted">
                <Heart className="w-4 h-4 text-teal shrink-0" />
                <span>Sugam Pediatric & Gastro Clinic Standard Protocol</span>
              </div>
            </div>
          </div>

          {/* Right Column: Booking Form Panel */}
          <div className="lg:col-span-7 h-full flex flex-col">
            <div className="bg-white p-8 sm:p-10 rounded-3xl border border-brand-border shadow-md h-full flex flex-col justify-center flex-1">
              
              {success ? (
                <div className="text-center py-12 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-teal-tint text-teal flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="font-heading font-bold text-2xl text-brand-ink mb-3">
                    {t.bookingSuccessTitle}
                  </h3>
                  <p className="text-brand-muted text-sm max-w-sm mb-8 leading-relaxed">
                    {t.bookingSuccessDesc}
                  </p>
                  <button
                    onClick={() => setSuccess(false)}
                    className="bg-teal text-white hover:bg-teal-dark px-6 py-2.5 rounded-full font-semibold transition-all shadow-md cursor-pointer"
                  >
                    {t.bookingSuccessBtn}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Honeypot — hidden from real users, catches bots. */}
                  <div className="absolute left-[-9999px] top-[-9999px] w-px h-px overflow-hidden" aria-hidden="true">
                    <label>
                      Website
                      <input type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
                    </label>
                  </div>

                  {errorMsg && (
                    <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 text-sm rounded-xl">
                      {errorMsg}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Patient Name */}
                    <div>
                      <label className="block text-xs font-bold uppercase text-brand-ink mb-2">
                        {t.bookingFormName}
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-3.5 w-5 h-5 text-brand-muted/70" />
                        <input
                          type="text"
                          placeholder="Name"
                          {...register("name")}
                          className="w-full pl-12 pr-4 py-3 rounded-xl border border-brand-border focus:border-teal focus:outline-none transition-colors text-sm text-brand-ink"
                        />
                      </div>
                      {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name.message}</p>}
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-xs font-bold uppercase text-brand-ink mb-2">
                        {t.bookingFormPhone}
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-3.5 w-5 h-5 text-brand-muted/70" />
                        <input
                          type="tel"
                          placeholder="+91 98765 43210"
                          {...register("phone")}
                          className="w-full pl-12 pr-4 py-3 rounded-xl border border-brand-border focus:border-teal focus:outline-none transition-colors text-sm text-brand-ink"
                        />
                      </div>
                      {errors.phone && <p className="text-xs text-rose-600 mt-1">{errors.phone.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Email */}
                    <div>
                      <label className="block text-xs font-bold uppercase text-brand-ink mb-2">
                        {t.bookingFormEmail}
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-3.5 w-5 h-5 text-brand-muted/70" />
                        <input
                          type="email"
                          placeholder="email@example.com"
                          {...register("email")}
                          className="w-full pl-12 pr-4 py-3 rounded-xl border border-brand-border focus:border-teal focus:outline-none transition-colors text-sm text-brand-ink"
                        />
                      </div>
                      {errors.email && <p className="text-xs text-rose-600 mt-1">{errors.email.message}</p>}
                    </div>

                    {/* Select Doctor */}
                    <div>
                      <label className="block text-xs font-bold uppercase text-brand-ink mb-2">
                        {t.bookingFormDoctor}
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-3.5 w-5 h-5 text-brand-muted/70" />
                        <select
                          {...register("doctor")}
                          className="w-full pl-12 pr-4 py-3 rounded-xl border border-brand-border focus:border-teal focus:outline-none transition-colors text-sm text-brand-ink appearance-none bg-white"
                        >
                          <option value="">{t.bookingFormDoctorPlaceholder}</option>
                          {doctors.map((doc) => (
                            <option key={doc._id} value={doc._id}>
                              {doc.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      {errors.doctor && <p className="text-xs text-rose-600 mt-1">{errors.doctor.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Select Date */}
                    <div>
                      <label className="block text-xs font-bold uppercase text-brand-ink mb-2">
                        {t.bookingFormDate}
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-3.5 w-5 h-5 text-brand-muted/70" />
                        <input
                          type="date"
                          min={today}
                          {...register("date")}
                          className="w-full pl-12 pr-4 py-3 rounded-xl border border-brand-border focus:border-teal focus:outline-none transition-colors text-sm text-brand-ink"
                        />
                      </div>
                      {errors.date && <p className="text-xs text-rose-600 mt-1">{errors.date.message}</p>}
                    </div>

                    {/* Select Time Slot */}
                    <div>
                      <label className="block text-xs font-bold uppercase text-brand-ink mb-2">
                        {t.bookingFormTime}
                      </label>
                      <div className="relative">
                        <Clock className="absolute left-4 top-3.5 w-5 h-5 text-brand-muted/70" />
                        <select
                          {...register("time")}
                          disabled={!slotsReady || slotsLoading}
                          className="w-full pl-12 pr-4 py-3 rounded-xl border border-brand-border focus:border-teal focus:outline-none transition-colors text-sm text-brand-ink appearance-none bg-white disabled:bg-slate-50 disabled:text-brand-muted/60 disabled:cursor-not-allowed"
                        >
                          <option value="">
                            {!slotsReady
                              ? "Select doctor & date first"
                              : slotsLoading
                              ? "Checking availability..."
                              : t.bookingFormTimePlaceholder}
                          </option>
                          {(slotsReady && slots.length > 0 ? slots : TIME_SLOTS.map((time) => ({ time, available: true, past: false, full: false }) as SlotInfo))
                            .map((s) => (
                              <option key={s.time} value={s.time} disabled={slotsReady && !s.available}>
                                {s.time}
                                {slotsReady && s.full ? " — Booked" : slotsReady && s.past ? " — Passed" : ""}
                              </option>
                            ))}
                        </select>
                      </div>
                      {errors.time && <p className="text-xs text-rose-600 mt-1">{errors.time.message}</p>}
                      {noSlotsFree && (
                        <p className="text-xs text-amber-600 mt-1">
                          No slots left for this doctor on this date. Please pick another date.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Visit Reason (required) + Symptoms (optional) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold uppercase text-brand-ink mb-2">
                        {t.bookingFormVisitReason}
                      </label>
                      <div className="relative">
                        <Stethoscope className="absolute left-4 top-3.5 w-5 h-5 text-brand-muted/70" />
                        <select
                          {...register("visitReason")}
                          className="w-full pl-12 pr-4 py-3 rounded-xl border border-brand-border focus:border-teal focus:outline-none transition-colors text-sm text-brand-ink appearance-none bg-white"
                        >
                          <option value="">{t.bookingFormVisitReasonPlaceholder}</option>
                          {VISIT_REASONS.map((reason) => (
                            <option key={reason} value={reason}>
                              {reason}
                            </option>
                          ))}
                        </select>
                      </div>
                      {errors.visitReason && <p className="text-xs text-rose-600 mt-1">{errors.visitReason.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-brand-ink mb-2">
                        {t.bookingFormSymptoms}
                      </label>
                      <div className="relative">
                        <ClipboardList className="absolute left-4 top-3.5 w-5 h-5 text-brand-muted/70" />
                        <input
                          type="text"
                          placeholder="..."
                          {...register("symptoms")}
                          className="w-full pl-12 pr-4 py-3 rounded-xl border border-brand-border focus:border-teal focus:outline-none transition-colors text-sm text-brand-ink"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Additional Notes (optional) */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-brand-ink mb-2">
                      {t.bookingFormNotes}
                    </label>
                    <div className="relative">
                      <MessageSquare className="absolute left-4 top-3.5 w-5 h-5 text-brand-muted/70" />
                      <textarea
                        rows={2}
                        placeholder="..."
                        {...register("additionalNotes")}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-brand-border focus:border-teal focus:outline-none transition-colors text-sm text-brand-ink"
                      />
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-brand-ink mb-2">
                      {t.bookingFormMessage}
                    </label>
                    <div className="relative">
                      <MessageSquare className="absolute left-4 top-3.5 w-5 h-5 text-brand-muted/70" />
                      <textarea
                        rows={2}
                        placeholder="..."
                        {...register("message")}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-brand-border focus:border-teal focus:outline-none transition-colors text-sm text-brand-ink"
                      />
                    </div>
                  </div>

                  {/* Pediatric Module */}
                  <div className="border-t border-brand-border pt-4 mt-4">
                    <div className="flex items-center gap-3 mb-4">
                      <input
                        type="checkbox"
                        id="isChild"
                        {...register("isChild")}
                        className="w-5 h-5 text-teal border-brand-border rounded focus:ring-teal cursor-pointer"
                      />
                      <label htmlFor="isChild" className="font-heading font-semibold text-brand-ink text-sm flex items-center gap-1.5 cursor-pointer">
                        <Baby className="w-4 h-4 text-teal" />
                        <span>{t.bookingFormChildToggle}</span>
                      </label>
                    </div>

                    {isChildChecked && (
                      <div className="bg-teal-tint/40 p-4 rounded-2xl border border-teal/10 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 mb-1">{t.bookingFormChildName}</label>
                            <input
                              type="text"
                              {...register("childName")}
                              className="w-full px-3 py-2 rounded-lg border border-brand-border focus:outline-none bg-white text-xs text-brand-ink"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 mb-1">{t.bookingFormChildDob}</label>
                            <input
                              type="date"
                              {...register("childDob")}
                              className="w-full px-3 py-2 rounded-lg border border-brand-border focus:outline-none bg-white text-xs text-brand-ink"
                            />
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            id="vaccinationReminderEnabled"
                            {...register("vaccinationReminderEnabled")}
                            className="w-4 h-4 text-teal border-brand-border rounded focus:ring-teal mt-0.5 cursor-pointer"
                          />
                          <label htmlFor="vaccinationReminderEnabled" className="text-[10px] text-brand-muted leading-relaxed cursor-pointer">
                            {t.bookingFormReminders}
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-teal text-white hover:bg-teal-dark py-3.5 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>{t.bookingFormSubmitting}</span>
                      </>
                    ) : (
                      <span>{t.bookingFormSubmit}</span>
                    )}
                  </button>

                </form>
              )}

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
