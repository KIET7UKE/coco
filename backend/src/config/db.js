import mongoose from 'mongoose';

export async function connectDB() {
  const conn = await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  });
  console.log(`[MongoDB] Connected to host: ${conn.connection.host}, database: ${conn.connection.name}`);
  return conn;
}
