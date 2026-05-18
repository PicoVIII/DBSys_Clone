import { NextResponse, NextRequest } from "next/server";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import pool from "@/lib/db";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (token as { id?: string }).id;

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT c.*,
        bu.fname AS buyer_fname, bu.lname AS buyer_lname,
        su.fname AS seller_fname, su.lname AS seller_lname,
        l.listg_title,
        (SELECT msg_content FROM Message WHERE conv_id = c.conv_id ORDER BY msg_created DESC LIMIT 1) AS last_message,
        (SELECT msg_created FROM Message WHERE conv_id = c.conv_id ORDER BY msg_created DESC LIMIT 1) AS last_date,
        (SELECT COUNT(*) FROM Message WHERE conv_id = c.conv_id AND sender_id != ? AND msg_read IS NULL) AS unread
      FROM Conversation c
      LEFT JOIN User bu ON bu.user_id = c.buyer_id
      LEFT JOIN User su ON su.user_id = c.seller_id
      LEFT JOIN Listing l ON l.listg_id = c.listg_id
      WHERE c.buyer_id = ? OR c.seller_id = ?
      ORDER BY last_date DESC`,
      [userId, userId, userId]
    );

    return NextResponse.json({ data: rows });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
