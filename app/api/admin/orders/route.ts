import { NextResponse, NextRequest } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || (token as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT o.*, u.fname AS buyer_fname, u.lname AS buyer_lname,
        l.listg_title, l.user_id AS seller_user_id,
        p.paymt_method, p.paymt_status, p.paymt_amount
      FROM OrderList o
      LEFT JOIN User u ON u.user_id = o.user_id
      LEFT JOIN OrderItem oi ON oi.order_id = o.order_id
      LEFT JOIN Listing l ON l.listg_id = oi.listg_id
      LEFT JOIN Payment p ON p.order_id = o.order_id
      ORDER BY o.order_date DESC, o.order_id DESC`
    );

    return NextResponse.json({ data: rows });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
