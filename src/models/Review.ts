import mongoose, { Schema, model, models } from "mongoose";

const ReviewSchema = new Schema(
  {
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5, default: 5 },
    photo: { type: String, default: "" },
    reviewText: { type: String, required: true },
    approved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ReviewSchema.index({ approved: 1, createdAt: -1 });

export default models.Review || model("Review", ReviewSchema);
