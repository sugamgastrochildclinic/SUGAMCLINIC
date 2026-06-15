import React from "react";
import { connectToDatabase } from "@/lib/db";
import ClinicSettings from "@/models/ClinicSettings";
import Gallery from "@/models/Gallery";
import AllGalleryView from "@/components/AllGalleryView";

// ISR — cached HTML, busted on demand via revalidatePath in admin mutations.
export const revalidate = 300;

export default async function GalleryPage() {
  let settings = null;
  let gallery: any[] = [];

  try {
    await connectToDatabase();
    const [settingsRes, galleryRes] = await Promise.all([
      ClinicSettings.findOne().lean(),
      Gallery.find({ category: { $in: ["gallery", "services", "doctors"] } }).sort({ order: 1, createdAt: -1 }).lean()
    ]);
    settings = settingsRes;
    gallery = galleryRes;
  } catch (error) {
    console.error("Gallery page db error:", error);
  }

  const finalSettings = settings || {
    clinicName: "Sugam Child & Gastro Care Clinic",
    tagline: "Premium Pediatric, Neonatal & Gastroenterology Care",
    address: "Sugam Clinic, 14/2, Hospital Road, Near Bus Stand, Tamil Nadu",
    phone: "+91 94432 12345",
    email: "contact@sugamclinic.com",
    whatsapp: "+91 94432 12345",
  };

  const serialize = (arr: any[]) =>
    arr.map((item) => ({
      ...item,
      _id: item._id ? item._id.toString() : "",
      createdAt: item.createdAt ? item.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: item.updatedAt ? item.updatedAt.toISOString() : new Date().toISOString(),
    }));

  return (
    <div className="pt-32 pb-24">
      <AllGalleryView gallery={serialize(gallery)} />
    </div>
  );
}
