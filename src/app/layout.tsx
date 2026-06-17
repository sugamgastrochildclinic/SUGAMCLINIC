import type { Metadata } from "next";
import { Outfit, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import PublicLayoutWrapper from "@/components/PublicLayoutWrapper";

import { unstable_cache } from "next/cache";
import { connectToDatabase } from "@/lib/db";
import ClinicSettings from "@/models/ClinicSettings";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700"],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sugamgastrochildclinic.com";
const siteTitle = "Sugam Child & Gastro Care Clinic";
// Homepage <title> — leads with the top commercial + local keywords so the
// city query ("pediatrician in Coimbatore") matches the title tag.
const homeTitle =
  "Pediatrician in Coimbatore | Neonatologist & Pediatric Gastroenterologist | Sugam Clinic";
const siteDescription =
  "Sugam Child & Gastro Care Clinic in Coimbatore offers expert pediatric, neonatal and pediatric gastroenterology care. Trusted pediatrician in Coimbatore for newborn care, vaccinations, jaundice, stomach pain, liver disorders and child health consultations. Book an appointment today.";
// Question-led variant — higher click-through on social shares.
const siteSocialDescription =
  "Looking for a pediatrician in Coimbatore? Sugam Child & Gastro Care Clinic, Venkittapuram provides expert newborn care, child vaccinations, pediatric gastroenterology, jaundice treatment, stomach pain and liver disease care. Book your appointment today.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: homeTitle,
    template: `%s | ${siteTitle}`,
  },
  description: siteDescription,
  applicationName: siteTitle,
  keywords: [
    "Sugam Clinic Coimbatore",
    "pediatrician in Coimbatore",
    "child specialist Coimbatore",
    "best pediatrician Coimbatore",
    "child doctor Venkittapuram Coimbatore",
    "neonatologist Coimbatore",
    "gastroenterologist Coimbatore",
    "pediatric gastroenterologist Coimbatore",
    "child hospital Coimbatore",
    "liver specialist Coimbatore",
    "vaccination clinic Coimbatore",
    "best child clinic Coimbatore",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    title: siteTitle,
    description: siteSocialDescription,
    siteName: siteTitle,
    images: [
      {
        url: "/hero-logo-desktop.jpg",
        width: 1200,
        height: 630,
        alt: siteTitle,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteSocialDescription,
    images: ["/hero-logo-desktop.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  formatDetection: { telephone: true, email: true, address: true },
};

const getLayoutSettings = unstable_cache(
  async () => {
    try {
      await connectToDatabase();
      return await ClinicSettings.findOne()
        .select("clinicName logo favicon phone whatsapp email address workingHours facebook instagram youtube linkedin createdAt updatedAt")
        .lean();
    } catch (err) {
      console.error("Layout settings load err:", err);
      return null;
    }
  },
  ["public-layout-settings"],
  { revalidate: 300 }
);

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings: any = await getLayoutSettings();
  const faviconUrl = settings?.favicon || "/favicon.ico";
  const serializedSettings = settings ? JSON.parse(JSON.stringify(settings)) : null;

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" href={faviconUrl} />
      </head>
      <body className={`${outfit.variable} ${spaceGrotesk.variable} antialiased`}>
        <Providers>
          <PublicLayoutWrapper settings={serializedSettings}>
            {children}
          </PublicLayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}
