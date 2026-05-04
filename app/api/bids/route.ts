import { NextResponse } from "next/server";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import pool from "@/lib/db";

type BidBody = {
  listg_id?: number;
  user_id?: number;
  amount?: number;
};

// Gets all bids.
export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM Bid ORDER BY bid_date DESC, bid_id DESC`
    );

    return NextResponse.json({ data: rows });
  } catch (err: unknown) {
    console.error(err);

    return NextResponse.json(
      { error: "Something went wrong while loading bids" },
      { status: 500 }
    );
  }
}

// Places a bid on an auction listing.
export async function POST(req: Request) {
  const conn = await pool.getConnection();

  try {
    const { listg_id, user_id, amount } = (await req.json()) as BidBody;

    if (!listg_id || !user_id || !amount || amount <= 0) {
      conn.release();

      return NextResponse.json(
        { error: "listg_id, user_id, and a positive amount are required" },
        { status: 400 }
      );
    }

    await conn.beginTransaction();

    const [listings] = await conn.query<RowDataPacket[]>(
      `SELECT listg_format, user_id, listg_status, listg_startprice, listg_enddate
       FROM Listing WHERE listg_id = ? LIMIT 1 FOR UPDATE`,
      [listg_id]
    );

    if (listings.length === 0) {
      await conn.rollback();
      conn.release();

      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const listing = listings[0];
    const today = new Date().toISOString().split("T")[0];
    const endDate = new Date(listing.listg_enddate);
    const todayDate = new Date(`${today}T00:00:00.000Z`);

    if (String(listing.listg_format).toLowerCase() !== "auction") {
      await conn.rollback();
      conn.release();

      return NextResponse.json(
        { error: "Bids are only allowed on auction listings" },
        { status: 400 }
      );
    }

    if (String(listing.listg_status).toLowerCase() !== "active" || endDate < todayDate) {
      await conn.rollback();
      conn.release();

      return NextResponse.json(
        { error: "This auction is not active" },
        { status: 400 }
      );
    }

    if (Number(listing.user_id) === user_id) {
      await conn.rollback();
      conn.release();

      return NextResponse.json(
        { error: "Sellers cannot bid on their own listings" },
        { status: 400 }
      );
    }

    const [currentRows] = await conn.query<RowDataPacket[]>(
      `SELECT MAX(bid_amount) AS current_bid FROM Bid WHERE listg_id = ?`,
      [listg_id]
    );

    const currentBid = Number(currentRows[0]?.current_bid ?? listing.listg_startprice ?? 0);

    if (amount <= currentBid) {
      await conn.rollback();
      conn.release();

      return NextResponse.json(
        { error: `Bid must be higher than ${currentBid}` },
        { status: 400 }
      );
    }

    await conn.execute(
      `UPDATE Bid SET bid_status = 'Outbid' WHERE listg_id = ? AND bid_status = 'Active'`,
      [listg_id]
    );

    const [res] = await conn.execute<ResultSetHeader>(
      `INSERT INTO Bid 
      (listg_id, user_id, bid_amount, bid_date, bid_status)
      VALUES (?, ?, ?, ?, 'Active')`,
      [listg_id, user_id, amount, today]
    );

    await conn.execute(
      `UPDATE Listing SET listg_startprice = ? WHERE listg_id = ?`,
      [amount, listg_id]
    );

    await conn.commit();
    conn.release();

    return NextResponse.json({ message: "Bid placed", id: res.insertId });
  } catch (err: unknown) {
    await conn.rollback();
    conn.release();
    console.error(err);

    return NextResponse.json(
      { error: "Something went wrong while placing the bid" },
      { status: 500 }
    );
  }
}
