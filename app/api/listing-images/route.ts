import { NextResponse } from "next/server";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import pool from "@/lib/db";

type ListingImageBody = {
  listg_id?: number;
  image_url?: string;
  image_alt?: string;
  sortorder?: number;
};

// Gets images, optionally for one listing.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const listg_id = searchParams.get("listg_id");

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM ListingImage
       WHERE (? IS NULL OR listg_id = ?)
       ORDER BY listg_id DESC, image_sortorder ASC, image_id ASC`,
      [listg_id, listg_id]
    );

    return NextResponse.json({ data: rows });
  } catch (err: unknown) {
    console.error(err);

    return NextResponse.json(
      { error: "Something went wrong while loading listing images" },
      { status: 500 }
    );
  }
}

// Adds an image URL to a listing.
export async function POST(req: Request) {
  try {
    const { listg_id, image_url, image_alt, sortorder } =
      (await req.json()) as ListingImageBody;

    if (!listg_id || !image_url) {
      return NextResponse.json(
        { error: "listg_id and image_url are required" },
        { status: 400 }
      );
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO ListingImage (listg_id, image_url, image_alt, image_sortorder)
       VALUES (?, ?, ?, ?)`,
      [listg_id, image_url, image_alt ?? null, sortorder ?? 0]
    );

    return NextResponse.json({ message: "Listing image added", id: result.insertId });
  } catch (err: unknown) {
    console.error(err);

    return NextResponse.json(
      { error: "Something went wrong while adding the listing image" },
      { status: 500 }
    );
  }
}
