import mongoose, { Schema } from "mongoose";

// A single admin reply in the conversation thread.
const ReplySchema = new Schema(
  {
    subject: { type: String, default: "" },
    message: { type: String, required: true },
    repliedBy: { type: String, default: "Admin" }, // admin email / name
  },
  { timestamps: true } // gives each reply its own createdAt
);

const ContactMessageSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    // Optional — older submissions and the current public form have no subject.
    subject: { type: String, default: "" },
    message: { type: String, required: true },
    // "Unread" is the initial/"New" state (kept for backward compatibility with
    // existing records). "Replied" added for the reply workflow.
    status: {
      type: String,
      enum: ["Unread", "Read", "Replied", "Archived"],
      default: "Unread",
    },
    // Thread of admin replies sent to the user.
    replies: { type: [ReplySchema], default: [] },
  },
  { timestamps: true }
);

ContactMessageSchema.index({ createdAt: -1 });
ContactMessageSchema.index({ status: 1 });

export default mongoose.models.ContactMessage || mongoose.model("ContactMessage", ContactMessageSchema);
