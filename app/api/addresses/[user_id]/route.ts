import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";

type AddressRow = RowDataPacket & {
  baddr_id: number;
  user_id: number;
  baddr_street: string;
  baddr_city: string;
  baddr_country: string;
  baddr_pcode: string;
};

// Gets all addresses for one user.
export async function GET(
  _: Request,
  { params }: { params: Promise<{ user_id: string }> }
) {
  try {
    const { user_id } = await params;

    const [rows] = await pool.query<AddressRow[]>(
      `SELECT * FROM BuyerAddress WHERE user_id = ? ORDER BY baddr_id DESC`,
      [user_id]
    );

    return NextResponse.json({ data: rows });
  } catch (err: unknown) {
    console.error(err);

    return NextResponse.json(
      { error: "Something went wrong while loading addresses" },
      { status: 500 }
    );
  }
}
