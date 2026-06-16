import mongoose, { Schema } from "mongoose";

const GallerySchema = new Schema(
  {
    imageUrl: { type: String, required: true },
    category: { type: String, required: true, default: "gallery" }, // "gallery", "logo", "favicon", "doctors", "services", "about", "blog", "reviews"
    caption: { type: String, default: "" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

GallerySchema.index({ order: 1, createdAt: -1 });

export default mongoose.models.Gallery || mongoose.model("Gallery", GallerySchema);
