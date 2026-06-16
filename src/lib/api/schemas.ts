import { z } from "zod";

/**
 * Field whitelists for every admin-writable entity. Parsing through these
 * schemas strips unknown keys (Zod's default), which is what prevents
 * mass-assignment: a client can never set `_id`, `approved`, internal flags,
 * or any field not declared here. Create schemas require the mandatory fields;
 * update schemas are `.partial()` so PATCH-style edits send only what changed.
 */

const str = (max: number) => z.string().trim().max(max);
const optStr = (max: number) => z.string().trim().max(max).optional();
const url = z.string().trim().max(2000); // image/CDN URLs

// ---- Gallery ----
export const galleryCreateSchema = z.object({
  imageUrl: url.min(1),
  category: str(60).min(1),
  caption: optStr(500),
  order: z.coerce.number().int().min(0).max(100000).optional(),
});
export const galleryUpdateSchema = galleryCreateSchema.partial();

// ---- Doctor ----
export const doctorCreateSchema = z.object({
  name: str(160).min(1),
  qualification: str(300).min(1),
  specialization: str(200).min(1),
  experience: z.coerce.number().int().min(0).max(100),
  description: str(5000).min(1),
  consultingTime: str(200).min(1),
  phone: str(40).min(1),
  photo: optStr(2000),
  facebook: optStr(2000),
  instagram: optStr(2000),
  linkedin: optStr(2000),
  availability: z.enum(["Available Today", "Fully Booked", "On Leave"]).optional(),
});
export const doctorUpdateSchema = doctorCreateSchema.partial();

// ---- Service ----
export const serviceCreateSchema = z.object({
  title: str(200).min(1),
  description: str(5000).min(1),
  icon: optStr(60),
  image: optStr(2000),
});
export const serviceUpdateSchema = serviceCreateSchema.partial();

// ---- Blog post ----
export const blogCreateSchema = z.object({
  title: str(300).min(1),
  content: z.string().trim().min(1).max(50000),
  image: optStr(2000),
  category: optStr(120),
  author: optStr(160),
  tags: z.array(str(60)).max(50).optional(),
});
export const blogUpdateSchema = blogCreateSchema.partial();

// ---- FAQ ----
export const faqCreateSchema = z.object({
  question: str(500).min(1),
  answer: z.string().trim().min(1).max(5000),
});
export const faqUpdateSchema = faqCreateSchema.partial();

// ---- Review (admin update only; public create is validated in the route) ----
export const reviewUpdateSchema = z.object({
  name: str(120).optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  reviewText: str(2000).optional(),
  photo: optStr(500),
  approved: z.boolean().optional(),
});

// ---- Appointment status update (admin) ----
export const appointmentStatusSchema = z.object({
  status: z.enum(["Pending", "Confirmed", "Completed", "Cancelled"]),
});

// ---- Contact message status update (admin) ----
export const contactStatusSchema = z.object({
  status: z.enum(["Unread", "Read", "Replied", "Archived"]),
});

// ---- Clinic settings (admin) ----
// Every editable field is a plain string. Unknown keys (timestamps, _id,
// __v) are stripped, closing the Object.assign mass-assignment hole.
const settingsField = z.string().trim().max(5000).optional();
export const settingsUpdateSchema = z.object({
  clinicName: settingsField,
  tagline: settingsField,
  logo: settingsField,
  favicon: settingsField,
  heroImage: settingsField,
  address: settingsField,
  phone: settingsField,
  email: settingsField,
  whatsapp: settingsField,
  mapsUrl: settingsField,
  workingHours: settingsField,
  facebook: settingsField,
  instagram: settingsField,
  youtube: settingsField,
  linkedin: settingsField,
  seoTitle: settingsField,
  seoDescription: settingsField,
  seoKeywords: settingsField,
  ogImage: settingsField,
  aboutBadge: settingsField,
  aboutTitle: settingsField,
  aboutDesc1: settingsField,
  aboutDesc2: settingsField,
  aboutMission: settingsField,
  aboutMissionDesc: settingsField,
  aboutVision: settingsField,
  aboutVisionDesc: settingsField,
  aboutPremium: settingsField,
  aboutPremiumDesc: settingsField,
});
