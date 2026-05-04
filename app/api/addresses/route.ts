import { NextResponse } from "next/server";
import type { ResultSetHeader } from "mysql2/promise";
import pool from "@/lib/db";

type AddressBody = {
  user_id: number;
  street: string;
  city: string;
  country: string;
  pcode: string;
};

// Adds an address for a user.
export async function POST(req: Request) {
  try {
    const body: AddressBody = await req.json();
    const { user_id, street, city, country, pcode } = body;

    if (!user_id || !street || !city || !country || !pcode) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO BuyerAddress 
      (user_id, baddr_street, baddr_city, baddr_country, baddr_pcode)
      VALUES (?, ?, ?, ?, ?)`,
      [user_id, street, city, country, pcode]
    );

    return NextResponse.json({
      message: "Address added",
      id: result.insertId,
    });
  } catch (err: unknown) {
    console.error(err);

    return NextResponse.json(
      { error: "Something went wrong while adding the address" },
      { status: 500 }
    );
  }
}
