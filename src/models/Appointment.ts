import mongoose, { Schema, model, models } from "mongoose";

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

export default models.Appointment || model("Appointment", AppointmentSchema);
