import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";

// Gets all orders made by one user.
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
        o.*,
        p.paymt_method,
        p.paymt_status,
        p.paymt_amount
      FROM OrderList o
      LEFT JOIN Payment p ON p.order_id = o.order_id
      WHERE o.user_id = ?
      ORDER BY o.order_date DESC, o.order_id DESC`,
      [id]
    );

    return NextResponse.json({ data: rows });
  } catch (err: unknown) {
    console.error(err);

    return NextResponse.json(
      { error: "Something went wrong while loading orders" },
      { status: 500 }
    );
  }
}
