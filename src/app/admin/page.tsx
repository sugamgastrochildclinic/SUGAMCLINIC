import React from "react";
import { unstable_cache } from "next/cache";
import { connectToDatabase } from "@/lib/db";
import Appointment from "@/models/Appointment";
import Review from "@/models/Review";
import ContactMessage from "@/models/ContactMessage";
import Doctor from "@/models/Doctor";
import Patient from "@/models/Patient";
import { CalendarDays, Star, MessageSquare, Clock, CheckCircle, Users, UserPlus, Repeat, Stethoscope } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

// Dashboard stats run 11 Atlas queries. Caching the result for 30s means
// repeat navigations to /admin return instantly instead of re-querying on
// every click. Admin mutations don't need this real-time; 30s staleness is
// fine for an overview screen. Returns fully-serialized plain data (no Mongoose
// docs / ObjectIds) so it's safe to cache and pass to the client.
const getDashboardData = unstable_cache(
  async () => {
    await connectToDatabase();

    const [
      totalAppts,
      pendingAppts,
      completedAppts,
      totalRevs,
      totalMsgs,
      totalPatientsRes,
      newPatientsRes,
      returningPatientsRes,
      recentApptsRes,
      recentMsgsRes,
      topReasonsRes,
    ] = await Promise.all([
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: "Pending" }),
      Appointment.countDocuments({ status: "Completed" }),
      Review.countDocuments(),
      ContactMessage.countDocuments({ status: "Unread" }),
      Patient.countDocuments(),
      Patient.countDocuments({ totalVisits: { $lte: 1 } }),
      Patient.countDocuments({ totalVisits: { $gte: 2 } }),
      Appointment.find().populate("doctor", "name").sort({ createdAt: -1 }).limit(5).lean(),
      ContactMessage.find().sort({ createdAt: -1 }).limit(5).lean(),
      // Top chief complaints. Ignores legacy rows with no visit reason.
      Appointment.aggregate([
        { $match: { visitReason: { $nin: [null, ""] } } },
        { $group: { _id: "$visitReason", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 },
      ]),
    ]);

    return {
      stats: {
        totalAppointments: totalAppts,
        pendingAppointments: pendingAppts,
        completedAppointments: completedAppts,
        totalReviews: totalRevs,
        totalMessages: totalMsgs,
        totalPatients: totalPatientsRes,
        newPatients: newPatientsRes,
        returningPatients: returningPatientsRes,
      },
      recentAppointments: (recentApptsRes as any[]).map((a) => ({
        _id: a._id?.toString() || "",
        patient: a.patient ? a.patient.toString() : null,
        name: a.name || "",
        phone: a.phone || "",
        date: a.date || "",
        time: a.time || "",
        doctorName: a.doctor?.name || null,
        visitReason: a.visitReason || "",
        status: a.status || "",
      })),
      recentMessages: (recentMsgsRes as any[]).map((m) => ({
        _id: m._id?.toString() || "",
        name: m.name || "",
        phone: m.phone || "",
        message: m.message || "",
        createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : "",
      })),
      topVisitReasons: (topReasonsRes as any[]).map((r) => ({
        reason: r._id,
        count: r.count,
      })),
    };
  },
  ["admin-dashboard-data"],
  { revalidate: 30, tags: ["admin-dashboard"] }
);

