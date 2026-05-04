import { NextResponse } from "next/server";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import pool from "@/lib/db";

type FeedbackBody = {
  listg_id?: number;
  buyer_user_id?: number;
  seller_user_id?: number;
  comment?: string;
  type?: string;
};

// Gets all feedback records.
export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM Feedback ORDER BY fdbck_date DESC, fdbck_id DESC`
    );

    return NextResponse.json({ data: rows });
  } catch (err: unknown) {
    console.error(err);

    return NextResponse.json(
      { error: "Something went wrong while loading feedback" },
      { status: 500 }
    );
  }
}

// Adds feedback for a completed transaction.
export async function POST(req: Request) {
  try {
    const { listg_id, buyer_user_id, seller_user_id, comment, type } =
      (await req.json()) as FeedbackBody;

    if (!listg_id || !buyer_user_id || !seller_user_id || !comment || !type) {
      return NextResponse.json(
        { error: "listg_id, buyer_user_id, seller_user_id, comment, and type are required" },
        { status: 400 }
      );
    }

    const date = new Date().toISOString().split("T")[0];

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO Feedback
      (listg_id, buyer_user_id, seller_user_id, fdbck_comment, fdbck_type, fdbck_date)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [listg_id, buyer_user_id, seller_user_id, comment, type, date]
    );

    return NextResponse.json({ message: "Feedback added", id: result.insertId });
  } catch (err: unknown) {
    console.error(err);

    return NextResponse.json(
      { error: "Something went wrong while adding feedback" },
      { status: 500 }
    );
  }
}
