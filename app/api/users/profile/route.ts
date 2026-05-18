import { NextResponse, NextRequest } from "next/server";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import pool from "@/lib/db";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT user_id, fname, lname, phone, email, profile_picture FROM `User` WHERE user_id = ? LIMIT 1",
      [(token as { id?: string }).id]
    );
    if (rows.length === 0) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ data: rows[0] });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { fname, lname, phone, profile_picture } = await req.json();
    const updates: string[] = [];
    const params: (string | number)[] = [];

    if (fname) { updates.push("fname = ?"); params.push(fname); }
    if (lname) { updates.push("lname = ?"); params.push(lname); }
    if (phone) { updates.push("phone = ?"); params.push(phone); }
    if (profile_picture !== undefined) { updates.push("profile_picture = ?"); params.push(profile_picture || null); }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    params.push(Number((token as { id?: string }).id));
    await pool.execute<ResultSetHeader>(
      `UPDATE \`User\` SET ${updates.join(", ")} WHERE user_id = ?`,
      params
    );

    return NextResponse.json({ message: "Profile updated" });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
