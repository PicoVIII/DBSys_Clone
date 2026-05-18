import { NextResponse, NextRequest } from "next/server";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import pool from "@/lib/db";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || (token as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    let sql = `SELECT user_id, fname, lname, phone, email, role, is_banned FROM \`User\``;
    const params: string[] = [];
    if (q) {
      sql += " WHERE fname LIKE ? OR lname LIKE ? OR email LIKE ?";
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    sql += " ORDER BY user_id DESC";

    const [rows] = await pool.query<RowDataPacket[]>(sql, params);
    return NextResponse.json({ data: rows });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || (token as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { user_id, is_banned } = await req.json();
    if (!user_id) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    await pool.execute<ResultSetHeader>(
      "UPDATE `User` SET is_banned = ? WHERE user_id = ?",
      [is_banned ? 1 : 0, user_id]
    );

    return NextResponse.json({ message: is_banned ? "User banned" : "User unbanned" });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
