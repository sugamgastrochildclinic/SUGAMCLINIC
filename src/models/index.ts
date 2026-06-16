// Central model registry.
//
// Importing this module forces every Mongoose schema to register on the shared
// mongoose singleton. `connectToDatabase()` imports it, so ANY code path that
// connects before querying is guaranteed to have all schemas registered.
//
// Why this exists: `.populate("doctor")` needs the "Doctor" model registered at
// populate time. Registration is a side effect of importing the model module.
// On Vercel each route is an isolated serverless lambda that only bundles what
// it imports — and a model imported but never *referenced* (e.g. only used via
// a populate path string) can be dropped by production dead-code elimination,
// causing `MissingSchemaError: Schema hasn't been registered for model "Doctor"`.
// Locally everything runs in one process where some other route already
// registered the model, which masked the bug. Centralising registration here
// removes the dependency on per-file import retention entirely.

import Doctor from "./Doctor";
import Service from "./Service";
import Review from "./Review";
import Gallery from "./Gallery";
import BlogPost from "./BlogPost";
import FAQ from "./FAQ";
import Appointment from "./Appointment";
import ContactMessage from "./ContactMessage";
import ClinicSettings from "./ClinicSettings";
import Patient from "./Patient";
import Counter from "./Counter";
import AdminUser from "./AdminUser";

export {
  Doctor,
  Service,
  Review,
  Gallery,
  BlogPost,
  FAQ,
  Appointment,
  ContactMessage,
  ClinicSettings,
  Patient,
  Counter,
  AdminUser,
};
