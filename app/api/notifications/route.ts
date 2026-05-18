import { NextResponse, NextRequest } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (token as { id?: string }).id;

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM Notification WHERE user_id = ? ORDER BY notif_created DESC, notif_id DESC LIMIT 50`,
      [userId]
    );

    const [[count]] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS unread FROM Notification WHERE user_id = ? AND notif_is_read = 0`,
      [userId]
    );

    return NextResponse.json({ data: rows, unread: Number(count.unread) });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (token as { id?: string }).id;

    const { notif_id } = await req.json();
    if (notif_id) {
      await (pool.execute as any)(
        `UPDATE Notification SET notif_is_read = 1 WHERE notif_id = ? AND user_id = ?`,
        [notif_id, userId]
      );
    } else {
      await (pool.execute as any)(
        `UPDATE Notification SET notif_is_read = 1 WHERE user_id = ? AND notif_is_read = 0`,
        [userId]
      );
    }

    return NextResponse.json({ message: "Notifications marked read" });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
