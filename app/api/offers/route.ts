import { NextResponse } from "next/server";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import pool from "@/lib/db";

type OfferBody = {
  listg_id?: number;
  user_id?: number;
  amount?: number;
};

type OfferDecisionBody = {
  offer_id?: number;
  seller_user_id?: number;
  status?: "Accepted" | "Rejected";
};

// Gets all best offers.
export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM BestOffer ORDER BY bstof_date DESC, bstof_id DESC`
    );

    return NextResponse.json({ data: rows });
  } catch (err: unknown) {
    console.error(err);

    return NextResponse.json(
      { error: "Something went wrong while loading offers" },
      { status: 500 }
    );
  }
}

// Submits a best offer for a listing.
export async function POST(req: Request) {
  try {
    const { listg_id, user_id, amount }: OfferBody =
      await req.json();

    if (!listg_id || !user_id || !amount) {
      return NextResponse.json(
        { error: "listg_id, user_id, and amount are required" },
        { status: 400 }
      );
    }

    const [listings] = await pool.query<RowDataPacket[]>(
      `SELECT user_id, listg_bestoffer, listg_status, listg_quantity
       FROM Listing WHERE listg_id = ? LIMIT 1`,
      [listg_id]
    );

    if (listings.length === 0) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (String(listings[0].listg_bestoffer).toLowerCase() !== "yes") {
      return NextResponse.json(
        { error: "Best offers are not allowed on this listing" },
        { status: 400 }
      );
    }

    if (Number(listings[0].user_id) === user_id) {
      return NextResponse.json(
        { error: "Sellers cannot offer on their own listings" },
        { status: 400 }
      );
    }

    if (String(listings[0].listg_status).toLowerCase() !== "active" || Number(listings[0].listg_quantity) < 1) {
      return NextResponse.json(
        { error: "Listing is not available for offers" },
        { status: 400 }
      );
    }

    const date = new Date().toISOString().split("T")[0];

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO BestOffer 
      (listg_id, user_id, bstof_amount, bstof_date, bstof_status)
      VALUES (?, ?, ?, ?, 'Pending')`,
      [listg_id, user_id, amount, date]
    );

    return NextResponse.json({
      message: "Offer submitted",
      id: result.insertId,
    });
  } catch (err: unknown) {
    console.error(err);

    return NextResponse.json(
      { error: "Something went wrong while submitting the offer" },
      { status: 500 }
    );
  }
}

// Lets a seller accept or reject an offer.
export async function PATCH(req: Request) {
  const conn = await pool.getConnection();

  try {
    const { offer_id, seller_user_id, status } = (await req.json()) as OfferDecisionBody;

    if (!offer_id || !seller_user_id || !status || !["Accepted", "Rejected"].includes(status)) {
      conn.release();

      return NextResponse.json(
        { error: "offer_id, seller_user_id, and status Accepted or Rejected are required" },
        { status: 400 }
      );
    }

    await conn.beginTransaction();

    const [offers] = await conn.query<RowDataPacket[]>(
      `SELECT o.bstof_id, o.listg_id, o.bstof_status, l.user_id AS seller_id, l.listg_quantity, l.listg_status
       FROM BestOffer o
       JOIN Listing l ON l.listg_id = o.listg_id
       WHERE o.bstof_id = ? LIMIT 1 FOR UPDATE`,
      [offer_id]
    );

    if (offers.length === 0) {
      await conn.rollback();
      conn.release();

      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }

    const offer = offers[0];

    if (Number(offer.seller_id) !== seller_user_id) {
      await conn.rollback();
      conn.release();

      return NextResponse.json(
        { error: "Only the seller can update this offer" },
        { status: 403 }
      );
    }

    if (String(offer.bstof_status).toLowerCase() !== "pending") {
      await conn.rollback();
      conn.release();

      return NextResponse.json(
        { error: "Only pending offers can be updated" },
        { status: 400 }
      );
    }

    if (status === "Accepted" && (String(offer.listg_status).toLowerCase() !== "active" || Number(offer.listg_quantity) < 1)) {
      await conn.rollback();
      conn.release();

      return NextResponse.json(
        { error: "Listing is not available" },
        { status: 400 }
      );
    }

    await conn.execute(
      `UPDATE BestOffer SET bstof_status = ? WHERE bstof_id = ?`,
      [status, offer_id]
    );

    if (status === "Accepted") {
      await conn.execute(
        `UPDATE BestOffer
         SET bstof_status = 'Rejected'
         WHERE listg_id = ? AND bstof_id <> ? AND bstof_status = 'Pending'`,
        [offer.listg_id, offer_id]
      );

      await conn.execute(
        `UPDATE Listing
         SET listg_quantity = listg_quantity - 1,
             listg_status = CASE WHEN listg_quantity - 1 = 0 THEN 'Sold' ELSE listg_status END
         WHERE listg_id = ?`,
        [offer.listg_id]
      );
    }

    await conn.commit();
    conn.release();

    return NextResponse.json({ message: `Offer ${status.toLowerCase()}` });
  } catch (err: unknown) {
    await conn.rollback();
    conn.release();
    console.error(err);

    return NextResponse.json(
      { error: "Something went wrong while updating the offer" },
      { status: 500 }
    );
  }
}
