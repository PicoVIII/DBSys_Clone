import { NextResponse } from "next/server";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import pool from "@/lib/db";

type CategoryBody = {
  name?: string;
  parent_id?: number | null;
};

// GET ALL CATEGORIES (with parent info)
export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `
      SELECT 
        c1.ctgry_id,
        c1.ctgry_name,
        c1.parent_id,
        c2.ctgry_name AS parent_name
      FROM Category c1
      LEFT JOIN Category c2 ON c1.parent_id = c2.ctgry_id
      ORDER BY c1.ctgry_name ASC
      `
    );

    return NextResponse.json({ data: rows });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// CREATE CATEGORY OR SUBCATEGORY
export async function POST(req: Request) {
  try {
    const { name, parent_id } = (await req.json()) as CategoryBody;

    if (!name) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `
      INSERT INTO Category (ctgry_name, parent_id)
      VALUES (?, ?)
      `,
      [name, parent_id ?? null]
    );

    return NextResponse.json({
      message: parent_id
        ? "Subcategory created"
        : "Category created",
      id: result.insertId,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}