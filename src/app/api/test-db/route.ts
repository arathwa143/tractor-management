import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";

export async function GET() {
  try {
    await dbConnect();
    return NextResponse.json({ status: "success", message: "Connected to MongoDB successfully!" });
  } catch (error) {
    console.error("DB Connection Error:", error);
    return NextResponse.json({ status: "error", message: "Failed to connect to MongoDB" }, { status: 500 });
  }
}