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

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT r.*,
        rep.fname AS reporter_fname, rep.lname AS reporter_lname,
        repd.fname AS reported_fname, repd.lname AS reported_lname,
        l.listg_title
      FROM Report r
      LEFT JOIN User rep ON rep.user_id = r.reporter_user_id
      LEFT JOIN User repd ON repd.user_id = r.reported_user_id
      LEFT JOIN Listing l ON l.listg_id = r.listg_id
      ORDER BY r.rprt_date DESC, r.rprt_id DESC`
    );

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

    const { rprt_id, rprt_status } = await req.json();
    if (!rprt_id || !rprt_status) {
      return NextResponse.json({ error: "rprt_id and rprt_status are required" }, { status: 400 });
    }

    await pool.execute<ResultSetHeader>(
      "UPDATE Report SET rprt_status = ? WHERE rprt_id = ?",
      [rprt_status, rprt_id]
    );

    return NextResponse.json({ message: "Report updated" });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
