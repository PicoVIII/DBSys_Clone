import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";

// Gets all listings created by one user with thumbnails.
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT l.*, p.prdct_cond, c.ctgry_name,
        MIN(i.image_url) AS image_url,
        (SELECT COUNT(*) FROM Bid b WHERE b.listg_id = l.listg_id) AS bid_count
       FROM Listing l
       LEFT JOIN Product p ON p.prdct_id = l.prdct_id
       LEFT JOIN Category c ON c.ctgry_id = l.ctgry_id
       LEFT JOIN ListingImage i ON i.listg_id = l.listg_id
       WHERE l.user_id = ?
       GROUP BY l.listg_id, p.prdct_cond, c.ctgry_name
       ORDER BY l.listg_id DESC`,
      [id]
    );

    return NextResponse.json({ data: rows });
  } catch (err: unknown) {
    console.error(err);

    return NextResponse.json(
      { error: "Something went wrong while loading user listings" },
      { status: 500 }
    );
  }
}
