import mongoose, { Schema } from "mongoose";

const ClinicSettingsSchema = new Schema(
  {
    clinicName: { type: String, default: "Sugam Child & Gastro Care Clinic" },
    tagline: { type: String, default: "Expert Pediatric, Neonatal & Gastroenterology care in Venkittapuram, Coimbatore" },
    logo: { type: String, default: "" },
    favicon: { type: String, default: "" },
    heroImage: { type: String, default: "" },
    address: { type: String, default: "Sugam Child & Gastro Care Clinic, Ambethkar Road, Near Sindhi Vidyalaya, Venkittapuram, Coimbatore, Tamil Nadu 641025" },
    phone: { type: String, default: "+91 98765 43210" },
    email: { type: String, default: "info@sugamclinic.com" },
    whatsapp: { type: String, default: "+91 98765 43210" },
    mapsUrl: { type: String, default: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3886.5709971936357!2d80.21852877593259!3d13.062402113203498!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a5267b14dcd69eb%3A0xe54e604f3263a2!2sApollo%20Children&#39;s%20Hospitals!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin" },
    workingHours: { type: String, default: "Mon - Sat: 9:00 AM - 8:00 PM, Sun: 10:00 AM - 2:00 PM" },
    facebook: { type: String, default: "" },
    instagram: { type: String, default: "" },
    youtube: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    seoTitle: { type: String, default: "Sugam Child & Gastro Care Clinic - Pediatric & Gastroenterology Clinic" },
    seoDescription: { type: String, default: "Expert child health, neonatology, gastroenterology, and liver care services by top specialists at Sugam Clinic." },
    seoKeywords: { type: String, default: "pediatric, gastroenterology, child health, liver care, Sugam clinic" },
    ogImage: { type: String, default: "" },

    // About section content. Blank = fall back to the per-language defaults in
    // lib/translations.ts. A non-empty value here overrides ALL languages.
    aboutBadge: { type: String, default: "" },
    aboutTitle: { type: String, default: "" },
    aboutDesc1: { type: String, default: "" },
    aboutDesc2: { type: String, default: "" },
    aboutMission: { type: String, default: "" },
    aboutMissionDesc: { type: String, default: "" },
    aboutVision: { type: String, default: "" },
    aboutVisionDesc: { type: String, default: "" },
    aboutPremium: { type: String, default: "" },
    aboutPremiumDesc: { type: String, default: "" },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV === "development" && mongoose.models.ClinicSettings) {
  delete (mongoose.models as any).ClinicSettings;
}

export default mongoose.models.ClinicSettings || mongoose.model("ClinicSettings", ClinicSettingsSchema);
