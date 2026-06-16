import React from "react";
import { connectToDatabase } from "@/lib/db";
import ClinicSettings from "@/models/ClinicSettings";
import Doctor from "@/models/Doctor";
import Service from "@/models/Service";
import Review from "@/models/Review";
import FAQ from "@/models/FAQ";
import BlogPost from "@/models/BlogPost";
import Gallery from "@/models/Gallery";
import MainHome from "@/components/MainHome";
import { seedDatabase } from "@/lib/seed";
import JsonLd from "@/components/JsonLd";
import {
  graph,
  organizationSchema,
  medicalClinicSchema,
  websiteSchema,
  faqSchema,
  physicianSchemas,
} from "@/lib/seo";

export const revalidate = 300;

export default async function Page() {
  let settings = null;
  let doctors: any[] = [];
  let services: any[] = [];
  let reviews: any[] = [];
  let faqs: any[] = [];
  let blogs: any[] = [];
  let gallery: any[] = [];

  try {
    await connectToDatabase();

    // Fetch from database in parallel
    const [
      settingsRes,
      doctorsRes,
      servicesRes,
      reviewsRes,
      faqsRes,
      blogsRes,
      galleryRes,
    ] = await Promise.all([
      ClinicSettings.findOne().lean(),
      Doctor.find()
        .select("name qualification specialization experience description consultingTime phone availability photo createdAt updatedAt")
        .sort({ createdAt: -1 })
        .limit(4)
        .lean(),
      Service.find()
        .select("title description icon createdAt updatedAt")
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
      Review.find({ approved: true })
        .select("name rating reviewText createdAt updatedAt")
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
      FAQ.find()
        .select("question answer createdAt updatedAt")
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
      BlogPost.find()
        .select("title content category tags author image createdAt updatedAt")
        .sort({ createdAt: -1 })
        .limit(3)
        .lean(),
      Gallery.find({ category: { $in: ["gallery", "services", "doctors"] } })
        .select("imageUrl category caption order createdAt updatedAt")
        .sort({ order: 1, createdAt: -1 })
        .limit(8)
        .lean(),
    ]);

    settings = settingsRes;
    doctors = doctorsRes;
    services = servicesRes;
    reviews = reviewsRes;
    faqs = faqsRes;
    blogs = blogsRes;
    gallery = galleryRes;

    // Auto seed if database is empty
    if (!settings || doctors.length === 0 || services.length === 0) {
      console.log("Database empty. Seeding database directly on server...");
      try {
        await seedDatabase();
        // Refetch after seeding in parallel
        const [
          settingsRes2,
          doctorsRes2,
          servicesRes2,
          reviewsRes2,
          faqsRes2,
          blogsRes2,
          galleryRes2,
        ] = await Promise.all([
          ClinicSettings.findOne().lean(),
          Doctor.find()
            .select("name qualification specialization experience description consultingTime phone availability photo createdAt updatedAt")
            .sort({ createdAt: -1 })
            .limit(4)
            .lean(),
          Service.find()
            .select("title description icon createdAt updatedAt")
            .sort({ createdAt: -1 })
            .limit(6)
            .lean(),
          Review.find({ approved: true })
            .select("name rating reviewText createdAt updatedAt")
            .sort({ createdAt: -1 })
            .limit(6)
            .lean(),
          FAQ.find()
            .select("question answer createdAt updatedAt")
            .sort({ createdAt: -1 })
            .limit(8)
            .lean(),
          BlogPost.find()
            .select("title content category tags author image createdAt updatedAt")
            .sort({ createdAt: -1 })
            .limit(3)
            .lean(),
          Gallery.find({ category: { $in: ["gallery", "services", "doctors"] } })
            .select("imageUrl category caption order createdAt updatedAt")
            .sort({ order: 1, createdAt: -1 })
            .limit(8)
            .lean(),
        ]);

        settings = settingsRes2;
        doctors = doctorsRes2;
        services = servicesRes2;
        reviews = reviewsRes2;
        faqs = faqsRes2;
        blogs = blogsRes2;
        gallery = galleryRes2;
      } catch (setupErr) {
        console.error("Auto seeding failed:", setupErr);
      }
    }
  } catch (error) {
    console.error("Database connection failed in Page Server Component:", error);
  }


  // Fallback / Mock Data if DB connection isn't working
  const finalSettings = settings || {
    clinicName: "Sugam Child & Gastro Care Clinic",
    tagline: "Expert Pediatric, Neonatal & Gastroenterology care in Venkittapuram, Coimbatore",
    address: "Sugam Child & Gastro Care Clinic, Ambethkar Road, Near Sindhi Vidyalaya, Venkittapuram, Coimbatore, Tamil Nadu 641025",
    phone: "+91 94432 12345",
    email: "contact@sugamclinic.com",
    whatsapp: "+91 94432 12345",
    workingHours: "Mon - Sat: 9:00 AM - 1:00 PM, 5:00 PM - 8:30 PM",
  };

  const finalDoctors = doctors.length > 0 ? doctors : [
    {
      _id: "doc1",
      name: "Dr. S. Karthik, MD (Peds), DM (Gastro)",
      qualification: "MD (Pediatrics), DM (Gastroenterology)",
      specialization: "Pediatric Gastroenterologist & Hepatologist",
      experience: 15,
      description: "Over 15 years of experience treating pediatric gastrointestinal disorders, newborn digestive complications, and complex pediatric liver diseases.",
      consultingTime: "Mon - Sat: 10:00 AM - 1:00 PM, 5:00 PM - 8:00 PM",
      phone: "+91 94432 12345",
      availability: "Available Today",
    }
  ];

  const finalServices = services.length > 0 ? services : [
    { _id: "s1", title: "Pediatric Consultation", description: "Comprehensive health checkups for infants, children, and teens.", icon: "Baby" },
    { _id: "s2", title: "Neonatology & Newborn Care", description: "Expert care for premature babies, newborn jaundice, and feeding issues.", icon: "ShieldAlert" },
    { _id: "s3", title: "Pediatric Gastroenterology", description: "Advanced diagnostics and treatment for childhood stomach pain and acid reflux.", icon: "Activity" }
  ];

  // Map mongoose models object IDs to strings for serialization
  const serialize = (arr: any[]) =>
    arr.map((item) => ({
      ...item,
      _id: item._id ? item._id.toString() : "",
      createdAt: item.createdAt ? item.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: item.updatedAt ? item.updatedAt.toISOString() : new Date().toISOString(),
      doctor: item.doctor ? item.doctor.toString() : undefined,
    }));

  const settingsForSchema = JSON.parse(JSON.stringify(finalSettings));
  const structuredData = graph(
    websiteSchema(),
    organizationSchema(settingsForSchema),
    medicalClinicSchema(settingsForSchema),
    faqSchema(faqs),
    ...physicianSchemas(serialize(finalDoctors))
  );

  return (
    <>
      <JsonLd data={structuredData} />
      <MainHome
        settings={settingsForSchema}
        doctors={serialize(finalDoctors)}
        services={serialize(finalServices)}
        reviews={serialize(reviews)}
        faqs={serialize(faqs)}
        blogs={serialize(blogs)}
        gallery={serialize(gallery)}
      />
    </>
  );
}
