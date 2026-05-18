import { NextResponse } from "next/server";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import pool from "@/lib/db";

type OrderBody = {
  user_id?: number;
  baddr_id?: number;
  listg_id?: number;
  quantity?: number;
  payment_method?: string;
};

type OrderPatchBody = {
  order_id?: number;
  seller_user_id?: number;
  action?: "approve" | "reject";
};

// Gets all orders with payment details, optionally filtered by user_id.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");
    const seller_id = searchParams.get("seller_id");

    const where: string[] = [];
    const params: (string | number)[] = [];
    if (user_id) { where.push("o.user_id = ?"); params.push(Number(user_id)); }
    if (seller_id) { where.push("l.user_id = ?"); params.push(Number(seller_id)); }
    const whereSql = where.length ? "WHERE " + where.join(" AND ") : "";

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
        o.*,
        p.paymt_method,
        p.paymt_status,
        p.paymt_amount,
        oi.listg_id,
        oi.ordit_quantity,
        oi.ordit_itemprice,
        l.listg_title,
        l.user_id AS seller_user_id,
        sh.shpmt_id,
        sh.shpmt_trackingno,
        sh.shpmt_deliverydate,
        sh.shpmt_status,
        b.baddr_street, b.baddr_city, b.baddr_country, b.baddr_pcode,
        u.fname AS buyer_fname, u.lname AS buyer_lname
      FROM OrderList o
      LEFT JOIN Payment p ON p.order_id = o.order_id
      LEFT JOIN OrderItem oi ON oi.order_id = o.order_id
      LEFT JOIN Listing l ON l.listg_id = oi.listg_id
      LEFT JOIN Shipment sh ON sh.shpmt_id = (
        SELECT sh2.shpmt_id
        FROM Shipment sh2
        WHERE sh2.order_id = o.order_id
        ORDER BY sh2.shpmt_id DESC
        LIMIT 1
      )
      LEFT JOIN BuyerAddress b ON b.baddr_id = o.baddr_id
      LEFT JOIN User u ON u.user_id = o.user_id
      ${whereSql}
      ORDER BY o.order_date DESC, o.order_id DESC`,
      params
    );

    return NextResponse.json({ data: rows }, { status: 200 });
  } catch (err: unknown) {
    console.error(err);

    return NextResponse.json(
      { error: "Something went wrong while loading orders" },
      { status: 500 }
    );
  }
}


// Creates an order, payment, and order item together.
export async function POST(req: Request) {
  const conn = await pool.getConnection();

  try {
    const body: OrderBody = await req.json();
    const { user_id, baddr_id, listg_id, quantity, payment_method } = body;

    if (!user_id || !baddr_id || !listg_id || !quantity || quantity <= 0 || !payment_method) {
      conn.release();

      return NextResponse.json(
        { error: "user_id, baddr_id, listg_id, positive quantity, and payment_method are required" },
        { status: 400 }
      );
    }

    const date = new Date().toISOString().split("T")[0];

    await conn.beginTransaction();

    const [addresses] = await conn.query<RowDataPacket[]>(
      `SELECT baddr_id FROM BuyerAddress WHERE baddr_id = ? AND user_id = ? LIMIT 1`,
      [baddr_id, user_id]
    );

    if (addresses.length === 0) {
      await conn.rollback();
      conn.release();

      return NextResponse.json(
        { error: "Address does not belong to this user" },
        { status: 400 }
      );
    }

    const [listings] = await conn.query<RowDataPacket[]>(
      `SELECT user_id, listg_format, listg_status, listg_fixedprice, listg_quantity
       FROM Listing WHERE listg_id = ? LIMIT 1 FOR UPDATE`,
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
        { error: "Sellers cannot buy their own listings" },
        { status: 400 }
      );
    }

    if (String(listing.listg_status).toLowerCase() !== "active") {
      await conn.rollback();
      conn.release();

      return NextResponse.json(
        { error: "Listing is not available" },
        { status: 400 }
      );
    }

    if (String(listing.listg_format).toLowerCase() !== "fixed") {
      await conn.rollback();
      conn.release();

      return NextResponse.json(
        { error: "Direct orders are only for fixed-price listings" },
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

    const itemPrice = Number(listing.listg_fixedprice);
    const total = quantity * itemPrice;

    const [orderRes] = await conn.execute<ResultSetHeader>(
      `INSERT INTO OrderList 
      (user_id, baddr_id, order_date, order_status, order_totalamount)
      VALUES (?, ?, ?, 'Pending', ?)`,
      [user_id, baddr_id, date, total]
    );

    const order_id = orderRes.insertId;

    await conn.execute(
      `INSERT INTO OrderItem (order_id, listg_id, ordit_quantity, ordit_itemprice)
       VALUES (?, ?, ?, ?)`,
      [order_id, listg_id, quantity, itemPrice]
    );

    await conn.execute(
      `INSERT INTO Payment (order_id, paymt_method, paymt_amount, paymt_date, paymt_status)
       VALUES (?, ?, ?, ?, 'Pending')`,
      [order_id, payment_method, total, date]
    );

    await conn.execute(
      `UPDATE Listing
       SET listg_quantity = listg_quantity - ?,
           listg_status = CASE WHEN listg_quantity - ? = 0 THEN 'Sold' ELSE listg_status END
       WHERE listg_id = ?`,
      [quantity, quantity, listg_id]
    );

    await conn.execute(
      `DELETE ci FROM CartItem ci
       JOIN Cart c ON c.cart_id = ci.cart_id
       WHERE c.user_id = ? AND ci.listg_id = ?`,
      [user_id, listg_id]
    );

    await conn.commit();
    conn.release();

    return NextResponse.json({ message: "Order created", order_id });
  } catch (err: unknown) {
    await conn.rollback();
    conn.release();
    console.error(err);

    return NextResponse.json(
      { error: "Something went wrong while creating the order" },
      { status: 500 }
    );
  }
}

// Updates order status (seller approves or rejects an order).
export async function PATCH(req: Request) {
  const conn = await pool.getConnection();

  try {
    const body: OrderPatchBody = await req.json();
    const { order_id, seller_user_id, action } = body;

    if (!order_id || !seller_user_id || !action) {
      conn.release();

      return NextResponse.json(
        { error: "order_id, seller_user_id, and action are required" },
        { status: 400 }
      );
    }

    if (action !== "approve" && action !== "reject") {
      conn.release();

      return NextResponse.json(
        { error: "action must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    await conn.beginTransaction();

    const [orders] = await conn.query<RowDataPacket[]>(
      `SELECT o.*, oi.listg_id
       FROM OrderList o
       LEFT JOIN OrderItem oi ON oi.order_id = o.order_id
       WHERE o.order_id = ? LIMIT 1 FOR UPDATE`,
      [order_id]
    );

    if (orders.length === 0) {
      await conn.rollback();
      conn.release();

      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = orders[0];

    const [listings] = await conn.query<RowDataPacket[]>(
      `SELECT user_id FROM Listing WHERE listg_id = ? LIMIT 1`,
      [order.listg_id]
    );

    if (listings.length === 0 || Number(listings[0].user_id) !== seller_user_id) {
      await conn.rollback();
      conn.release();

      return NextResponse.json(
        { error: "Only the seller can approve or reject this order" },
        { status: 403 }
      );
    }

    if (action === "approve") {
      await conn.execute(
        `UPDATE OrderList SET order_status = 'Paid' WHERE order_id = ?`,
        [order_id]
      );

      await conn.execute(
        `UPDATE Payment SET paymt_status = 'Completed' WHERE order_id = ?`,
        [order_id]
      );
    } else {
      await conn.execute(
        `UPDATE OrderList SET order_status = 'Rejected' WHERE order_id = ?`,
        [order_id]
      );

      await conn.execute(
        `UPDATE Payment SET paymt_status = 'Rejected' WHERE order_id = ?`,
        [order_id]
      );

      await conn.execute(
        `UPDATE Listing
         SET listg_quantity = listg_quantity + ?,
             listg_status = 'Active'
         WHERE listg_id = ?`,
        [Number(order.ordit_quantity), order.listg_id]
      );
    }

    await conn.commit();
    conn.release();

    return NextResponse.json({ message: `Order ${action}d`, order_id });
  } catch (err: unknown) {
    await conn.rollback();
    conn.release();
    console.error(err);

    return NextResponse.json(
      { error: "Something went wrong while updating the order" },
      { status: 500 }
    );
  }
}
