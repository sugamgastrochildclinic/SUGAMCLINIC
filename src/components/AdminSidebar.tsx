"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Settings,
  Users,
  Activity,
  CalendarDays,
  UserRound,
  Star,
  Image as ImageIcon,
  MessageSquare,
  BookOpen,
  Menu,
  X,
  Stethoscope,
} from "lucide-react";
import LogoutButton from "@/components/LogoutButton";

interface AdminSidebarProps {
  session: any;
}

export default function AdminSidebar({ session }: AdminSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const sidebarLinks = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Clinic Settings", href: "/admin/settings", icon: Settings },
    { name: "Doctors", href: "/admin/doctors", icon: Users },
    { name: "Services", href: "/admin/services", icon: Activity },
    { name: "Appointments", href: "/admin/appointments", icon: CalendarDays },
    { name: "Patients", href: "/admin/patients", icon: UserRound },
    { name: "Reviews", href: "/admin/reviews", icon: Star },
    { name: "Gallery / Media", href: "/admin/gallery", icon: ImageIcon },
    { name: "Contact Messages", href: "/admin/messages", icon: MessageSquare },
    { name: "Health Tips Blog", href: "/admin/blogs", icon: BookOpen },
  ];

  return (
    <>
      {/* Mobile Top Header */}
      <header className="lg:hidden w-full bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <Stethoscope className="w-6 h-6 text-teal" />
          <span className="font-heading font-bold text-base text-white">Sugam Admin</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-slate-400 hover:text-white focus:outline-none"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Backdrop overlay for mobile drawer */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 transition-opacity"
        />
      )}

      {/* Sidebar Navigation Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 border-r border-slate-800 z-50 transition-transform duration-300 lg:translate-x-0 lg:fixed lg:h-screen ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-6 h-6 text-teal" />
              <span className="font-heading font-bold text-lg text-white">Sugam Admin</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-1 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Links */}
          <nav className="p-4 space-y-1 overflow-y-auto max-h-[70vh]">
            {sidebarLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                    isActive
                      ? "bg-teal text-white shadow-md"
                      : "hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-teal/80"}`} />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/20">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs">
              <p className="font-bold text-white">Sugam Admin</p>
              <p className="text-slate-500">Administrator</p>
            </div>
            <Link
              href="/"
              className="text-xs text-teal hover:underline font-semibold"
            >
              View Site
            </Link>
          </div>
          <LogoutButton />
        </div>
      </aside>
    </>
  );
}
