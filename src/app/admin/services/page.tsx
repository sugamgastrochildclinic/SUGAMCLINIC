"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Loader2, Save, X, Activity } from "lucide-react";
import ServiceIcon from "@/components/ServiceIcon";
import { useAdminFeedback } from "@/components/AdminFeedback";

export default function AdminServicesPage() {
  const { confirm, notify } = useAdminFeedback();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form / Modal state
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    icon: "Heart",
    image: "",
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = () => {
    setLoading(true);
    fetch("/api/services")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setServices(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setFormData({
      title: "",
      description: "",
      icon: "Heart",
      image: "",
    });
    setShowModal(true);
  };

  const handleOpenEdit = (service: any) => {
    setEditId(service._id);
    setFormData({
      title: service.title,
      description: service.description,
      icon: service.icon || "Heart",
      image: service.image || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const method = editId ? "PUT" : "POST";
      const payload = editId ? { ...formData, id: editId } : formData;

      const res = await fetch("/api/services", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save service");
      setShowModal(false);
      fetchServices();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "Delete service?",
      message: "This permanently removes the service. This cannot be undone.",
      confirmText: "Delete",
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/services?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete service");
      fetchServices();
      notify("success", "Service deleted.");
    } catch (err) {
      console.error(err);
      notify("error", "Could not delete the service.");
    }
  };

  // Helper to dynamically render icons by name
  const renderIcon = (name: string) => (
    <ServiceIcon name={name} className="w-6 h-6 text-teal" />
  );

  // Selectable popular Lucide icons
  const popularIcons = [
    "Heart", "Activity", "Baby", "ShieldAlert", "Syringe", "Apple", "Stethoscope", "Thermometer", "Sparkles", "Smile", "Biohazard", "ClipboardList"
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-3xl text-slate-800">Services Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage clinic departments, child care plans, and specialized diagnostics.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-teal hover:bg-teal-dark text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer text-sm"
        >
          <Plus className="w-5 h-5" />
          <span>Add Service</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-teal" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div key={service._id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300">
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-teal-tint flex items-center justify-center">
                    {renderIcon(service.icon)}
                  </div>

                  <div className="flex items-center gap-1">
                    <button onClick={() => handleOpenEdit(service)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(service._id)} className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="font-heading font-bold text-lg text-slate-800">{service.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-2.5">{service.description}</p>
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
              <h3 className="font-heading font-bold text-lg">{editId ? "Edit Service" : "Add Service Department"}</h3>
              <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Service Title</label>
                <input
                  type="text"
                  required
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Newborn Growth Monitoring"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal text-sm text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Icon Graphics</label>
                <select
                  name="icon"
                  value={formData.icon}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal text-sm text-slate-800 bg-white"
                >
                  {popularIcons.map((ic) => (
                    <option key={ic} value={ic}>{ic}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Description</label>
                <textarea
                  required
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Summarize treatment procedures..."
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
                  <span>Save Service</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
