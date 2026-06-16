"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  ArrowLeft,
  Phone,
  Mail,
  Cake,
  User,
  CalendarDays,
  Activity,
  Stethoscope,
  Clock,
} from "lucide-react";
import { classifyPatient } from "@/lib/visitReasons";

type Patient = {
  _id: string;
  patientId: string;
  name: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  gender?: string;
  totalVisits: number;
  lastVisitDate?: string;
  lastVisitReason?: string;
};

type Appt = {
  _id: string;
  date: string;
  time: string;
  doctor?: { name: string; specialization?: string } | null;
  visitReason?: string;
  status: string;
};

const statusClass = (status: string) =>
  status === "Pending"
    ? "bg-amber-50 text-amber-600 border-amber-200"
    : status === "Confirmed"
    ? "bg-blue-50 text-blue-600 border-blue-200"
    : status === "Completed"
    ? "bg-emerald-50 text-emerald-600 border-emerald-200"
    : "bg-rose-50 text-rose-600 border-rose-200";

export default function PatientDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appt[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/patients/${id}`, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) {
          setNotFound(true);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.patient) {
          setPatient(data.patient);
          setAppointments(Array.isArray(data.appointments) ? data.appointments : []);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-teal" />
      </div>
    );
  }

  if (notFound || !patient) {
    return (
      <div className="space-y-6">
        <Link href="/admin/patients" className="inline-flex items-center gap-2 text-sm font-semibold text-teal hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to patients
        </Link>
        <p className="text-slate-500">Patient not found.</p>
      </div>
    );
  }

  const tier = classifyPatient(patient.totalVisits);
  const latestVisitReason = patient.lastVisitReason || appointments[0]?.visitReason || "—";

  return (
    <div className="space-y-8">
      <Link href="/admin/patients" className="inline-flex items-center gap-2 text-sm font-semibold text-teal hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to patients
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-heading font-bold text-3xl text-slate-800">{patient.name}</h1>
        <span className="font-mono text-sm font-bold text-teal bg-teal-tint/50 px-2.5 py-1 rounded-lg">{patient.patientId}</span>
        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${tier.badgeClass}`}>
          {tier.label}
        </span>
      </div>

      {/* Patient Information */}
      <section className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
        <h2 className="font-heading font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-teal" /> Patient Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <Info label="Patient ID" value={patient.patientId} icon={<User className="w-4 h-4 text-teal" />} />
          <Info label="Phone" value={patient.phone} icon={<Phone className="w-4 h-4 text-teal" />} />
          <Info label="Email" value={patient.email || "—"} icon={<Mail className="w-4 h-4 text-teal" />} />
          <Info label="Date of Birth" value={patient.dateOfBirth || "—"} icon={<Cake className="w-4 h-4 text-teal" />} />
          <Info label="Gender" value={patient.gender || "—"} icon={<User className="w-4 h-4 text-teal" />} />
        </div>
      </section>

      {/* Visit Summary */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard label="Total Visits" value={String(patient.totalVisits)} icon={Activity} color="text-blue-600 bg-blue-50" />
        <SummaryCard label="Last Visit Date" value={patient.lastVisitDate || "—"} icon={CalendarDays} color="text-emerald-600 bg-emerald-50" />
        <SummaryCard label="Latest Visit Reason" value={latestVisitReason} icon={Stethoscope} color="text-pink-safe bg-pink/5" />
      </section>

      {/* Appointment History */}
      <section className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="font-heading font-bold text-lg text-slate-800 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-teal" /> Appointment History
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase">
                <th className="p-5 font-semibold">Date</th>
                <th className="p-5 font-semibold">Time</th>
                <th className="p-5 font-semibold">Doctor</th>
                <th className="p-5 font-semibold">Visit Reason</th>
                <th className="p-5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-slate-400 text-sm">No appointments on record.</td>
                </tr>
              ) : (
                appointments.map((a) => (
                  <tr key={a._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-5 font-semibold text-slate-700">{a.date}</td>
                    <td className="p-5">
                      <span className="flex items-center gap-1 text-slate-500"><Clock className="w-3.5 h-3.5" /> {a.time}</span>
                    </td>
                    <td className="p-5 text-slate-700">{a.doctor ? a.doctor.name : "—"}</td>
                    <td className="p-5">{a.visitReason || "—"}</td>
                    <td className="p-5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusClass(a.status)}`}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Info({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="font-semibold text-slate-700">{value}</p>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
      <div className={`p-4 rounded-xl ${color} shrink-0`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="font-heading font-bold text-xl text-slate-800 mt-1 truncate">{value}</p>
      </div>
    </div>
  );
}
