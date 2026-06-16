import React from "react";
import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import ClinicSettings from "@/models/ClinicSettings";
import BlogPost from "@/models/BlogPost";
import AllBlogsView from "@/components/AllBlogsView";
import JsonLd from "@/components/JsonLd";
import { graph, breadcrumbSchema, blogListSchema, KEYWORDS } from "@/lib/seo";

// ISR — cached HTML, busted on demand via revalidatePath in admin mutations.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Child Health Blog — Newborn Care, Vaccination & Nutrition Tips",
  description:
    "Doctor-written health advice from Sugam Clinic, Coimbatore: newborn jaundice, child stomach pain & acid reflux, IAP vaccination schedule, growth charts, and when to start solid food.",
  keywords: KEYWORDS.blog,
  alternates: { canonical: "/blogs" },
  openGraph: {
    title: "Child Health Blog | Sugam Child & Gastro Care Clinic",
    description:
      "Newborn care tips, IAP vaccination schedule, jaundice & acid reflux guidance, and answers to common pediatric questions.",
    url: "/blogs",
    type: "website",
  },
};

export default async function BlogsPage() {
  let settings = null;
  let posts: any[] = [];

  try {
    await connectToDatabase();
    const [settingsRes, postsRes] = await Promise.all([
      ClinicSettings.findOne().lean(),
      BlogPost.find().sort({ createdAt: -1 }).lean()
    ]);
    settings = settingsRes;
    posts = postsRes;
  } catch (error) {
    console.error("Blogs page db error:", error);
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

  const serializedPosts = serialize(posts);
  const structuredData = graph(
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Blog", path: "/blogs" },
    ]),
    blogListSchema(serializedPosts)
  );

  return (
    <div className="pt-32 pb-24">
      <JsonLd data={structuredData} />
      <AllBlogsView posts={serializedPosts} />
    </div>
  );
}
