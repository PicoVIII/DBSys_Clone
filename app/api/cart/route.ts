import { NextResponse } from "next/server";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import pool from "@/lib/db";

type CartBody = {
  user_id?: number;
  listg_id?: number;
  quantity?: number;
};

// Gets a user's cart.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");

    if (!user_id) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT c.cart_id, ci.listg_id, ci.quantity, l.listg_title, l.listg_fixedprice,
        l.listg_quantity AS available_quantity
       FROM Cart c
       JOIN CartItem ci ON ci.cart_id = c.cart_id
       JOIN Listing l ON l.listg_id = ci.listg_id
       WHERE c.user_id = ?
       ORDER BY ci.listg_id DESC`,
      [user_id]
    );

    return NextResponse.json({ data: rows });
  } catch (err: unknown) {
    console.error(err);

    return NextResponse.json(
      { error: "Something went wrong while loading cart" },
      { status: 500 }
    );
  }
}

// Adds or updates a fixed-price cart item.
export async function POST(req: Request) {
  const conn = await pool.getConnection();

  try {
    const { user_id, listg_id, quantity } = (await req.json()) as CartBody;

    if (!user_id || !listg_id || !quantity || quantity <= 0) {
      conn.release();

      return NextResponse.json(
        { error: "user_id, listg_id, and positive quantity are required" },
        { status: 400 }
      );
    }

    await conn.beginTransaction();

    const [listings] = await conn.query<RowDataPacket[]>(
      `SELECT user_id, listg_format, listg_status, listg_quantity
       FROM Listing WHERE listg_id = ? LIMIT 1`,
      [listg_id]
    );

    if (listings.length === 0) {
      await conn.rollback();
      conn.release();

      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const listing = listings[0];

    if (Number(listing.user_id) === user_id) {
      await conn.rollback();
      conn.release();

      return NextResponse.json(
        { error: "Sellers cannot add their own listings to cart" },
        { status: 400 }
      );
    }

    if (String(listing.listg_format).toLowerCase() !== "fixed" || String(listing.listg_status).toLowerCase() !== "active") {
      await conn.rollback();
      conn.release();

      return NextResponse.json(
        { error: "Only active fixed-price listings can be added to cart" },
        { status: 400 }
      );
    }

    if (Number(listing.listg_quantity) < quantity) {
      await conn.rollback();
      conn.release();

      return NextResponse.json(
        { error: "Not enough stock available" },
        { status: 400 }
      );
    }

    const date = new Date().toISOString().split("T")[0];

    await conn.execute(
      `INSERT IGNORE INTO Cart (user_id, created_at) VALUES (?, ?)`,
      [user_id, date]
    );

    const [carts] = await conn.query<RowDataPacket[]>(
      `SELECT cart_id FROM Cart WHERE user_id = ? LIMIT 1`,
      [user_id]
    );

    await conn.execute<ResultSetHeader>(
      `INSERT INTO CartItem (cart_id, listg_id, quantity)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)`,
      [carts[0].cart_id, listg_id, quantity]
    );

    await conn.commit();
    conn.release();

    return NextResponse.json({ message: "Cart updated" });
  } catch (err: unknown) {
    await conn.rollback();
    conn.release();
    console.error(err);

    return NextResponse.json(
      { error: "Something went wrong while updating cart" },
      { status: 500 }
    );
  }
}

// Removes an item from a cart.
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
      `DELETE ci FROM CartItem ci
       JOIN Cart c ON c.cart_id = ci.cart_id
       WHERE c.user_id = ? AND ci.listg_id = ?`,
      [user_id, listg_id]
    );

    return NextResponse.json({ message: "Cart item removed" });
  } catch (err: unknown) {
    console.error(err);

    return NextResponse.json(
      { error: "Something went wrong while removing cart item" },
      { status: 500 }
    );
  }
}
