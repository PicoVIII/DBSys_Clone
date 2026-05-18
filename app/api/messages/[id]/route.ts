import { NextResponse, NextRequest } from "next/server";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import pool from "@/lib/db";
import { getToken } from "next-auth/jwt";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = Number((token as { id?: string }).id);
    const { id } = await params;

    const [conv] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM Conversation WHERE conv_id = ? AND (buyer_id = ? OR seller_id = ?) LIMIT 1`,
      [id, userId, userId]
    );
    if (conv.length === 0) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

    const [messages] = await pool.query<RowDataPacket[]>(
      `SELECT m.*, u.fname, u.lname FROM Message m
       JOIN User u ON u.user_id = m.sender_id
       WHERE m.conv_id = ?
       ORDER BY m.msg_created ASC, m.msg_id ASC`,
      [id]
    );

    if (userId !== Number(conv[0].buyer_id)) {
      await pool.execute(
        `UPDATE Message SET msg_read = NOW() WHERE conv_id = ? AND sender_id != ? AND msg_read IS NULL`,
        [id, userId]
      );
    }

    return NextResponse.json({ data: { conversation: conv[0], messages } });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = Number((token as { id?: string }).id);
    const { id } = await params;

    const { content } = await req.json();
    if (!content?.trim()) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    const [conv] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM Conversation WHERE conv_id = ? AND (buyer_id = ? OR seller_id = ?) LIMIT 1`,
      [id, userId, userId]
    );
    if (conv.length === 0) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO Message (conv_id, sender_id, msg_content, msg_created)
       VALUES (?, ?, ?, NOW())`,
      [id, userId, content.trim()]
    );

    return NextResponse.json({ message: "Sent", id: result.insertId });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
