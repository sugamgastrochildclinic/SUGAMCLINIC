import React from "react";
import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import ClinicSettings from "@/models/ClinicSettings";
import Service from "@/models/Service";
import AllServicesView from "@/components/AllServicesView";
import JsonLd from "@/components/JsonLd";
import { graph, breadcrumbSchema, serviceListSchema, KEYWORDS } from "@/lib/seo";

// ISR — cached HTML, busted on demand via revalidatePath in admin mutations.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Pediatric, Neonatal & Gastroenterology Services in Coimbatore",
  description:
    "Sugam Clinic, Coimbatore services: pediatric consultation, neonatology & newborn care, pediatric gastroenterology, ERCP & endoscopy, liver/hepatology care, and child vaccination (IAP schedule).",
  keywords: KEYWORDS.services,
  alternates: { canonical: "/services" },
  openGraph: {
    title: "Medical Services in Coimbatore | Sugam Child & Gastro Care Clinic",
    description:
      "Pediatric, neonatal, gastroenterology, endoscopy, liver care & child vaccination for children in Coimbatore & Venkittapuram.",
    url: "/services",
    type: "website",
  },
};

export default async function ServicesPage() {
  let settings = null;
  let services: any[] = [];

  try {
    await connectToDatabase();
    const [settingsRes, servicesRes] = await Promise.all([
      ClinicSettings.findOne().lean(),
      Service.find().sort({ createdAt: -1 }).lean()
    ]);
    settings = settingsRes;
    services = servicesRes;
  } catch (error) {
    console.error("Services page db error:", error);
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

  const serializedServices = serialize(services);
  const structuredData = graph(
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Services", path: "/services" },
    ]),
    serviceListSchema(serializedServices)
  );

  return (
    <div className="pt-32 pb-24">
      <JsonLd data={structuredData} />
      <AllServicesView services={serializedServices} />
    </div>
  );
}
