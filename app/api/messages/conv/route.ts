import { NextResponse, NextRequest } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";
import { getToken } from "next-auth/jwt";

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = Number((token as { id?: string }).id);

    const { seller_id, listg_id } = await req.json();
    if (!seller_id) {
      return NextResponse.json({ error: "seller_id is required" }, { status: 400 });
    }
    if (userId === seller_id) {
      return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });
    }

    const [existing] = await pool.query<RowDataPacket[]>(
      `SELECT conv_id FROM Conversation
       WHERE ((buyer_id = ? AND seller_id = ?) OR (buyer_id = ? AND seller_id = ?))
       AND (? IS NULL OR listg_id = ?)`,
      [userId, seller_id, seller_id, userId, listg_id || null, listg_id || null]
    );

    if (existing.length > 0) {
      return NextResponse.json({ conv_id: existing[0].conv_id });
    }

    const now = new Date().toISOString().split("T")[0];
    const [result] = await pool.execute(
      `INSERT INTO Conversation (listg_id, buyer_id, seller_id, conv_created)
       VALUES (?, ?, ?, ?)`,
      [listg_id || null, userId, seller_id, now]
    );

    return NextResponse.json({ conv_id: (result as any).insertId });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
