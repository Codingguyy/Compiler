import mongoose from "mongoose";

const MONGODB_URI = "mongodb+srv://Compiler:Compilercode@cluster0.bdcu7fw.mongodb.net/Compiler?retryWrites=true&w=majority&appName=Cluster0";

if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI");
}

/* ---------------- TYPES ---------------- */

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

/* ------------- GLOBAL DECL ------------- */

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

/* -------- ENSURE SINGLE INSTANCE -------- */

const cached: MongooseCache =
  global.mongoose ?? (global.mongoose = { conn: null, promise: null });

/* --------------- CONNECT --------------- */

export default async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
