import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

export async function GET() {
  await dbConnect();
  
  // Security check: Only allow seeding if the database is completely empty
  const count = await User.countDocuments();
  if (count > 0) {
    return NextResponse.json(
      { message: "Users already exist. Seed aborted for security." },
      { status: 400 }
    );
  }

  // Hash the default password
  const hash = await bcrypt.hash("admin123", 10);
  
  // Create a dummy businessId for this MVP setup
  const businessId = new mongoose.Types.ObjectId();

  await User.create({
    name: "System Admin",
    phone: "9999999999", // Use your actual phone number here if you prefer
    passwordHash: hash,
    role: "admin",
    businessId,
    isActive: true,
  });

  return NextResponse.json({
    message: "Admin user created successfully!",
    credentials: {
      phone: "9999999999",
      password: "admin123"
    }
  });
}