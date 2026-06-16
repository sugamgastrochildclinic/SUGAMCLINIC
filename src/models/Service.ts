import mongoose, { Schema } from "mongoose";

const ServiceSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, default: "Heart" }, // Lucide icon name
    image: { type: String, default: "" },
  },
  { timestamps: true }
);

ServiceSchema.index({ createdAt: -1 });

export default mongoose.models.Service || mongoose.model("Service", ServiceSchema);
