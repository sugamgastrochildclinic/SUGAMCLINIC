"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Check,
  X,
  Loader2,
  Clock,
  Phone,
  Mail,
  Baby,
  Calendar,
  Trash2,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Download,
  CheckSquare,
  Square,
} from "lucide-react";

type Toast = { type: "success" | "error"; msg: string } | null;

const DATE_FILTERS = [
  "All",
  "Today",
  "Yesterday",
  "Last 7 Days",
  "Last 30 Days",
  "This Month",
  "Upcoming",
  "Custom Range",
] as const;
type DateFilter = (typeof DATE_FILTERS)[number];

// Parse a "YYYY-MM-DD" string into a local Date at midnight (avoids TZ drift).
const parseYMD = (s: string): Date | null => {
  if (!s || typeof s !== "string") return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (d: Date, n: number) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState<DateFilter>("All");
  const [search, setSearch] = useState("");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const [confirmDelete, setConfirmDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  // Selective bulk delete (only Completed/Cancelled rows are selectable).
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const isDeletable = (a: any) =>
    a.status === "Completed" || a.status === "Cancelled";

  useEffect(() => {
    fetchAppointments();
    // Honor a ?status= deep link from the dashboard stat cards.
    const params = new URLSearchParams(window.location.search);
    const s = params.get("status");
    if (s && ["All", "Pending", "Confirmed", "Completed", "Cancelled"].includes(s)) {
      setStatusFilter(s);
    }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const fetchAppointments = () => {
    setLoading(true);
    fetch("/api/appointments")
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.data;
        if (Array.isArray(list)) setAppointments(list);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/appointments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      fetchAppointments();
      setToast({ type: "success", msg: `Appointment marked ${status}.` });
    } catch (err) {
      console.error(err);
      setToast({ type: "error", msg: "Could not update the appointment." });
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/appointments?id=${confirmDelete._id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      // Remove from UI immediately on success.
      setAppointments((prev) => prev.filter((a) => a._id !== confirmDelete._id));
      setToast({ type: "success", msg: "Appointment deleted permanently." });
      setConfirmDelete(null);
    } catch (err) {
      console.error(err);
      setToast({ type: "error", msg: "Could not delete the appointment." });
    } finally {
      setDeleting(false);
    }
  };

  // Date-range predicate based on the selected date filter.
  const matchesDateFilter = (apptDate: string): boolean => {
    if (dateFilter === "All") return true;
    const d = parseYMD(apptDate);
    if (!d) return false;
    const today = startOfToday();

    switch (dateFilter) {
      case "Today":
        return d.getTime() === today.getTime();
      case "Yesterday":
        return d.getTime() === addDays(today, -1).getTime();
      case "Last 7 Days":
        return d >= addDays(today, -7) && d <= today;
      case "Last 30 Days":
        return d >= addDays(today, -30) && d <= today;
      case "This Month":
        return (
          d.getMonth() === today.getMonth() &&
          d.getFullYear() === today.getFullYear()
        );
      case "Upcoming":
        return d > today;
      case "Custom Range": {
        const from = customFrom ? parseYMD(customFrom) : null;
        const to = customTo ? parseYMD(customTo) : null;
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
      }
      default:
        return true;
    }
  };

  const matchesSearch = (appt: any): boolean => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      appt.name?.toLowerCase().includes(q) ||
      appt.phone?.toLowerCase().includes(q) ||
      appt.email?.toLowerCase().includes(q) ||
      appt.childName?.toLowerCase().includes(q) ||
      appt.visitReason?.toLowerCase().includes(q)
    );
  };

  // Filter (status + date + search), then group by date, then sort the groups
  // chronologically (most recent / upcoming first).
  const groups = useMemo(() => {
    const filtered = appointments.filter(
      (a) =>
        (statusFilter === "All" || a.status === statusFilter) &&
        matchesDateFilter(a.date) &&
        matchesSearch(a)
    );

    const byDate = new Map<string, any[]>();
    for (const a of filtered) {
      const key = a.date || "Unknown";
      if (!byDate.has(key)) byDate.set(key, []);
      byDate.get(key)!.push(a);
    }

    return Array.from(byDate.entries()).sort((a, b) => {
      const da = parseYMD(a[0]);
      const db = parseYMD(b[0]);
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return db.getTime() - da.getTime(); // newest / upcoming first
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointments, statusFilter, dateFilter, search, customFrom, customTo]);

  const totalFiltered = useMemo(
    () => groups.reduce((sum, [, list]) => sum + list.length, 0),
    [groups]
  );

  // Flat list of currently-visible (filtered) appointments.
  const visibleRows = useMemo(
    () => groups.flatMap(([, list]) => list),
    [groups]
  );

  // Deletable (Completed/Cancelled) ids in the current view.
  const deletableVisibleIds = useMemo(
    () => visibleRows.filter(isDeletable).map((a) => a._id),
    [visibleRows]
  );

  const allVisibleSelected =
    deletableVisibleIds.length > 0 &&
    deletableVisibleIds.every((id) => selectedIds.has(id));

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (deletableVisibleIds.every((id) => prev.has(id))) {
        // all selected -> clear those
        const next = new Set(prev);
        deletableVisibleIds.forEach((id) => next.delete(id));
        return next;
      }
      return new Set([...prev, ...deletableVisibleIds]);
    });
  };

  // CSV export (opens natively in Excel). Exports the current filtered view.
  const exportToExcel = () => {
    if (visibleRows.length === 0) {
      setToast({ type: "error", msg: "Nothing to export for the current filters." });
      return;
    }
    const headers = [
      "Name", "Phone", "Email", "Date", "Time", "Doctor", "Specialization",
      "Status", "Visit Reason", "Symptoms", "Additional Notes",
      "Is Child", "Child Name", "Child DOB", "Vaccination Reminders",
      "Message", "Booked On",
    ];
    const esc = (v: any) => {
      let s = v === undefined || v === null ? "" : String(v);
      // CSV formula-injection guard: a cell starting with = + - @ (or tab/CR)
      // is treated as a formula by Excel/Sheets. Visitor-submitted fields flow
      // into this export, so neutralize by prefixing a single quote.
      if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
      // Escape for CSV: wrap in quotes, double inner quotes.
      return `"${s.replace(/"/g, '""')}"`;
    };
    const rows = visibleRows.map((a) =>
      [
        a.name, a.phone, a.email, a.date, a.time,
        a.doctor?.name || "", a.doctor?.specialization || "",
        a.status, a.visitReason || "", a.symptoms || "", a.additionalNotes || "",
        a.isChild ? "Yes" : "No", a.childName || "", a.childDob || "",
        a.vaccinationReminderEnabled ? "Yes" : "No", a.message || "",
        a.createdAt ? new Date(a.createdAt).toLocaleString() : "",
      ].map(esc).join(",")
    );
    // BOM so Excel reads UTF-8 correctly.
    const csv = "﻿" + [headers.map(esc).join(","), ...rows].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `appointments-${stamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setToast({ type: "success", msg: `Exported ${visibleRows.length} appointment(s).` });
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBulkDeleting(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error("Bulk delete failed");
      const data = await res.json().catch(() => ({}));
      const deleted = typeof data.deleted === "number" ? data.deleted : ids.length;
      setAppointments((prev) => prev.filter((a) => !selectedIds.has(a._id)));
      setSelectedIds(new Set());
      setConfirmBulk(false);
      setToast({ type: "success", msg: `Deleted ${deleted} appointment(s).` });
    } catch (err) {
      console.error(err);
      setToast({ type: "error", msg: "Could not delete the selected appointments." });
    } finally {
      setBulkDeleting(false);
    }
  };

  // Friendly section label for a date group.
  const groupLabel = (dateStr: string): string => {
    const d = parseYMD(dateStr);
    if (!d) return "Undated";
    const today = startOfToday();
    if (d.getTime() === today.getTime()) return "Today";
    if (d.getTime() === addDays(today, -1).getTime()) return "Yesterday";
    if (d.getTime() === addDays(today, 1).getTime()) return "Tomorrow";
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-3xl text-slate-800">Appointments Planner</h1>
          <p className="text-sm text-slate-500 mt-1">Track schedules, approve slots, and send automated email confirmations.</p>
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-200/60 p-1.5 rounded-xl border border-slate-200 shrink-0 w-fit overflow-x-auto">
          {["All", "Pending", "Confirmed", "Completed", "Cancelled"].map((item) => (
            <button
              key={item}
              onClick={() => setStatusFilter(item)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === item ? "bg-white text-teal shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Search + Date filters toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, email, or child..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal/40 transition-all"
          />
        </div>

        {/* Date filter chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {DATE_FILTERS.map((item) => (
            <button
              key={item}
              onClick={() => setDateFilter(item)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
                dateFilter === item
                  ? "bg-teal text-white border-teal shadow-sm"
                  : "bg-white text-slate-500 border-slate-200 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {/* Export to Excel (exports the current filtered view) */}
        <button
          onClick={exportToExcel}
          className="lg:ml-auto flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all cursor-pointer shadow-sm shrink-0 w-fit"
          title="Download the current view as an Excel/CSV file"
        >
          <Download className="w-4 h-4" />
          Download Excel
        </button>
      </div>

      {/* Custom range inputs */}
      {dateFilter === "Custom Range" && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4 -mt-3">
          <label className="text-xs font-bold text-slate-600 flex items-center gap-2">
            From
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal/30"
            />
          </label>
          <label className="text-xs font-bold text-slate-600 flex items-center gap-2">
            To
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal/30"
            />
          </label>
          {(customFrom || customTo) && (
            <button
              onClick={() => {
                setCustomFrom("");
                setCustomTo("");
              }}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 cursor-pointer"
            >
              Clear range
            </button>
          )}
        </div>
      )}

      {/* Bulk-selection action bar */}
      {selectedIds.size > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-800 text-white rounded-2xl px-4 py-3 shadow-sm">
          <span className="text-sm font-bold flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-teal-light" />
            {selectedIds.size} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:bg-slate-700 border border-slate-600 transition-all cursor-pointer"
            >
              Clear selection
            </button>
            <button
              onClick={() => setConfirmBulk(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 transition-all cursor-pointer flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete selected
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-teal" />
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase">
                  <th className="pl-6 pr-2 py-6 w-10">
                    <button
                      onClick={toggleSelectAll}
                      disabled={deletableVisibleIds.length === 0}
                      title="Select all Completed/Cancelled in view"
                      className="text-slate-400 hover:text-teal disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer align-middle"
                    >
                      {allVisibleSelected ? (
                        <CheckSquare className="w-4 h-4 text-teal" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="p-6 font-semibold">Patient Information</th>
                  <th className="p-6 font-semibold">Booking Slot</th>
                  <th className="p-6 font-semibold">Specialist Doctor</th>
                  <th className="p-6 font-semibold">Child Module / reminders</th>
                  <th className="p-6 font-semibold">Status</th>
                  <th className="p-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {totalFiltered === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-400 text-sm">
                      No appointments matching the current filters.
                    </td>
                  </tr>
                ) : (
                  groups.map(([dateKey, list]) => (
                    <React.Fragment key={dateKey}>
                      {/* Day-wise section header */}
                      <tr className="bg-slate-50/80">
                        <td colSpan={7} className="px-6 py-3 border-y border-slate-100">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-teal" />
                            <span className="font-heading font-bold text-sm text-slate-700">
                              {groupLabel(dateKey)}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-200/70 px-2 py-0.5 rounded-full">
                              {list.length}
                            </span>
                          </div>
                        </td>
                      </tr>

                      {list.map((appt) => (
                        <tr
                          key={appt._id}
                          className={`transition-colors ${
                            selectedIds.has(appt._id)
                              ? "bg-teal-tint/30"
                              : "hover:bg-slate-50/50"
                          }`}
                        >
                          {/* Row select (only Completed/Cancelled are selectable) */}
                          <td className="pl-6 pr-2 py-6 align-top">
                            {isDeletable(appt) ? (
                              <button
                                onClick={() => toggleSelect(appt._id)}
                                title="Select for deletion"
                                className="text-slate-400 hover:text-teal cursor-pointer"
                              >
                                {selectedIds.has(appt._id) ? (
                                  <CheckSquare className="w-4 h-4 text-teal" />
                                ) : (
                                  <Square className="w-4 h-4" />
                                )}
                              </button>
                            ) : (
                              <span className="block w-4 h-4" />
                            )}
                          </td>

                          {/* Patient Info */}
                          <td className="p-6">
                            <p className="font-heading font-bold text-sm text-slate-800">{appt.name}</p>
                            <div className="mt-1 space-y-1 text-[10px] text-slate-400 font-medium">
                              <p className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {appt.phone}</p>
                              <p className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {appt.email}</p>
                            </div>
                            {appt.visitReason && (
                              <span className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-teal-tint/50 text-teal-dark border border-teal/10">
                                {appt.visitReason}
                              </span>
                            )}
                            {appt.message && (
                              <div className="mt-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl max-w-xs text-[10px] leading-relaxed">
                                <span className="font-bold block text-slate-700 mb-0.5">Note:</span>
                                {appt.message}
                              </div>
                            )}
                          </td>

                          {/* Date & Time */}
                          <td className="p-6">
                            <div className="space-y-1.5 font-medium text-slate-700">
                              <p className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-teal" /> {appt.date}</p>
                              <p className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-teal" /> {appt.time}</p>
                            </div>
                          </td>

                          {/* Doctor */}
                          <td className="p-6 font-semibold text-slate-700">
                            {appt.doctor ? (
                              <>
                                <p>{appt.doctor.name}</p>
                                <p className="text-[9px] text-teal-dark font-medium mt-0.5">{appt.doctor.specialization}</p>
                              </>
                            ) : (
                              "Doctor details missing"
                            )}
                          </td>

                          {/* Pediatric Module */}
                          <td className="p-6">
                            {appt.isChild ? (
                              <div className="bg-teal-tint/40 border border-teal/10 p-3 rounded-xl max-w-[200px]">
                                <p className="font-bold text-teal-dark text-[10px] uppercase flex items-center gap-1 mb-1">
                                  <Baby className="w-3.5 h-3.5 text-teal" />
                                  Child profile
                                </p>
                                <p className="text-slate-800 font-semibold">{appt.childName}</p>
                                <p className="text-[9px] text-slate-400 mt-0.5">DOB: {appt.childDob}</p>
                                {appt.vaccinationReminderEnabled && (
                                  <span className="mt-1.5 inline-block bg-teal-dark text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                                    Reminders Active
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400">Adult consult</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="p-6">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              appt.status === "Pending" ? "bg-amber-50 text-amber-600 border-amber-200" :
                              appt.status === "Confirmed" ? "bg-blue-50 text-blue-600 border-blue-200" :
                              appt.status === "Completed" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                              "bg-rose-50 text-rose-600 border-rose-200"
                            }`}>
                              {appt.status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="p-6 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {appt.status === "Pending" && (
                                <button
                                  onClick={() => handleUpdateStatus(appt._id, "Confirmed")}
                                  className="p-2 bg-teal/10 hover:bg-teal text-teal hover:text-white rounded-lg transition-all border border-teal/20 cursor-pointer"
                                  title="Confirm Appointment"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}

                              {appt.status === "Confirmed" && (
                                <button
                                  onClick={() => handleUpdateStatus(appt._id, "Completed")}
                                  className="p-2 bg-emerald-50 hover:bg-emerald-500 text-emerald-600 hover:text-white rounded-lg transition-all border border-emerald-200 cursor-pointer"
                                  title="Mark Completed"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}

                              {appt.status !== "Cancelled" && appt.status !== "Completed" && (
                                <button
                                  onClick={() => handleUpdateStatus(appt._id, "Cancelled")}
                                  className="p-2 bg-rose-50 hover:bg-rose-500 text-rose-500 hover:text-white rounded-lg transition-all border border-rose-200 cursor-pointer"
                                  title="Cancel Booking"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}

                              {/* Delete — only for finished records (Completed / Cancelled) */}
                              {(appt.status === "Completed" || appt.status === "Cancelled") && (
                                <button
                                  onClick={() => setConfirmDelete(appt)}
                                  className="p-2 bg-slate-100 hover:bg-slate-700 text-slate-500 hover:text-white rounded-lg transition-all border border-slate-200 cursor-pointer"
                                  title="Delete Permanently"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          onClick={() => !deleting && setConfirmDelete(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-heading font-bold text-lg text-slate-800">Delete appointment?</h3>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                  This permanently removes the <strong>{confirmDelete.status}</strong> appointment for{" "}
                  <strong className="text-slate-700">{confirmDelete.name}</strong> on{" "}
                  <strong className="text-slate-700">{confirmDelete.date}</strong>. This cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-60"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {deleting ? "Deleting..." : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk delete confirmation modal */}
      {confirmBulk && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          onClick={() => !bulkDeleting && setConfirmBulk(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-heading font-bold text-lg text-slate-800">
                  Delete {selectedIds.size} appointment{selectedIds.size > 1 ? "s" : ""}?
                </h3>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                  This permanently removes the selected <strong>Completed/Cancelled</strong>{" "}
                  appointment records. This cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                onClick={() => setConfirmBulk(false)}
                disabled={bulkDeleting}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-60"
              >
                {bulkDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {bulkDeleting ? "Deleting..." : `Delete ${selectedIds.size}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[110] animate-loader-fade-up">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border text-sm font-semibold ${
              toast.type === "success"
                ? "bg-white border-emerald-200 text-emerald-700"
                : "bg-white border-rose-200 text-rose-700"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-500" />
            )}
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  );
}
