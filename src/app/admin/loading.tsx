// Instant skeleton shown the moment "Dashboard" is clicked. Without this, the
// nav blocks on the dashboard's server-side DB queries before anything paints.
// Next.js streams this immediately, then swaps in the real page when ready.
import React from "react";

export default function AdminLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-8 w-64 bg-slate-200 rounded-lg" />
        <div className="h-4 w-80 bg-slate-100 rounded mt-2" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4"
          >
            <div className="w-14 h-14 rounded-xl bg-slate-200 shrink-0" />
            <div className="flex-1">
              <div className="h-3 w-20 bg-slate-100 rounded" />
              <div className="h-6 w-12 bg-slate-200 rounded mt-2" />
            </div>
          </div>
        ))}
      </div>

      {/* Insights row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-24"
            />
          ))}
        </div>
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-40" />
      </div>

      {/* Tables row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-72" />
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-72" />
      </div>
    </div>
  );
}
