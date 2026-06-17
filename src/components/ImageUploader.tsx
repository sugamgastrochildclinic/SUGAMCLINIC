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

  // Resize an image File client-side to a max 800px JPEG blob. Keeps uploads
  // small (binary, not base64) so the direct-to-ImageKit upload is fast.
  const resizeToBlob = (file: File): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("read failed"));
      reader.onload = (event) => {
        const img = new Image();
        img.onerror = () => reject(new Error("decode failed"));
        img.onload = () => {
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

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          canvas.getContext("2d")?.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error("encode failed"))),
            "image/jpeg",
            0.82
          );
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      notify("error", "Please select an image file.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      notify("error", "Image is too large (max 15 MB).");
      return;
    }

    setLoading(true);
    try {
      const blob = await resizeToBlob(file);

      // Fetch short-lived upload credentials, then upload the binary blob
      // DIRECTLY to ImageKit — no relay through our serverless function. We
      // store the returned CDN URL (NOT base64) so next/image can serve
      // optimized, responsive AVIF/WebP from the edge.
      const authRes = await fetch("/api/imagekit/auth");
      const auth = await authRes.json();
      if (!authRes.ok || !auth.signature) {
        throw new Error(auth.error || "Could not authorize upload");
      }

      const form = new FormData();
      form.append("file", blob, file.name || "upload.jpg");
      form.append("fileName", file.name || "upload.jpg");
      form.append("publicKey", auth.publicKey);
      form.append("signature", auth.signature);
      form.append("expire", String(auth.expire));
      form.append("token", auth.token);
      form.append("folder", "/sugam-clinic");
      form.append("useUniqueFileName", "true");

      const upRes = await fetch(
        "https://upload.imagekit.io/api/v1/files/upload",
        { method: "POST", body: form }
      );
      const json = await upRes.json();
      if (!upRes.ok || !json.url) {
        throw new Error(json?.message || "Upload failed");
      }
      onChange(json.url);
    } catch (err) {
      console.error("Image upload failed:", err);
      notify("error", "Image upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
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
