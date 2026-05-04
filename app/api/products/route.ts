import { NextResponse } from "next/server";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import pool from "@/lib/db";

type ProductBody = {
  user_id?: number;
  name?: string;
  brand?: string;
  condition?: string;
  description?: string;
};

// Gets all products.
export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM Product ORDER BY prdct_id DESC`
    );

    return NextResponse.json({ data: rows });
  } catch (err: unknown) {
    console.error(err);

    return NextResponse.json(
      { error: "Something went wrong while loading products" },
      { status: 500 }
    );
  }
}

// Creates a new product owned by a user.
export async function POST(req: Request) {
  try {
    const { user_id, name, brand, condition, description } =
      (await req.json()) as ProductBody;

    if (!user_id || !name || !condition) {
      return NextResponse.json(
        { error: "user_id, name, and condition are required" },
        { status: 400 }
      );
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO Product
      (user_id, prdct_name, prdct_brand, prdct_cond, prdct_desc)
      VALUES (?, ?, ?, ?, ?)`,
      [user_id, name, brand ?? null, condition, description ?? null]
    );

    return NextResponse.json({ message: "Product created", id: result.insertId });
  } catch (err: unknown) {
    console.error(err);

    return NextResponse.json(
      { error: "Something went wrong while creating the product" },
      { status: 500 }
    );
  }
}
