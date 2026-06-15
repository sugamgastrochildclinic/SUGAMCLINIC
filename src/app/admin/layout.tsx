import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import { AdminDataProvider } from "@/components/AdminDataProvider";
import { AdminFeedbackProvider } from "@/components/AdminFeedback";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "admin") {
    redirect("/login");
  }

  return (
    <AdminDataProvider>
      <AdminFeedbackProvider>
      <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
        {/* Responsive Sidebar component */}
        <AdminSidebar session={session} />

        {/* Main Panel Content */}
        <main className="flex-1 min-w-0 lg:ml-64 p-4 sm:p-6 lg:p-8 bg-slate-50/50">
          {children}
        </main>
      </div>
      </AdminFeedbackProvider>
    </AdminDataProvider>
  );
}
