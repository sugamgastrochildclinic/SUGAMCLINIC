"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Loader2, Save, X, Star, Check, AlertCircle } from "lucide-react";
import { useAdminFeedback } from "@/components/AdminFeedback";

export default function AdminReviewsPage() {
  const { confirm, notify } = useAdminFeedback();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form / Modal state
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    rating: 5,
    reviewText: "",
    photo: "",
    approved: true,
  });

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = () => {
    setLoading(true);
    fetch("/api/reviews")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setReviews(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as any).checked : (name === "rating" ? parseInt(value) || 5 : value)
    }));
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setFormData({
      name: "",
      rating: 5,
      reviewText: "",
      photo: "",
      approved: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (rev: any) => {
    setEditId(rev._id);
    setFormData({
      name: rev.name,
      rating: rev.rating || 5,
      reviewText: rev.reviewText,
      photo: rev.photo || "",
      approved: rev.approved !== undefined ? rev.approved : true,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const method = editId ? "PUT" : "POST";
      const payload = editId ? { ...formData, id: editId } : formData;

      const res = await fetch("/api/reviews", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save review");
      setShowModal(false);
      fetchReviews();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleApprove = async (rev: any) => {
    try {
      const res = await fetch("/api/reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: rev._id,
          approved: !rev.approved,
        }),
      });

      if (!res.ok) throw new Error("Failed to update approval status");
      fetchReviews();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "Delete review?",
      message: "This permanently removes the patient review. This cannot be undone.",
      confirmText: "Delete",
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/reviews?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete review");
      fetchReviews();
      notify("success", "Patient review deleted.");
    } catch (err) {
      console.error(err);
      notify("error", "Could not delete the review.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-3xl text-slate-800">Patient Reviews</h1>
          <p className="text-sm text-slate-500 mt-1">Manage parent testimonials, feedback ratings, and review display approvals.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-teal hover:bg-teal-dark text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer text-sm"
        >
          <Plus className="w-5 h-5" />
          <span>Add Testimonial</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-teal" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white p-12 border border-slate-200 rounded-3xl text-center text-slate-400">
          No patient reviews published yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map((rev) => (
            <div key={rev._id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  {/* Rating Stars */}
                  <div className="flex items-center gap-0.5">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleOpenEdit(rev)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(rev._id)} className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="font-heading font-bold text-base text-slate-800">{rev.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Verified Clinic Testimonial</p>
                <p className="text-xs text-slate-500 leading-relaxed mt-4 italic">"{rev.reviewText}"</p>
              </div>

              {/* Approval Row */}
              <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-100">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase flex items-center gap-1 ${
                  rev.approved 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}>
                  {rev.approved ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Approved</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3" />
                      <span>Pending</span>
                    </>
                  )}
                </span>
                
                <button
                  onClick={() => handleToggleApprove(rev)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                    rev.approved
                      ? "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      : "bg-teal-tint text-teal border-teal/20 hover:bg-teal/20"
                  }`}
                >
                  {rev.approved ? "Hide from Site" : "Approve & Show"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-heading font-bold text-lg">{editId ? "Edit Review" : "Add Patient Review"}</h3>
              <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Reviewer Name</label>
                <input
                  type="text"
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal text-sm text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Rating (1 to 5 Stars)</label>
                <select
                  name="rating"
                  value={formData.rating}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal text-sm text-slate-800 bg-white"
                >
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Review Details</label>
                <textarea
                  required
                  name="reviewText"
                  rows={4}
                  value={formData.reviewText}
                  onChange={handleInputChange}
                  placeholder="Paste patient feedback here..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal text-sm text-slate-800"
                />
              </div>

              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="approved"
                  name="approved"
                  checked={formData.approved}
                  onChange={handleInputChange}
                  className="rounded border-slate-300 text-teal focus:ring-teal h-4 w-4"
                />
                <label htmlFor="approved" className="text-xs font-bold text-slate-700 select-none cursor-pointer">
                  Approve & Display immediately on home page
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-teal hover:bg-teal-dark text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer text-sm"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Review</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
