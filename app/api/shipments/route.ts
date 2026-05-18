import { NextResponse } from "next/server";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import pool from "@/lib/db";

type ShipmentBody = {
  order_id?: number;
  courr_id?: number;
  courier_name?: string;
  trackingno?: string;
  shipdate?: string;
  expectdate?: string;
  deliverydate?: string;
  status?: string;
};

type ShipmentPatchBody = {
  shpmt_id?: number;
  order_id?: number;
  seller_user_id?: number;
  deliverydate?: string;
  status?: "Delivered";
};

// Gets all shipments with courier names.
export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT s.*, c.courr_name
      FROM Shipment s
      LEFT JOIN Courier c ON c.courr_id = s.courr_id
      ORDER BY s.shpmt_id DESC`
    );

    return NextResponse.json({ data: rows });
  } catch (err: unknown) {
    console.error(err);

    return NextResponse.json(
      { error: "Something went wrong while loading shipments" },
      { status: 500 }
    );
  }
}

// Creates shipment tracking for an order.
export async function POST(req: Request) {
  const conn = await pool.getConnection();

  try {
    const { order_id, courr_id, courier_name, trackingno, shipdate, expectdate, deliverydate, status } =
      (await req.json()) as ShipmentBody;

    if (!order_id || !trackingno || !shipdate || !expectdate || !status) {
      conn.release();
      return NextResponse.json(
        { error: "order_id, trackingno, shipdate, expectdate, and status are required" },
        { status: 400 }
      );
    }

    if (status !== "Shipped" && status !== "Delivered") {
      conn.release();
      return NextResponse.json(
        { error: "status must be Shipped or Delivered" },
        { status: 400 }
      );
    }

    if (status === "Delivered" && !deliverydate) {
      conn.release();
      return NextResponse.json(
        { error: "deliverydate is required when status is Delivered" },
        { status: 400 }
      );
    }

    if (!courr_id && !courier_name) {
      conn.release();
      return NextResponse.json(
        { error: "courr_id or courier_name is required" },
        { status: 400 }
      );
    }

    await conn.beginTransaction();

    const [orders] = await conn.query<RowDataPacket[]>(
      `SELECT order_status FROM OrderList WHERE order_id = ? LIMIT 1`,
      [order_id]
    );

    if (orders.length === 0) {
      await conn.rollback();
      conn.release();
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    if (String(orders[0].order_status).toLowerCase() !== "paid") {
      await conn.rollback();
      conn.release();
      return NextResponse.json(
        { error: "Shipment can only be created for approved (Paid) orders" },
        { status: 400 }
      );
    }

    let finalCourrId: number | undefined = courr_id;

    if (courier_name && !courr_id) {
      const [existing] = await conn.query<RowDataPacket[]>(
        `SELECT courr_id FROM Courier WHERE courr_name = ? LIMIT 1`,
        [courier_name]
      );

      if (existing.length > 0) {
        finalCourrId = Number(existing[0].courr_id);
      } else {
        const [insertResult] = await conn.execute<ResultSetHeader>(
          `INSERT INTO Courier (courr_name, courr_phone, courr_email) VALUES (?, '', '')`,
          [courier_name]
        );
        finalCourrId = insertResult.insertId;
      }
    }

    if (!finalCourrId) {
      await conn.rollback();
      conn.release();
      return NextResponse.json(
        { error: "Courier could not be resolved" },
        { status: 400 }
      );
    }

    const [result] = await conn.execute<ResultSetHeader>(
      `INSERT INTO Shipment
      (order_id, courr_id, shpmt_trackingno, shpmt_shipdate, shpmt_expectdate,
      shpmt_deliverydate, shpmt_status)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [order_id, finalCourrId, trackingno, shipdate, expectdate, deliverydate ?? null, status]
    );

    await conn.commit();
    conn.release();

    return NextResponse.json({ message: "Shipment created", id: result.insertId });
  } catch (err: unknown) {
    await conn.rollback();
    conn.release();
    console.error(err);

    return NextResponse.json(
      { error: "Something went wrong while creating the shipment" },
      { status: 500 }
    );
  }
}

// Marks shipment tracking as delivered. In this clone, this stands in for courier tracking updates.
export async function PATCH(req: Request) {
  const conn = await pool.getConnection();

  try {
    const { shpmt_id, order_id, seller_user_id, deliverydate, status } =
      (await req.json()) as ShipmentPatchBody;

    if ((!shpmt_id && !order_id) || !seller_user_id || status !== "Delivered") {
      conn.release();
      return NextResponse.json(
        { error: "shpmt_id or order_id, seller_user_id, and Delivered status are required" },
        { status: 400 }
      );
    }

    await conn.beginTransaction();

    const params: number[] = [];
    let where = "";
    if (shpmt_id) {
      where = "s.shpmt_id = ?";
      params.push(shpmt_id);
    } else {
      where = "s.order_id = ?";
      params.push(order_id!);
    }

    const [shipments] = await conn.query<RowDataPacket[]>(
      `SELECT s.shpmt_id, o.order_status, l.user_id AS seller_user_id
       FROM Shipment s
       JOIN OrderList o ON o.order_id = s.order_id
       JOIN OrderItem oi ON oi.order_id = o.order_id
       JOIN Listing l ON l.listg_id = oi.listg_id
       WHERE ${where}
       LIMIT 1 FOR UPDATE`,
      params
    );

    if (shipments.length === 0) {
      await conn.rollback();
      conn.release();
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    const shipment = shipments[0];

    if (Number(shipment.seller_user_id) !== seller_user_id) {
      await conn.rollback();
      conn.release();
      return NextResponse.json(
        { error: "Only the seller can update this shipment" },
        { status: 403 }
      );
    }

    if (String(shipment.order_status).toLowerCase() !== "paid") {
      await conn.rollback();
      conn.release();
      return NextResponse.json(
        { error: "Only paid orders can be marked as delivered" },
        { status: 400 }
      );
    }

    const deliveredOn = deliverydate || new Date().toISOString().split("T")[0];

    await conn.execute(
      `UPDATE Shipment
       SET shpmt_status = 'Delivered',
           shpmt_deliverydate = ?
       WHERE shpmt_id = ?`,
      [deliveredOn, Number(shipment.shpmt_id)]
    );

    await conn.commit();
    conn.release();

    return NextResponse.json({ message: "Shipment marked as delivered" });
  } catch (err: unknown) {
    await conn.rollback();
    conn.release();
    console.error(err);

    return NextResponse.json(
      { error: "Something went wrong while updating the shipment" },
      { status: 500 }
    );
  }
}
