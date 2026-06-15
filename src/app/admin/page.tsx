import React from "react";
import { connectToDatabase } from "@/lib/db";
import Appointment from "@/models/Appointment";
import Review from "@/models/Review";
import ContactMessage from "@/models/ContactMessage";
import Doctor from "@/models/Doctor";
import { CalendarDays, Star, MessageSquare, Clock, CheckCircle } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  let stats = {
    totalAppointments: 0,
    pendingAppointments: 0,
    completedAppointments: 0,
    totalReviews: 0,
    totalMessages: 0,
  };

  let recentAppointments: any[] = [];
  let recentMessages: any[] = [];

  try {
    await connectToDatabase();

    const [
      totalAppts,
      pendingAppts,
      completedAppts,
      totalRevs,
      totalMsgs,
      recentApptsRes,
      recentMsgsRes,
    ] = await Promise.all([
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: "Pending" }),
      Appointment.countDocuments({ status: "Completed" }),
      Review.countDocuments(),
      ContactMessage.countDocuments({ status: "Unread" }),
      Appointment.find().populate("doctor", "name").sort({ createdAt: -1 }).limit(5).lean(),
      ContactMessage.find().sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    stats.totalAppointments = totalAppts;
    stats.pendingAppointments = pendingAppts;
    stats.completedAppointments = completedAppts;
    stats.totalReviews = totalRevs;
    stats.totalMessages = totalMsgs;
    recentAppointments = recentApptsRes;
    recentMessages = recentMsgsRes;

  } catch (error) {
    console.error("Dashboard page data load error:", error);
  }

  const statCards = [
    { name: "Total Appointments", value: stats.totalAppointments, icon: CalendarDays, color: "text-blue-600 bg-blue-50" },
    { name: "Pending Approval", value: stats.pendingAppointments, icon: Clock, color: "text-amber-600 bg-amber-50" },
    { name: "Completed Visits", value: stats.completedAppointments, icon: CheckCircle, color: "text-emerald-600 bg-emerald-50" },
    { name: "Unread Messages", value: stats.totalMessages, icon: MessageSquare, color: "text-indigo-600 bg-indigo-50" },
    { name: "Patient Reviews", value: stats.totalReviews, icon: Star, color: "text-pink-safe bg-pink/5" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading font-bold text-3xl text-slate-800">Overview Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Real-time statistics and patient booking trends.</p>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className={`p-4 rounded-xl ${card.color} shrink-0`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{card.name}</p>
                <p className="font-heading font-bold text-2xl text-slate-800 mt-1">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Appointments & Messages */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Recent Bookings */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading font-bold text-lg text-slate-800">Recent Appointments</h2>
            <Link href="/admin/appointments" className="text-xs font-semibold text-teal hover:underline">
              View All
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase">
                  <th className="pb-3 font-semibold">Patient</th>
                  <th className="pb-3 font-semibold">Date/Time</th>
                  <th className="pb-3 font-semibold">Doctor</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {recentAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-400">No appointments found.</td>
                  </tr>
                ) : (
                  recentAppointments.map((appt) => (
                    <tr key={appt._id}>
                      <td className="py-3.5 pr-2">
                        <p className="font-bold text-slate-800">{appt.name}</p>
                        <p className="text-[10px] text-slate-400">{appt.phone}</p>
                      </td>
                      <td className="py-3.5 pr-2">
                        <p className="font-semibold text-slate-700">{appt.date}</p>
                        <p className="text-[10px] text-slate-400">{appt.time}</p>
                      </td>
                      <td className="py-3.5 pr-2 font-medium text-slate-700">
                        {appt.doctor ? appt.doctor.name : "N/A"}
                      </td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          appt.status === "Pending" ? "bg-amber-50 text-amber-600 border-amber-200" :
                          appt.status === "Confirmed" ? "bg-blue-50 text-blue-600 border-blue-200" :
                          appt.status === "Completed" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                          "bg-rose-50 text-rose-600 border-rose-200"
                        }`}>
                          {appt.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Messages */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading font-bold text-lg text-slate-800">Recent Web Messages</h2>
            <Link href="/admin/messages" className="text-xs font-semibold text-teal hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-4">
            {recentMessages.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No messages received.</p>
            ) : (
              recentMessages.map((msg) => (
                <div key={msg._id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-slate-800">{msg.name}</p>
                    <span className="text-[9px] text-slate-400">{new Date(msg.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-[10px] text-slate-400">{msg.phone}</p>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">{msg.message}</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
