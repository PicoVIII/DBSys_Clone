import { NextResponse } from "next/server";
import type { ResultSetHeader } from "mysql2/promise";
import pool from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { reporter_user_id, reported_user_id, listg_id, reason, description } = await req.json();

    if (!reporter_user_id || !reason) {
      return NextResponse.json(
        { error: "reporter_user_id and reason are required" },
        { status: 400 }
      );
    }

    if (!reported_user_id && !listg_id) {
      return NextResponse.json(
        { error: "reported_user_id or listg_id is required" },
        { status: 400 }
      );
    }

    const date = new Date().toISOString().split("T")[0];

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO Report
      (reporter_user_id, reported_user_id, listg_id, rprt_reason, rprt_description, rprt_date, rprt_status)
      VALUES (?, ?, ?, ?, ?, ?, 'Pending')`,
      [reporter_user_id, reported_user_id ?? null, listg_id ?? null, reason, description ?? null, date]
    );

    return NextResponse.json({ message: "Report submitted", id: result.insertId });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong while submitting report" },
      { status: 500 }
    );
  }
}
