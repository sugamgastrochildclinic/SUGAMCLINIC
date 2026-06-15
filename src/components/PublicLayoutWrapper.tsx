"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";
import FloatingActions from "./FloatingActions";
import LoadingScreen from "./LoadingScreen";

interface PublicLayoutWrapperProps {
  settings: any;
  children: React.ReactNode;
}

export default function PublicLayoutWrapper({ settings, children }: PublicLayoutWrapperProps) {
  const pathname = usePathname();
  const isPublicRoute = !pathname?.startsWith("/admin") && !pathname?.startsWith("/login");

  if (!isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-white">
      <LoadingScreen />
      <Navbar settings={settings} lang="en" />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} lang="en" />
      <FloatingActions settings={settings} />
    </div>
  );
}
