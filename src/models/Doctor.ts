import mongoose, { Schema, model, models } from "mongoose";

const DoctorSchema = new Schema(
  {
    name: { type: String, required: true },
    qualification: { type: String, required: true },
    specialization: { type: String, required: true },
    experience: { type: Number, required: true },
    description: { type: String, required: true },
    consultingTime: { type: String, required: true },
    phone: { type: String, required: true },
    photo: { type: String, default: "" },
    facebook: { type: String, default: "" },
    instagram: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    availability: { type: String, enum: ["Available Today", "Fully Booked", "On Leave"], default: "Available Today" },
  },
  { timestamps: true }
);

DoctorSchema.index({ createdAt: -1 });

export default models.Doctor || model("Doctor", DoctorSchema);
