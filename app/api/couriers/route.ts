import { NextResponse } from "next/server";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import pool from "@/lib/db";

type CourierBody = {
  name?: string;
  phone?: string;
  email?: string;
};

// Gets all couriers.
export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM Courier ORDER BY courr_name ASC`
    );

    return NextResponse.json({ data: rows });
  } catch (err: unknown) {
    console.error(err);

    return NextResponse.json(
      { error: "Something went wrong while loading couriers" },
      { status: 500 }
    );
  }
}

// Creates a new courier.
export async function POST(req: Request) {
  try {
    const { name, phone, email } = (await req.json()) as CourierBody;

    if (!name || !phone || !email) {
      return NextResponse.json(
        { error: "name, phone, and email are required" },
        { status: 400 }
      );
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO Courier (courr_name, courr_phone, courr_email)
      VALUES (?, ?, ?)`,
      [name, phone, email]
    );

    return NextResponse.json({ message: "Courier created", id: result.insertId });
  } catch (err: unknown) {
    console.error(err);

    return NextResponse.json(
      { error: "Something went wrong while creating the courier" },
      { status: 500 }
    );
  }
}
