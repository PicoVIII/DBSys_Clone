import { NextResponse } from "next/server";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import pool from "@/lib/db";

type FeedbackBody = {
  listg_id?: number;
  buyer_user_id?: number;
  seller_user_id?: number;
  comment?: string;
  rating?: number;
  type?: string;
};

function normalizeFeedbackType(type: unknown, rating?: number) {
  const normalized = String(type ?? "").toLowerCase();
  if (normalized === "positive") return "Positive";
  if (normalized === "neutral") return "Neutral";
  if (normalized === "negative") return "Negative";
  if (rating && rating >= 4) return "Positive";
  if (rating === 3) return "Neutral";
  if (rating && rating >= 1 && rating <= 2) return "Negative";
  return null;
}

function feedbackTypeToRating(type: string) {
  if (type === "Positive") return 5;
  if (type === "Neutral") return 3;
  return 1;
}

async function feedbackHasRatingColumn() {
  const [rows] = await pool.query<RowDataPacket[]>("SHOW COLUMNS FROM Feedback LIKE 'fdbck_rating'");
  return rows.length > 0;
}

// Gets feedback, optionally filtered by buyer, seller, or listing.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const buyerId = searchParams.get("buyer_id");
    const sellerId = searchParams.get("seller_id");
    const listingId = searchParams.get("listg_id");
    let sql = `SELECT
      f.fdbck_id,
      f.listg_id,
      f.buyer_user_id,
      f.seller_user_id,
      f.fdbck_comment,
      f.fdbck_type,
      f.fdbck_date,
      l.listg_title,
      b.fname AS buyer_fname, b.lname AS buyer_lname,
      s.fname AS seller_fname, s.lname AS seller_lname
      FROM Feedback f
      JOIN Listing l ON l.listg_id = f.listg_id
      JOIN User b ON b.user_id = f.buyer_user_id
      JOIN User s ON s.user_id = f.seller_user_id`;
    const params: (string | number)[] = [];
    const where: string[] = [];

    if (buyerId) {
      where.push("f.buyer_user_id = ?");
      params.push(Number(buyerId));
    }
    if (sellerId) {
      where.push("f.seller_user_id = ?");
      params.push(Number(sellerId));
    }
    if (listingId) {
      where.push("f.listg_id = ?");
      params.push(Number(listingId));
    }

    if (where.length) sql += " WHERE " + where.join(" AND ");
    sql += " ORDER BY f.fdbck_date DESC, f.fdbck_id DESC";

    const [rows] = await pool.query<RowDataPacket[]>(sql, params);

    return NextResponse.json({ data: rows });
  } catch (err: unknown) {
    console.error(err);

    return NextResponse.json(
      { error: "Something went wrong while loading feedback" },
      { status: 500 }
    );
  }
}

// Adds feedback for a completed transaction.
export async function POST(req: Request) {
  try {
    const { listg_id, buyer_user_id, seller_user_id, comment, rating, type } =
      (await req.json()) as FeedbackBody;
    const feedbackType = normalizeFeedbackType(type, rating);

    if (!listg_id || !buyer_user_id || !seller_user_id || !comment || !feedbackType) {
      return NextResponse.json(
        { error: "listg_id, buyer_user_id, seller_user_id, comment, and Positive/Neutral/Negative type are required" },
        { status: 400 }
      );
    }

    const [paidOrders] = await pool.query<RowDataPacket[]>(
      `SELECT o.order_id
       FROM OrderList o
       JOIN OrderItem oi ON oi.order_id = o.order_id
       JOIN Listing l ON l.listg_id = oi.listg_id
       JOIN Payment p ON p.order_id = o.order_id
       WHERE o.user_id = ?
         AND oi.listg_id = ?
         AND l.user_id = ?
         AND p.paymt_status = 'Paid'
         AND o.order_status <> 'Cancelled'
       LIMIT 1`,
      [buyer_user_id, listg_id, seller_user_id]
    );

    if (paidOrders.length === 0) {
      return NextResponse.json(
        { error: "Feedback can only be left after the order is paid" },
        { status: 400 }
      );
    }

    const [existing] = await pool.query<RowDataPacket[]>(
      `SELECT fdbck_id FROM Feedback
       WHERE listg_id = ? AND buyer_user_id = ? AND seller_user_id = ?
       LIMIT 1`,
      [listg_id, buyer_user_id, seller_user_id]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Feedback has already been left for this order" },
        { status: 409 }
      );
    }

    const date = new Date().toISOString().split("T")[0];
    const numericRating = feedbackTypeToRating(feedbackType);
    const hasRatingColumn = await feedbackHasRatingColumn();

    const [result] = hasRatingColumn
      ? await pool.execute<ResultSetHeader>(
          `INSERT INTO Feedback
          (listg_id, buyer_user_id, seller_user_id, fdbck_comment, fdbck_type, fdbck_rating, fdbck_date)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [listg_id, buyer_user_id, seller_user_id, comment, feedbackType, numericRating, date]
        )
      : await pool.execute<ResultSetHeader>(
          `INSERT INTO Feedback
          (listg_id, buyer_user_id, seller_user_id, fdbck_comment, fdbck_type, fdbck_date)
          VALUES (?, ?, ?, ?, ?, ?)`,
          [listg_id, buyer_user_id, seller_user_id, comment, feedbackType, date]
        );

    return NextResponse.json({ message: "Feedback added", id: result.insertId });
  } catch (err: unknown) {
    console.error(err);

    return NextResponse.json(
      { error: "Something went wrong while adding feedback" },
      { status: 500 }
    );
  }
}
