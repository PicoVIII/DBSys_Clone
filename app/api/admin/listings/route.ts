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
    let sql = `SELECT l.*, u.fname, u.lname, p.prdct_name, c.ctgry_name
      FROM Listing l
      LEFT JOIN User u ON u.user_id = l.user_id
      LEFT JOIN Product p ON p.prdct_id = l.prdct_id
      LEFT JOIN Category c ON c.ctgry_id = l.ctgry_id`;
    const params: string[] = [];
    if (q) {
      sql += " WHERE l.listg_title LIKE ? OR u.fname LIKE ? OR u.lname LIKE ?";
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    sql += " ORDER BY l.listg_id DESC";

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

    const { listg_id, listg_status } = await req.json();
    if (!listg_id || !listg_status) {
      return NextResponse.json({ error: "listg_id and listg_status are required" }, { status: 400 });
    }

    await pool.execute<ResultSetHeader>(
      "UPDATE Listing SET listg_status = ? WHERE listg_id = ?",
      [listg_status, listg_id]
    );

    return NextResponse.json({ message: "Listing updated" });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
