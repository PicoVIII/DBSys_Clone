import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [[stats]] = await pool.query<RowDataPacket[]>(
      `SELECT
        COUNT(*) AS total,
        SUM(fdbck_type = 'Positive') AS positive,
        SUM(fdbck_type = 'Neutral') AS neutral,
        SUM(fdbck_type = 'Negative') AS negative
      FROM Feedback WHERE seller_user_id = ?`,
      [id]
    );

    const total = Number(stats?.total ?? 0);
    const positive = Number(stats?.positive ?? 0);
    const score = total > 0 ? Math.round((positive / total) * 100) : 0;

    return NextResponse.json({
      data: {
        total,
        positive,
        neutral: Number(stats?.neutral ?? 0),
        negative: Number(stats?.negative ?? 0),
        score,
      },
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
