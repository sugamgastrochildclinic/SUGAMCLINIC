"use client";

import React, { useState } from "react";
import { ArrowLeft, ShieldCheck, Search } from "lucide-react";
import ServiceIcon from "@/components/ServiceIcon";
import Link from "next/link";

interface AllServicesViewProps {
  services: any[];
}

export default function AllServicesView({ services }: AllServicesViewProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Render a service icon by name from the curated, tree-shakeable map.
  const renderIcon = (iconName: string) => (
    <ServiceIcon name={iconName} className="w-8 h-8 text-teal" />
  );

  const filteredServices = services.filter(
    (service) =>
      service.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      {/* Back Button & Title */}
      <div className="mb-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-teal font-bold hover:text-teal-dark transition-all text-sm mb-6 group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Home</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-brand-border/60 pb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-tint text-teal-dark text-xs font-semibold mb-3">
              <ShieldCheck className="w-4 h-4 text-teal" />
              <span>Specialized Departments</span>
            </div>
            <h1 className="font-heading font-bold text-3xl sm:text-4xl text-brand-ink">
              Our Medical Services
            </h1>
            <p className="text-brand-muted text-sm mt-2">
              Comprehensive clinical solutions for children, newborns, and gastroenterology conditions.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full max-w-xs shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-brand-border focus:border-teal focus:outline-none text-xs text-brand-ink"
            />
          </div>
        </div>
      </div>

      {/* Services Grid */}
      {filteredServices.length === 0 ? (
        <div className="text-center py-20 text-brand-muted text-sm border border-dashed border-brand-border rounded-3xl bg-white max-w-md mx-auto">
          No services matching your search query.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredServices.map((service: any) => (
            <div
              key={service._id}
              className="bg-white p-8 rounded-3xl border border-brand-border hover:border-teal/30 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="w-16 h-16 rounded-2xl bg-teal-tint flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  {renderIcon(service.icon)}
                </div>
                <h3 className="font-heading font-bold text-xl text-brand-ink mb-3 group-hover:text-teal transition-colors">
                  {service.title}
                </h3>
                <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
                  {service.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
