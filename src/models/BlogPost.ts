import mongoose, { Schema, model, models } from "mongoose";

const BlogPostSchema = new Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    image: { type: String, default: "" },
    category: { type: String, default: "General Health" },
    author: { type: String, default: "Sugam Specialist" },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

BlogPostSchema.index({ createdAt: -1 });

export default models.BlogPost || model("BlogPost", BlogPostSchema);
