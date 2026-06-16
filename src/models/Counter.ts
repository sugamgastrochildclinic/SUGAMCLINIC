import mongoose, { Schema } from "mongoose";

// Atomic, monotonically-increasing sequence generator. One document per named
// counter (e.g. `_id: "patientId"`). Used to mint human-friendly, gap-tolerant
// ids like PAT0001 without a race even under concurrent serverless bookings —
// `$inc` is applied server-side by MongoDB, so two simultaneous callers always
// receive distinct values.
const CounterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

if (process.env.NODE_ENV !== "production" && mongoose.models.Counter) {
  mongoose.deleteModel("Counter");
}

export default mongoose.models.Counter || mongoose.model("Counter", CounterSchema);
