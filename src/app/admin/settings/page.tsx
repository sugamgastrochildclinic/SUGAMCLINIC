"use client";

import React, { useState, useEffect } from "react";
import { Save, Loader2, Settings, ShieldAlert, Globe, Info } from "lucide-react";
import ImageUploader from "@/components/ImageUploader";

import { useAdminData } from "@/components/AdminDataProvider";

export default function AdminSettingsPage() {
  const { settings: contextSettings, loadingSettings: contextLoading, fetchSettings } = useAdminData();
  const [settings, setSettings] = useState<any>({
    clinicName: "",
    tagline: "",
    logo: "",
    favicon: "",
    heroImage: "",
    address: "",
    phone: "",
    email: "",
    whatsapp: "",
    mapsUrl: "",
    workingHours: "",
    facebook: "",
    instagram: "",
    youtube: "",
    linkedin: "",
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
    aboutBadge: "",
    aboutTitle: "",
    aboutDesc1: "",
    aboutDesc2: "",
    aboutMission: "",
    aboutMissionDesc: "",
    aboutVision: "",
    aboutVisionDesc: "",
    aboutPremium: "",
    aboutPremiumDesc: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    if (contextSettings) {
      setSettings(contextSettings);
      setLoading(false);
    } else if (!contextLoading) {
      setLoading(false);
    }
  }, [contextSettings, contextLoading]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: "", type: "" });

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) throw new Error("Failed to update settings");
      const updated = await res.json();
      setSettings(updated);
      await fetchSettings();
      setMessage({ text: "Clinic settings updated successfully!", type: "success" });
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to save settings.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-teal" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="font-heading font-bold text-3xl text-slate-800">Clinic Profile & Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Configure profile, contact coordinates, hours, and SEO variables.</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl border text-sm ${
          message.type === "success" 
            ? "bg-emerald-50 border-emerald-100 text-emerald-700" 
            : "bg-rose-50 border-rose-100 text-rose-700"
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Core Profile */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="font-heading font-bold text-lg text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-4">
            <Settings className="w-5 h-5 text-teal" />
            <span>General Profile Settings</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-2">Clinic Name</label>
              <input
                type="text"
                name="clinicName"
                value={settings.clinicName || ""}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-teal text-sm text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-2">Tagline</label>
              <input
                type="text"
                name="tagline"
                value={settings.tagline || ""}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-teal text-sm text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <ImageUploader
                value={settings.logo || ""}
                onChange={(val) => setSettings((prev: any) => ({ ...prev, logo: val }))}
                label="Clinic Logo"
              />
            </div>
            <div>
              <ImageUploader
                value={settings.favicon || ""}
                onChange={(val) => setSettings((prev: any) => ({ ...prev, favicon: val }))}
                label="Clinic Favicon (Browser Tab Icon)"
                aspectRatio="square"
              />
            </div>
            <div>
              <ImageUploader
                value={settings.heroImage || ""}
                onChange={(val) => setSettings((prev: any) => ({ ...prev, heroImage: val }))}
                label="Hero Section Image"
              />
            </div>
          </div>
        </div>

        {/* Contact Coordinates */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="font-heading font-bold text-lg text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-4">
            <ShieldAlert className="w-5 h-5 text-teal" />
            <span>Contact Info & Channels</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-2">Phone</label>
              <input
                type="text"
                name="phone"
                value={settings.phone || ""}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-teal text-sm text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-2">WhatsApp Number</label>
              <input
                type="text"
                name="whatsapp"
                value={settings.whatsapp || ""}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-teal text-sm text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={settings.email || ""}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-teal text-sm text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-2">Working Hours Text</label>
              <input
                type="text"
                name="workingHours"
                value={settings.workingHours || ""}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-teal text-sm text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-2">Clinic Address</label>
            <textarea
              name="address"
              rows={3}
              value={settings.address || ""}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-teal text-sm text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-2">Google Maps Embed iframe URL</label>
            <input
              type="text"
              name="mapsUrl"
              value={settings.mapsUrl || ""}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-teal text-sm text-slate-800"
            />
          </div>
        </div>

        {/* SEO Management */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="font-heading font-bold text-lg text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-4">
            <Globe className="w-5 h-5 text-teal" />
            <span>SEO Metadata Config</span>
          </h2>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-2">Meta Title</label>
            <input
              type="text"
              name="seoTitle"
              value={settings.seoTitle || ""}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-teal text-sm text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-2">Meta Description</label>
            <textarea
              name="seoDescription"
              rows={3}
              value={settings.seoDescription || ""}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-teal text-sm text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-2">Keywords (Comma separated)</label>
            <input
              type="text"
              name="seoKeywords"
              value={settings.seoKeywords || ""}
              onChange={handleChange}
              placeholder="pediatrician, gastrologist, neonate care"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-teal text-sm text-slate-800"
            />
          </div>
        </div>

        {/* About Section */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="font-heading font-bold text-lg text-slate-800 flex items-center gap-2">
              <Info className="w-5 h-5 text-teal" />
              <span>About Section</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Shown on the homepage About block. Leave a field blank to use the built-in multi-language default;
              any value entered here overrides all languages.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-2">Badge Label</label>
              <input
                type="text"
                name="aboutBadge"
                value={settings.aboutBadge || ""}
                onChange={handleChange}
                placeholder="About Sugam Clinic"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-teal text-sm text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-2">Heading</label>
              <input
                type="text"
                name="aboutTitle"
                value={settings.aboutTitle || ""}
                onChange={handleChange}
                placeholder="Dedicated pediatric & gastro care under one roof"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-teal text-sm text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-2">Paragraph 1</label>
            <textarea
              name="aboutDesc1"
              rows={3}
              value={settings.aboutDesc1 || ""}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-teal text-sm text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-2">Paragraph 2</label>
            <textarea
              name="aboutDesc2"
              rows={3}
              value={settings.aboutDesc2 || ""}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-teal text-sm text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-2">Mission Title</label>
              <input
                type="text"
                name="aboutMission"
                value={settings.aboutMission || ""}
                onChange={handleChange}
                placeholder="Our Mission"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-teal text-sm text-slate-800"
              />
              <textarea
                name="aboutMissionDesc"
                rows={2}
                value={settings.aboutMissionDesc || ""}
                onChange={handleChange}
                placeholder="Mission description"
                className="mt-3 w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-teal text-sm text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-2">Vision Title</label>
              <input
                type="text"
                name="aboutVision"
                value={settings.aboutVision || ""}
                onChange={handleChange}
                placeholder="Our Vision"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-teal text-sm text-slate-800"
              />
              <textarea
                name="aboutVisionDesc"
                rows={2}
                value={settings.aboutVisionDesc || ""}
                onChange={handleChange}
                placeholder="Vision description"
                className="mt-3 w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-teal text-sm text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-2">Premium Standards Title</label>
            <input
              type="text"
              name="aboutPremium"
              value={settings.aboutPremium || ""}
              onChange={handleChange}
              placeholder="Premium Standards"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-teal text-sm text-slate-800"
            />
            <textarea
              name="aboutPremiumDesc"
              rows={2}
              value={settings.aboutPremiumDesc || ""}
              onChange={handleChange}
              placeholder="Premium standards description"
              className="mt-3 w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-teal text-sm text-slate-800"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-teal text-white hover:bg-teal-dark px-8 py-3.5 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          <span>Save Profile Settings</span>
        </button>

      </form>
    </div>
  );
}
