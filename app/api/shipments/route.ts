import { NextResponse } from "next/server";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import pool from "@/lib/db";

type ShipmentBody = {
  order_id?: number;
  courr_id?: number;
  trackingno?: string;
  shipdate?: string;
  expectdate?: string;
  deliverydate?: string;
  status?: string;
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
  try {
    const { order_id, courr_id, trackingno, shipdate, expectdate, deliverydate, status } =
      (await req.json()) as ShipmentBody;

    if (!order_id || !courr_id || !trackingno || !shipdate || !expectdate || !status) {
      return NextResponse.json(
        { error: "order_id, courr_id, trackingno, shipdate, expectdate, and status are required" },
        { status: 400 }
      );
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO Shipment
      (order_id, courr_id, shpmt_trackingno, shpmt_shipdate, shpmt_expectdate,
      shpmt_deliverydate, shpmt_status)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [order_id, courr_id, trackingno, shipdate, expectdate, deliverydate ?? null, status]
    );

    return NextResponse.json({ message: "Shipment created", id: result.insertId });
  } catch (err: unknown) {
    console.error(err);

    return NextResponse.json(
      { error: "Something went wrong while creating the shipment" },
      { status: 500 }
    );
  }
}
