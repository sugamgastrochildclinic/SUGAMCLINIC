import React from "react";
import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import ClinicSettings from "@/models/ClinicSettings";
import Gallery from "@/models/Gallery";
import AllGalleryView from "@/components/AllGalleryView";
import JsonLd from "@/components/JsonLd";
import { graph, breadcrumbSchema, KEYWORDS } from "@/lib/seo";

// ISR — cached HTML, busted on demand via revalidatePath in admin mutations.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Clinic Gallery — Venkittapuram, Coimbatore",
  description:
    "Virtual tour of Sugam Child & Gastro Care Clinic on Ambethkar Road, Venkittapuram, Coimbatore — child-friendly waiting areas, modern diagnostic & endoscopy facilities, and our care team.",
  keywords: KEYWORDS.gallery,
  alternates: { canonical: "/gallery" },
  openGraph: {
    title: "Gallery | Sugam Child & Gastro Care Clinic, Coimbatore",
    description:
      "Photos of our Coimbatore clinic facilities, child-friendly waiting areas, and modern diagnostic tools.",
    url: "/gallery",
    type: "website",
  },
};

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
    tagline: "Expert Pediatric, Neonatal & Gastroenterology care in Venkittapuram, Coimbatore",
    address: "Sugam Child & Gastro Care Clinic, Ambethkar Road, Near Sindhi Vidyalaya, Venkittapuram, Coimbatore, Tamil Nadu 641025",
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

  const serializedGallery = serialize(gallery);
  const structuredData = graph(
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Gallery", path: "/gallery" },
    ]),
    {
      "@type": "ImageGallery",
      name: "Sugam Clinic Gallery",
      url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/gallery`,
      ...(serializedGallery.length && {
        image: serializedGallery
          .map((g: any) => g.imageUrl)
          .filter(Boolean),
      }),
    }
  );

  return (
    <div className="pt-32 pb-24">
      <JsonLd data={structuredData} />
      <AllGalleryView gallery={serializedGallery} />
    </div>
  );
}
