import type { Metadata } from "next";
import { Outfit, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import PublicLayoutWrapper from "@/components/PublicLayoutWrapper";

import Script from "next/script";
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

export const metadata: Metadata = {
  title: "Sugam Child & Gastro Care Clinic",
  description: "Premium Pediatric, Neonatology, Child Health, and Gastroenterology Clinic.",
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
        <div id="google_translate_element" className="hidden" />
        <Script
          src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="lazyOnload"
        />
        <Script id="google-translate-init" strategy="lazyOnload">
          {`
            window.googleTranslateElementInit = function() {
              new google.translate.TranslateElement({
                pageLanguage: 'en',
                includedLanguages: 'en,ta,ml,kn,te,hi',
                autoDisplay: false
              }, 'google_translate_element');
            }
          `}
        </Script>
      </body>
    </html>
  );
}
