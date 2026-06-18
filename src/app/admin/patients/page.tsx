"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, Phone, Users, Stethoscope, RefreshCw, CheckCircle2, XCircle, UserPlus, X } from "lucide-react";
import { classifyPatient } from "@/lib/visitReasons";

type Patient = {
  _id: string;
  patientId: string;
  name: string;
  phone: string;
  email?: string;
  totalVisits: number;
  lastVisitDate?: string;
  latestVisitReason?: string;
};

type Toast = { type: "success" | "error"; msg: string } | null;

export default function AdminPatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [migrating, setMigrating] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  // Manual "Add Patient" modal.
  const emptyForm = { name: "", phone: "", email: "", dateOfBirth: "", gender: "", lastVisitDate: "", lastVisitReason: "" };
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPatients();
    // Prefill search from a ?q= deep link (dashboard recent-appointments fallback).
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setSearch(q);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(t);
  }, [toast]);

  const fetchPatients = () => {
    setLoading(true);
    fetch("/api/patients", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setPatients(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  // Backfill patient records from existing appointments. Idempotent + safe to
  // re-run (see /api/admin/migrate-patients).
  const runMigration = async () => {
    setMigrating(true);
    try {
      const res = await fetch("/api/admin/migrate-patients", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Migration failed");
      setToast({
        type: "success",
        msg: `Migration done — ${data.patientsCreated} created, ${data.appointmentsLinked} linked.`,
      });
      fetchPatients();
    } catch (err: any) {
      setToast({ type: "error", msg: err.message || "Migration failed." });
    } finally {
      setMigrating(false);
    }
  };

  const addPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Could not add patient.");
      setToast({ type: "success", msg: `Patient added — ${data.patient.patientId}.` });
      setShowAdd(false);
      setForm(emptyForm);
      fetchPatients();
    } catch (err: any) {
      setToast({ type: "error", msg: err.message || "Could not add patient." });
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.phone?.toLowerCase().includes(q) ||
        p.patientId?.toLowerCase().includes(q) ||
        p.latestVisitReason?.toLowerCase().includes(q)
    );
  }, [patients, search]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-3xl text-slate-800">Patients</h1>
          <p className="text-sm text-slate-500 mt-1">
            {patients.length} patient{patients.length === 1 ? "" : "s"} tracked across all bookings.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => { setForm(emptyForm); setShowAdd(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-teal hover:bg-teal-dark transition-all cursor-pointer shadow-sm w-fit"
          >
            <UserPlus className="w-4 h-4" />
            Add Patient
          </button>
          <button
            onClick={runMigration}
            disabled={migrating}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer shadow-sm w-fit disabled:opacity-60"
            title="Create patient records from existing appointments (safe to re-run)"
          >
            {migrating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {migrating ? "Migrating..." : "Backfill from appointments"}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-xl">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone, patient ID, or visit reason..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal/40 transition-all"
        />
      </div>

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
                  <th className="p-6 font-semibold">Patient ID</th>
                  <th className="p-6 font-semibold">Name</th>
                  <th className="p-6 font-semibold">Phone</th>
                  <th className="p-6 font-semibold">Total Visits</th>
                  <th className="p-6 font-semibold">Last Visit</th>
                  <th className="p-6 font-semibold">Latest Visit Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-400 text-sm">
                      <Users className="w-8 h-8 mx-auto mb-3 text-slate-300" />
                      {patients.length === 0
                        ? "No patients yet. New bookings create patient records automatically — or backfill from existing appointments above."
                        : "No patients match your search."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => {
                    const tier = classifyPatient(p.totalVisits);
                    return (
                      <tr
                        key={p._id}
                        onClick={() => router.push(`/admin/patients/${p._id}`)}
                        className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                      >
                        <td className="p-6">
                          <span className="font-mono font-bold text-teal">{p.patientId}</span>
                        </td>
                        <td className="p-6">
                          <span className="font-heading font-bold text-sm text-slate-800 hover:text-teal">
                            {p.name}
                          </span>
                          <span className={`ml-2 inline-block px-2 py-0.5 rounded-full text-[9px] font-bold border ${tier.badgeClass}`}>
                            {tier.label}
                          </span>
                        </td>
                        <td className="p-6">
                          <span className="flex items-center gap-1 text-slate-500"><Phone className="w-3.5 h-3.5" /> {p.phone}</span>
                        </td>
                        <td className="p-6 font-bold text-slate-800">{p.totalVisits}</td>
                        <td className="p-6 text-slate-500">{p.lastVisitDate || "—"}</td>
                        <td className="p-6">
                          {p.latestVisitReason ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-tint/50 text-teal-dark border border-teal/10">
                              <Stethoscope className="w-3 h-3" /> {p.latestVisitReason}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Patient modal */}
      {showAdd && (
        <div
          className="fixed inset-0 z-[120] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !saving && setShowAdd(false)}
        >
          <form
            onSubmit={addPatient}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 sm:p-8 relative border border-slate-200 shadow-xl"
          >
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              aria-label="Close"
              className="absolute top-5 right-5 p-2 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-500 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="font-heading font-bold text-2xl text-slate-800 mb-1">Add Patient</h2>
            <p className="text-xs text-slate-500 mb-6">Record a walk-in or phone booking manually.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Name <span className="text-rose-500">*</span></label>
                <input
                  type="text" required value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal/40"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Phone <span className="text-rose-500">*</span></label>
                <input
                  type="tel" required value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal/40"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Email</label>
                <input
                  type="email" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal/40"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Date of Birth</label>
                  <input
                    type="date" value={form.dateOfBirth}
                    onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Gender</label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal/40"
                  >
                    <option value="">—</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Last Visit Date</label>
                  <input
                    type="date" value={form.lastVisitDate}
                    onChange={(e) => setForm({ ...form, lastVisitDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Visit Reason</label>
                  <input
                    type="text" value={form.lastVisitReason}
                    onChange={(e) => setForm({ ...form, lastVisitReason: e.target.value })}
                    placeholder="e.g. Vaccination"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal/40"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-8">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-teal hover:bg-teal-dark transition-all cursor-pointer shadow-sm disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                {saving ? "Saving..." : "Add Patient"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Toast */}
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
