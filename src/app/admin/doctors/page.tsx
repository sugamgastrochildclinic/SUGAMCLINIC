"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Loader2, Save, X, Phone, Clock, Shield } from "lucide-react";
import ImageUploader from "@/components/ImageUploader";
import { useAdminFeedback } from "@/components/AdminFeedback";

import { useAdminData } from "@/components/AdminDataProvider";

export default function AdminDoctorsPage() {
  const { confirm, notify } = useAdminFeedback();
  const { doctors: contextDoctors, loadingDoctors: contextLoading, fetchDoctors } = useAdminData();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    qualification: "",
    specialization: "",
    experience: 5,
    description: "",
    consultingTime: "",
    phone: "",
    photo: "",
    availability: "Available Today",
  });

  useEffect(() => {
    if (contextDoctors && contextDoctors.length > 0) {
      setDoctors(contextDoctors);
      setLoading(false);
    } else if (!contextLoading) {
      setDoctors([]);
      setLoading(false);
    }
  }, [contextDoctors, contextLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: name === "experience" ? parseInt(value) || 0 : value }));
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setFormData({
      name: "",
      qualification: "",
      specialization: "",
      experience: 5,
      description: "",
      consultingTime: "",
      phone: "",
      photo: "",
      availability: "Available Today",
    });
    setShowModal(true);
  };

  const handleOpenEdit = (doc: any) => {
    setEditId(doc._id);
    setFormData({
      name: doc.name,
      qualification: doc.qualification,
      specialization: doc.specialization,
      experience: doc.experience,
      description: doc.description,
      consultingTime: doc.consultingTime,
      phone: doc.phone,
      photo: doc.photo || "",
      availability: doc.availability || "Available Today",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const method = editId ? "PUT" : "POST";
      const payload = editId ? { ...formData, id: editId } : formData;

      const res = await fetch("/api/doctors", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save doctor");
      setShowModal(false);
      fetchDoctors();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "Delete doctor?",
      message: "This permanently removes the doctor profile. This cannot be undone.",
      confirmText: "Delete",
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/doctors?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete doctor");
      fetchDoctors();
      notify("success", "Doctor profile deleted.");
    } catch (err) {
      console.error(err);
      notify("error", "Could not delete the doctor.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-3xl text-slate-800">Doctors Management</h1>
          <p className="text-sm text-slate-500 mt-1">Add or update medical specialist profiles and consultation slots.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-teal hover:bg-teal-dark text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer text-sm"
        >
          <Plus className="w-5 h-5" />
          <span>Add Specialist</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-teal" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doc) => (
            <div key={doc._id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 bg-white ${
                    doc.availability === "Available Today" ? "text-emerald-600 border-emerald-200" :
                    doc.availability === "Fully Booked" ? "text-amber-600 border-amber-200" :
                    "text-rose-600 border-rose-200"
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      doc.availability === "Available Today" ? "bg-emerald-500" : doc.availability === "Fully Booked" ? "bg-amber-500" : "bg-rose-500"
                    }`} />
                    {doc.availability}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleOpenEdit(doc)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(doc._id)} className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="font-heading font-bold text-lg text-slate-800">{doc.name}</h3>
                <p className="text-xs text-teal-dark font-semibold mt-0.5">{doc.specialization}</p>
                <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase">{doc.qualification}</p>
                <p className="text-xs text-slate-500 mt-3 leading-relaxed line-clamp-3">{doc.description}</p>
              </div>

              <div className="border-t border-slate-100 pt-4 mt-5 space-y-2.5">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                  <Clock className="w-4 h-4 text-teal" />
                  <span>{doc.consultingTime}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                  <Phone className="w-4 h-4 text-teal" />
                  <span>{doc.phone}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-100">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-heading font-bold text-lg">{editId ? "Edit Specialist Info" : "Add Specialist Doctor"}</h3>
              <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Doctor Name</label>
                  <input
                    type="text"
                    required
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Dr. Karthik"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal text-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Qualifications</label>
                  <input
                    type="text"
                    required
                    name="qualification"
                    value={formData.qualification}
                    onChange={handleInputChange}
                    placeholder="e.g. MD (Peds), DCH"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal text-sm text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Specialization</label>
                  <input
                    type="text"
                    required
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    placeholder="e.g. Pediatric Gastroenterologist"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal text-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Experience (Years)</label>
                  <input
                    type="number"
                    required
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal text-sm text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Consulting Slot timings</label>
                  <input
                    type="text"
                    required
                    name="consultingTime"
                    value={formData.consultingTime}
                    onChange={handleInputChange}
                    placeholder="e.g. Mon - Sat: 10am - 1pm"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal text-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Availability Status</label>
                  <select
                    name="availability"
                    value={formData.availability}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal text-sm text-slate-800 bg-white"
                  >
                    <option value="Available Today">Available Today</option>
                    <option value="Fully Booked">Fully Booked</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Contact Phone</label>
                  <input
                    type="text"
                    required
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal text-sm text-slate-800"
                  />
                </div>
                <div>
                  <ImageUploader
                    value={formData.photo}
                    onChange={(val) => setFormData((prev) => ({ ...prev, photo: val }))}
                    label="Doctor Photo"
                    aspectRatio="square"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Doctor Bio / Description</label>
                <textarea
                  required
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal text-sm text-slate-800"
                />
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
                  <span>Save Specialist</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
