import mongoose, { Schema } from "mongoose";

// Lightweight patient record. Created/updated as a SIDE EFFECT of booking — the
// public booking experience is unchanged; patients never interact with this
// collection directly.
//
// `phoneKey` is the digits-only normalisation of `phone` and is the real dedup
// key (a person typing "+91 98765 43210" then "9876543210" is one patient). It
// carries the unique index; `phone` stays human-readable for display.
const PatientSchema = new Schema(
  {
    // Auto-generated business id: PAT0001, PAT0002, ... (see lib/patients.ts).
    patientId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    // Normalised (digits-only) phone — the uniqueness / lookup key.
    phoneKey: { type: String, required: true, unique: true },
    email: { type: String, default: "" },
    dateOfBirth: { type: String, default: "" }, // optional, "YYYY-MM-DD"
    gender: { type: String, enum: ["Male", "Female", "Other", ""], default: "" },
    totalVisits: { type: Number, default: 0 },
    // Stored as a "YYYY-MM-DD" string to match Appointment.date (no TZ drift).
    lastVisitDate: { type: String, default: "" },
    // Denormalised copy of the most recent appointment's visit reason, written
    // at booking time. Lets the patient list/profile show the reason directly
    // off the patient record — no join, always real-time.
    lastVisitReason: { type: String, default: "" },
  },
  { timestamps: true }
);

PatientSchema.index({ updatedAt: -1 });

// See Appointment.ts: drop the cached model in dev so schema edits apply on hot
// reload without a full server restart.
if (process.env.NODE_ENV !== "production" && mongoose.models.Patient) {
  mongoose.deleteModel("Patient");
}

export default mongoose.models.Patient || mongoose.model("Patient", PatientSchema);
