"use client";

import React, { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { useAdminFeedback } from "@/components/AdminFeedback";

interface ImageUploaderProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  aspectRatio?: "square" | "video" | "any";
}

export default function ImageUploader({
  value,
  onChange,
  label = "Upload Image",
  aspectRatio = "any",
}: ImageUploaderProps) {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { notify } = useAdminFeedback();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        // Canvas resizing to keep base64 strings compact and fast
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.82);

        // Upload to ImageKit and store the returned CDN URL (NOT base64), so
        // next/image can serve optimized, responsive AVIF/WebP from the edge.
        (async () => {
          try {
            const res = await fetch("/api/imagekit", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                file: dataUrl,
                fileName: file.name || "upload.jpg",
              }),
            });
            const json = await res.json();
            if (!res.ok || !json.url) {
              throw new Error(json.error || "Upload failed");
            }
            onChange(json.url);
          } catch (err) {
            console.error("Image upload failed:", err);
            notify("error", "Image upload failed. Please try again.");
          } finally {
            setLoading(false);
          }
        })();
      };
      img.onerror = () => {
        setLoading(false);
      };
    };
    reader.onerror = () => {
      setLoading(false);
    };
  };

  const clearImage = () => {
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2.5">
      {label && (
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          {label}
        </label>
      )}

      {value ? (
        <div className="relative border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 group max-w-xs shadow-sm">
          <div
            className={`relative w-full overflow-hidden flex items-center justify-center ${
              aspectRatio === "square"
                ? "aspect-square"
                : aspectRatio === "video"
                ? "aspect-video"
                : "min-h-[140px]"
            }`}
          >
            <img
              src={value}
              alt="Uploaded Preview"
              className="object-cover w-full h-full max-h-[200px]"
            />
          </div>
          
          <button
            type="button"
            onClick={clearImage}
            className="absolute top-2.5 right-2.5 bg-slate-900/80 hover:bg-rose-600 text-white p-1.5 rounded-full transition-colors duration-150 cursor-pointer shadow-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-200 hover:border-teal rounded-2xl p-6 text-center cursor-pointer hover:bg-slate-50/50 transition-all duration-200 flex flex-col items-center justify-center gap-2 group min-h-[140px]"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          {loading ? (
            <>
              <Loader2 className="w-8 h-8 text-teal animate-spin" />
              <p className="text-xs text-slate-500 font-semibold">Processing image...</p>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl bg-teal-tint text-teal flex items-center justify-center border border-teal/10 group-hover:scale-105 transition-transform duration-150">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Click to Upload Image
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  PNG, JPG, WEBP (Auto-optimized)
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
