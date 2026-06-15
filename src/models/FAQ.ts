import mongoose, { Schema, model, models } from "mongoose";

const FAQSchema = new Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { timestamps: true }
);

FAQSchema.index({ createdAt: -1 });

export default models.FAQ || model("FAQ", FAQSchema);
