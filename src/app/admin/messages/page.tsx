"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Loader2,
  Trash2,
  Mail,
  Phone,
  Clock,
  Check,
  RotateCcw,
  Search,
  Reply,
  Archive,
  X,
  Send,
  MessageSquare,
  CornerDownRight,
} from "lucide-react";
import { useAdminFeedback } from "@/components/AdminFeedback";

const STATUS_FILTERS = ["All", "Unread", "Read", "Replied", "Archived"];
const DATE_FILTERS = ["All", "Today", "Last 7 Days", "Last 30 Days", "Custom Range"] as const;
type DateFilter = (typeof DATE_FILTERS)[number];

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
const dayOf = (iso: string) => {
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  return d;
};

const statusBadge = (status: string) => {
  switch (status) {
    case "Unread":
      return "bg-teal-tint text-teal-dark border-teal/20";
    case "Read":
      return "bg-slate-100 text-slate-500 border-slate-200";
    case "Replied":
      return "bg-emerald-50 text-emerald-600 border-emerald-200";
    case "Archived":
      return "bg-amber-50 text-amber-600 border-amber-200";
    default:
      return "bg-slate-100 text-slate-500 border-slate-200";
  }
};

export default function AdminMessagesPage() {
  const { confirm, notify } = useAdminFeedback();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState<DateFilter>("All");
  const [search, setSearch] = useState("");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const [selected, setSelected] = useState<any | null>(null); // detail modal
  const [replyOpen, setReplyOpen] = useState(false);
  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = () => {
    setLoading(true);
    fetch("/api/contact")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setMessages(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  // Update status on the server and patch local state (no full reload flicker).
  const updateStatus = async (id: string, status: string) => {
    // optimistic
    setMessages((prev) => prev.map((m) => (m._id === id ? { ...m, status } : m)));
    setSelected((s: any) => (s && s._id === id ? { ...s, status } : s));
    try {
      const res = await fetch("/api/contact", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
    } catch (err) {
      console.error(err);
      notify("error", "Could not update the message status.");
      fetchMessages(); // resync on failure
    }
  };

  const openDetail = (msg: any) => {
    setSelected(msg);
    // Status automation: opening an unread message marks it Read.
    if (msg.status === "Unread") updateStatus(msg._id, "Read");
  };

  const handleArchive = (id: string) => updateStatus(id, "Archived");

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "Delete message?",
      message: "This permanently removes the message and its reply history. This cannot be undone.",
      confirmText: "Delete",
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/contact?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete message");
      setMessages((prev) => prev.filter((m) => m._id !== id));
      if (selected?._id === id) setSelected(null);
      notify("success", "Message deleted.");
    } catch (err) {
      console.error(err);
      notify("error", "Could not delete the message.");
    }
  };

  const openReply = (msg: any) => {
    setSelected(msg);
    setReplySubject(`Re: ${msg.subject || "Your enquiry"}`);
    setReplyBody("");
    setReplyOpen(true);
  };

  const sendReply = async () => {
    if (!selected) return;
    if (!replyBody.trim()) {
      notify("error", "Please enter a reply message.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/contact/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selected._id,
          subject: replySubject,
          message: replyBody,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to send reply");

      // Server returns the updated message (with new reply + Replied status).
      const updated = data.message;
      if (updated) {
        setMessages((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));
        setSelected(updated);
      }
      setReplyOpen(false);
      setReplyBody("");
      notify("success", `Reply sent to ${selected.email}.`);
    } catch (err: any) {
      console.error(err);
      notify("error", err.message || "Reply failed to send.");
    } finally {
      setSending(false);
    }
  };

  // --- Filtering ---
  const matchesDate = (iso: string) => {
    if (dateFilter === "All") return true;
    const d = dayOf(iso);
    const today = startOfToday();
    switch (dateFilter) {
      case "Today":
        return d.getTime() === today.getTime();
      case "Last 7 Days":
        return d >= addDays(today, -7) && d <= today;
      case "Last 30 Days":
        return d >= addDays(today, -30) && d <= today;
      case "Custom Range": {
        const from = customFrom ? dayOf(customFrom) : null;
        const to = customTo ? dayOf(customTo) : null;
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
      }
      default:
        return true;
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return messages.filter((m) => {
      if (statusFilter !== "All" && m.status !== statusFilter) return false;
      if (!matchesDate(m.createdAt)) return false;
      if (!q) return true;
      return (
        m.name?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.subject?.toLowerCase().includes(q) ||
        m.message?.toLowerCase().includes(q)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, statusFilter, dateFilter, search, customFrom, customTo]);

  const unreadCount = useMemo(
    () => messages.filter((m) => m.status === "Unread").length,
    [messages]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-heading font-bold text-3xl text-slate-800">Contact Messages</h1>
          <p className="text-sm text-slate-500 mt-1">
            Review enquiries and reply directly — replies are emailed to the visitor.
          </p>
        </div>
        {unreadCount > 0 && (
          <span className="px-3 py-1.5 rounded-full bg-teal-tint text-teal-dark border border-teal/20 text-xs font-bold w-fit">
            {unreadCount} new
          </span>
        )}
      </div>

      {/* Toolbar: search + status + date filters */}
      <div className="space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, subject, or content..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal/40 transition-all"
            />
          </div>
          <div className="flex items-center gap-1.5 bg-slate-200/60 p-1.5 rounded-xl border border-slate-200 w-fit overflow-x-auto">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === s ? "bg-white text-teal shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {DATE_FILTERS.map((d) => (
            <button
              key={d}
              onClick={() => setDateFilter(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
                dateFilter === d
                  ? "bg-teal text-white border-teal shadow-sm"
                  : "bg-white text-slate-500 border-slate-200 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              {d}
            </button>
          ))}
          {dateFilter === "Custom Range" && (
            <div className="flex items-center gap-2 ml-1">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal/30"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal/30"
              />
            </div>
          )}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-teal" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-12 border border-slate-200 rounded-3xl text-center text-slate-400">
          No contact messages match the current filters.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((msg) => (
            <div
              key={msg._id}
              onClick={() => openDetail(msg)}
              className={`bg-white border rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row justify-between gap-4 transition-all duration-200 cursor-pointer hover:shadow-md ${
                msg.status === "Unread"
                  ? "border-l-4 border-l-teal border-slate-200"
                  : "border-slate-200/80"
              }`}
            >
              <div className="space-y-2.5 flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="font-heading font-bold text-base text-slate-800">{msg.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${statusBadge(msg.status)}`}>
                    {msg.status === "Unread" ? "New" : msg.status}
                  </span>
                  {msg.replies?.length > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                      <Reply className="w-3 h-3" /> {msg.replies.length}
                    </span>
                  )}
                </div>

                {msg.subject && (
                  <p className="text-sm font-semibold text-slate-700 truncate">{msg.subject}</p>
                )}

                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-400 font-medium">
                  <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {msg.email}</span>
                  <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {msg.phone}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(msg.createdAt).toLocaleString()}</span>
                </div>

                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed line-clamp-2 max-w-3xl">
                  {msg.message}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 md:self-start" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => openReply(msg)}
                  className="px-3 py-2 bg-teal text-white hover:bg-teal-dark rounded-lg transition-all cursor-pointer text-xs font-bold flex items-center gap-1.5"
                  title="Reply"
                >
                  <Reply className="w-4 h-4" /> Reply
                </button>
                <button
                  onClick={() => openDetail(msg)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-all border border-slate-200 cursor-pointer text-xs font-semibold"
                  title="View details"
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selected && !replyOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[88vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 p-6 border-b border-slate-100 sticky top-0 bg-white rounded-t-3xl">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="font-heading font-bold text-xl text-slate-800">{selected.name}</h2>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${statusBadge(selected.status)}`}>
                    {selected.status === "Unread" ? "New" : selected.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 font-medium mt-2">
                  <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {selected.email}</span>
                  <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {selected.phone}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(selected.createdAt).toLocaleString()}</span>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conversation thread */}
            <div className="p-6 space-y-4">
              {selected.subject && (
                <p className="text-sm font-bold text-slate-700">Subject: {selected.subject}</p>
              )}

              {/* Original user message */}
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center shrink-0 text-slate-500">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-sm p-4">
                  <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">{selected.name} · Visitor</p>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{selected.message}</p>
                </div>
              </div>

              {/* Admin replies */}
              {(selected.replies || []).map((r: any, i: number) => (
                <div key={i} className="flex gap-3 flex-row-reverse">
                  <div className="w-9 h-9 rounded-full bg-teal flex items-center justify-center shrink-0 text-white">
                    <CornerDownRight className="w-4 h-4" />
                  </div>
                  <div className="flex-1 bg-teal-tint/40 border border-teal/15 rounded-2xl rounded-tr-sm p-4">
                    <p className="text-[10px] font-bold uppercase text-teal-dark mb-1">
                      {r.repliedBy || "Admin"} · {r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}
                    </p>
                    {r.subject && <p className="text-xs font-semibold text-slate-600 mb-1">{r.subject}</p>}
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{r.message}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-end gap-2 p-6 border-t border-slate-100 sticky bottom-0 bg-white rounded-b-3xl">
              {selected.status === "Unread" ? (
                <button onClick={() => updateStatus(selected._id, "Read")} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-slate-200">
                  <Check className="w-4 h-4" /> Mark Read
                </button>
              ) : (
                <button onClick={() => updateStatus(selected._id, "Unread")} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-slate-200">
                  <RotateCcw className="w-4 h-4" /> Mark Unread
                </button>
              )}
              <button onClick={() => handleArchive(selected._id)} className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-amber-200">
                <Archive className="w-4 h-4" /> Archive
              </button>
              <button onClick={() => handleDelete(selected._id)} className="px-3 py-2 bg-rose-50 hover:bg-rose-500 text-rose-500 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-rose-200">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
              <button onClick={() => openReply(selected)} className="px-4 py-2 bg-teal text-white hover:bg-teal-dark rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                <Reply className="w-4 h-4" /> Reply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reply modal */}
      {selected && replyOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          onClick={() => !sending && setReplyOpen(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="font-heading font-bold text-xl text-slate-800 flex items-center gap-2">
                <Reply className="w-5 h-5 text-teal" /> Reply to {selected.name}
              </h2>
              <button onClick={() => !sending && setReplyOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Original message reference */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Original message</p>
                {selected.subject && <p className="text-xs font-semibold text-slate-600 mb-1">{selected.subject}</p>}
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 whitespace-pre-wrap">{selected.message}</p>
              </div>

              {/* Recipient (prefilled, read-only) */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">To</label>
                <input
                  type="email"
                  value={selected.email}
                  readOnly
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500 cursor-not-allowed"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Subject</label>
                <input
                  type="text"
                  value={replySubject}
                  onChange={(e) => setReplySubject(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal/40"
                />
              </div>

              {/* Message */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-600">Message</label>
                  <span className="text-[10px] text-slate-400 font-medium">{replyBody.length} characters</span>
                </div>
                <textarea
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  rows={7}
                  placeholder="Type your reply..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal/40 resize-y"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 p-6 border-t border-slate-100">
              <button
                onClick={() => setReplyOpen(false)}
                disabled={sending}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={sendReply}
                disabled={sending || !replyBody.trim()}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-teal hover:bg-teal-dark transition-all cursor-pointer flex items-center gap-2 disabled:opacity-60"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? "Sending..." : "Send Reply"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
