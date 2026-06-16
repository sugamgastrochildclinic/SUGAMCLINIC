import mongoose, { Schema } from "mongoose";

const AppointmentSchema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    message: { type: String, default: "" },
    status: { type: String, enum: ["Pending", "Confirmed", "Completed", "Cancelled"], default: "Pending" },

    // Patient tracking link. Set best-effort right after the appointment is
    // created (see the booking POST). Optional so legacy rows and any booking
    // where patient resolution failed remain valid.
    patient: { type: Schema.Types.ObjectId, ref: "Patient", default: null },

    // Chief complaint / visit reason tracking. `visitReason` is required for new
    // bookings (enforced here and in the booking validator); legacy rows created
    // before this feature simply have it empty and are never re-validated
    // (status updates use findByIdAndUpdate, which doesn't run schema validators).
    visitReason: { type: String, required: true },
    symptoms: { type: String, default: "" },
    additionalNotes: { type: String, default: "" },

    // Vaccination details (optional, client satisfaction premium feature)
    isChild: { type: Boolean, default: false },
    childName: { type: String, default: "" },
    childDob: { type: String, default: "" },
    vaccinationReminderEnabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

AppointmentSchema.index({ createdAt: -1 });
// `date` is stored as a sortable "YYYY-MM-DD" string, so this index backs
// the server-side date-range filtering on the admin appointments endpoint.
AppointmentSchema.index({ date: 1 });
AppointmentSchema.index({ status: 1 });
// Backs the double-booking conflict lookup (doctor + date + time + status).
AppointmentSchema.index({ doctor: 1, date: 1, time: 1 });
// Backs the per-patient appointment-history lookup on the patient detail page.
AppointmentSchema.index({ patient: 1, createdAt: -1 });

// In dev, Next keeps the Node process alive across edits and Mongoose caches the
// compiled model — so schema field additions are silently ignored until a full
// restart. Drop the cached model in non-production so edits take effect on hot
// reload. Production keeps the cached singleton (fresh per lambda anyway).
if (process.env.NODE_ENV !== "production" && mongoose.models.Appointment) {
  mongoose.deleteModel("Appointment");
}

export default mongoose.models.Appointment || mongoose.model("Appointment", AppointmentSchema);
