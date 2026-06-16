import mongoose from "mongoose";
// Side-effect import: registers every schema on the mongoose singleton. A bare
// import is never tree-shaken, so connecting always guarantees all models
// (Doctor, Service, …) are registered before any query or .populate() runs —
// identically in dev, local prod, and Vercel serverless. See src/models/index.ts.
import "@/models";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  // No silent localhost fallback — fail loudly so a missing env var in
  // production surfaces immediately instead of hanging on a dead connection.
  throw new Error("Please define the MONGODB_URI environment variable in .env");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached!.promise = mongoose.connect(MONGODB_URI!, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}
