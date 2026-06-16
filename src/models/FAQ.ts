import mongoose, { Schema } from "mongoose";

const FAQSchema = new Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { timestamps: true }
);

FAQSchema.index({ createdAt: -1 });

export default mongoose.models.FAQ || mongoose.model("FAQ", FAQSchema);