export default async function AdminDashboardPage() {
  let stats = {
    totalAppointments: 0,
    pendingAppointments: 0,
    completedAppointments: 0,
    totalReviews: 0,
    totalMessages: 0,
    totalPatients: 0,
    newPatients: 0,
    returningPatients: 0,
  };

  let recentAppointments: any[] = [];
  let recentMessages: any[] = [];
  let topVisitReasons: { reason: string; count: number }[] = [];

  try {
    const data = await getDashboardData();
    stats = data.stats;
    recentAppointments = data.recentAppointments;
    recentMessages = data.recentMessages;
    topVisitReasons = data.topVisitReasons;
  } catch (error) {
    console.error("Dashboard page data load error:", error);
  }

  const statCards = [
    { name: "Total Appointments", value: stats.totalAppointments, icon: CalendarDays, color: "text-blue-600 bg-blue-50", href: "/admin/appointments" },
    { name: "Pending Approval", value: stats.pendingAppointments, icon: Clock, color: "text-amber-600 bg-amber-50", href: "/admin/appointments?status=Pending" },
    { name: "Completed Visits", value: stats.completedAppointments, icon: CheckCircle, color: "text-emerald-600 bg-emerald-50", href: "/admin/appointments?status=Completed" },
    { name: "Unread Messages", value: stats.totalMessages, icon: MessageSquare, color: "text-indigo-600 bg-indigo-50", href: "/admin/messages" },
    { name: "Patient Reviews", value: stats.totalReviews, icon: Star, color: "text-pink-safe bg-pink/5", href: "/admin/reviews" },
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
            <Link
              key={idx}
              href={card.href}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-teal/40 hover:shadow-md transition-all"
            >
              <div className={`p-4 rounded-xl ${card.color} shrink-0`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{card.name}</p>
                <p className="font-heading font-bold text-2xl text-slate-800 mt-1">{card.value}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Patient Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { name: "Total Patients", value: stats.totalPatients, icon: Users, color: "text-teal bg-teal-tint/50" },
            { name: "New Patients", value: stats.newPatients, icon: UserPlus, color: "text-emerald-600 bg-emerald-50" },
            { name: "Returning Patients", value: stats.returningPatients, icon: Repeat, color: "text-blue-600 bg-blue-50" },
          ].map((card, idx) => {
            const Icon = card.icon;
            return (
              <Link
                key={idx}
                href="/admin/patients"
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-teal/40 transition-colors"
              >
                <div className={`p-4 rounded-xl ${card.color} shrink-0`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{card.name}</p>
                  <p className="font-heading font-bold text-2xl text-slate-800 mt-1">{card.value}</p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Top Visit Reasons */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="font-heading font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-teal" /> Top Visit Reasons
          </h2>
          {topVisitReasons.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No visit reasons recorded yet.</p>
          ) : (
            <div className="space-y-2.5">
              {topVisitReasons.map((r) => (
                <div key={r.reason} className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-slate-700 truncate">{r.reason}</span>
                  <span className="text-xs font-bold text-teal bg-teal-tint/50 px-2.5 py-0.5 rounded-full shrink-0">
                    {r.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
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
                  <th className="pb-3 font-semibold">Reason</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {recentAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-400">No appointments found.</td>
                  </tr>
                ) : (
                  recentAppointments.map((appt) => (
                    <tr key={appt._id}>
                      <td className="py-3.5 pr-2">
                        {appt.patient ? (
                          <Link href={`/admin/patients/${appt.patient}`} className="group">
                            <p className="font-bold text-slate-800 group-hover:text-teal group-hover:underline transition-colors">{appt.name}</p>
                            <p className="text-[10px] text-slate-400">{appt.phone}</p>
                          </Link>
                        ) : (
                          <Link href={`/admin/patients?q=${encodeURIComponent(appt.phone || appt.name || "")}`} className="group">
                            <p className="font-bold text-slate-800 group-hover:text-teal group-hover:underline transition-colors">{appt.name}</p>
                            <p className="text-[10px] text-slate-400">{appt.phone}</p>
                          </Link>
                        )}
                      </td>
                      <td className="py-3.5 pr-2">
                        <p className="font-semibold text-slate-700">{appt.date}</p>
                        <p className="text-[10px] text-slate-400">{appt.time}</p>
                      </td>
                      <td className="py-3.5 pr-2 font-medium text-slate-700">
                        {appt.doctorName || "N/A"}
                      </td>
                      <td className="py-3.5 pr-2">
                        {appt.visitReason ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-tint/50 text-teal-dark border border-teal/10">
                            {appt.visitReason}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
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
