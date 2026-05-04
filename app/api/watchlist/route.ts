import { NextResponse } from "next/server";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import pool from "@/lib/db";

type WatchlistBody = {
  user_id?: number;
  listg_id?: number;
};

// Gets a user's saved listings.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");

    if (!user_id) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT w.*, l.listg_title, l.listg_status, l.listg_fixedprice, l.listg_startprice
       FROM Watchlist w
       JOIN Listing l ON l.listg_id = w.listg_id
       WHERE w.user_id = ?
       ORDER BY w.created_at DESC`,
      [user_id]
    );

    return NextResponse.json({ data: rows });
  } catch (err: unknown) {
    console.error(err);

    return NextResponse.json(
      { error: "Something went wrong while loading watchlist" },
      { status: 500 }
    );
  }
}

// Saves a listing for a user.
export async function POST(req: Request) {
  try {
    const { user_id, listg_id } = (await req.json()) as WatchlistBody;

    if (!user_id || !listg_id) {
      return NextResponse.json(
        { error: "user_id and listg_id are required" },
        { status: 400 }
      );
    }

    const date = new Date().toISOString().split("T")[0];

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT IGNORE INTO Watchlist (user_id, listg_id, created_at)
       VALUES (?, ?, ?)`,
      [user_id, listg_id, date]
    );

    return NextResponse.json({
      message: result.affectedRows ? "Listing saved" : "Listing already saved",
    });
  } catch (err: unknown) {
    console.error(err);

    return NextResponse.json(
      { error: "Something went wrong while saving listing" },
      { status: 500 }
    );
  }
}

// Removes a saved listing.
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");
    const listg_id = searchParams.get("listg_id");

    if (!user_id || !listg_id) {
      return NextResponse.json(
        { error: "user_id and listg_id are required" },
        { status: 400 }
      );
    }

    await pool.execute(
      `DELETE FROM Watchlist WHERE user_id = ? AND listg_id = ?`,
      [user_id, listg_id]
    );

    return NextResponse.json({ message: "Listing removed from watchlist" });
  } catch (err: unknown) {
    console.error(err);

    return NextResponse.json(
      { error: "Something went wrong while removing watchlist item" },
      { status: 500 }
    );
  }
}
