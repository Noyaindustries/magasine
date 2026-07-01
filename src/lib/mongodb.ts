import mongoose from "mongoose";

function getMongoUri(): string {
  return (process.env.MONGODB_URI ?? "").trim().replace(/\/([^/?]+)\s+(\?)/, "/$1$2");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectDB() {
  const mongoUri = getMongoUri();

  if (!mongoUri) {
    throw new Error("Please set MONGODB_URI in .env.local");
  }

  if (
    !mongoUri.startsWith("mongodb://") &&
    !mongoUri.startsWith("mongodb+srv://")
  ) {
    throw new Error(
      "MONGODB_URI must start with mongodb:// or mongodb+srv:// — check .env.local (no quotes, no comment on the same line)."
    );
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(mongoUri, {
      bufferCommands: false,
    }).catch((error) => {
      cached.promise = null;
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.conn = null;
    throw error;
  }

  return cached.conn;
}
