/**
 * Database Configuration & Connection
 * MongoDB + Mongoose setup for POLSIM
 */

import mongoose from "mongoose";

export async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost/polsim";
    
    await mongoose.connect(mongoUri);

    console.log("✅ MongoDB connected successfully");
    return mongoose.connection;
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
}

export function disconnectDB() {
  return mongoose.disconnect();
}

export default mongoose;
