"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Loader2, Image as ImageIcon, Upload, Copy, Check, X } from "lucide-react";

import { useAdminData } from "@/components/AdminDataProvider";
import { useAdminFeedback } from "@/components/AdminFeedback";
import ImageUploader from "@/components/ImageUploader";

export default function AdminGalleryPage() {
  const { confirm, notify } = useAdminFeedback();
  const { gallery: contextGallery, loadingGallery: contextLoading, fetchGallery } = useAdminData();
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("gallery");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    if (contextGallery && contextGallery.length > 0) {
      setImages(contextGallery);
      setLoading(false);
    } else if (!contextLoading) {
      setImages([]);
      setLoading(false);
    }
  }, [contextGallery, contextLoading]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) return;

    setUploading(true);

    try {
      // Post ImageKit URL to gallery endpoint
      const res = await fetch("/api/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl,
          caption,
          category,
        }),
      });

      if (!res.ok) throw new Error("Upload failed");
      
      setCaption("");
      setImageUrl("");

      fetchGallery();
      setUploading(false);
    } catch (err) {
      console.error(err);
      notify("error", "Failed to save image to gallery.");
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "Delete image?",
      message: "This permanently removes the image from the gallery. This cannot be undone.",
      confirmText: "Delete",
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/gallery?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      fetchGallery();
      notify("success", "Image deleted from gallery.");
    } catch (err) {
      console.error(err);
      notify("error", "Could not delete the image.");
    }
  };

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading font-bold text-3xl text-slate-800">Media Library & Gallery</h1>
        <p className="text-sm text-slate-500 mt-1">Upload images to serve as logos, favicon icons, doctor photos, or facility pictures.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Upload form */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="font-heading font-bold text-lg text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Upload className="w-5 h-5 text-teal" />
            <span>Upload New Image</span>
          </h2>

          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <ImageUploader
                value={imageUrl}
                onChange={setImageUrl}
                label="Select Image File"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Caption</label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="e.g. Consulting Room"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal text-sm text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal text-sm text-slate-800 bg-white"
              >
                <option value="gallery">Clinic Gallery Photo</option>
                <option value="logo">Clinic Logo</option>
                <option value="favicon">Favicon / Browser Icon</option>
                <option value="doctors">Doctor Photo</option>
                <option value="services">Service Illustration</option>
                <option value="reviews">Reviewer Photo</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={uploading || !imageUrl}
              className="w-full bg-teal hover:bg-teal-dark text-white py-3 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Uploading image...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Upload Media</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Media Grid */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="font-heading font-bold text-lg text-slate-800 border-b border-slate-100 pb-3 mb-6 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-teal" />
            <span>Uploaded Media Files</span>
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-teal" />
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No media files uploaded yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {images.map((img) => (
                <div key={img._id} className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm relative group bg-slate-50">
                  <div className="relative aspect-square w-full">
                    <img
                      src={img.imageUrl}
                      alt={img.caption || "Media"}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  
                  {/* Category Indicator */}
                  <span className="absolute top-2 left-2 bg-slate-900/80 text-white text-[8px] font-bold px-2 py-0.5 rounded border border-white/10 uppercase">
                    {img.category}
                  </span>

                  {/* Actions overlay */}
                  <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 gap-2">
                    {img.caption && (
                      <p className="text-[10px] text-white font-semibold truncate mb-1">{img.caption}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopy(img.imageUrl, img._id)}
                        className="flex-1 bg-white hover:bg-slate-100 text-slate-800 text-[10px] font-bold py-1.5 px-2 rounded flex items-center justify-center gap-1 cursor-pointer"
                      >
                        {copiedId === img._id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedId === img._id ? "Copied" : "Copy URL"}</span>
                      </button>
                      <button
                        onClick={() => handleDelete(img._id)}
                        className="bg-rose-600 hover:bg-rose-700 text-white p-1.5 rounded cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
