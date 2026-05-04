import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await pool.query("SELECT 1 AS test");

    return NextResponse.json({
      message: "Database connected successfully",
      result: rows,
    });
  } catch (err) {
    console.error("DB ERROR:", err);

    return NextResponse.json(
      {
        message: "Database connection failed",
        error: String(err),
      },
      { status: 500 }
    );
  }
}