import { NextResponse } from "next/server";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import pool from "@/lib/db";

type CategoryBody = {
  name?: string;
  parent_id?: number | null;
  image?: string | null;
};

type CategoryPatchBody = {
  ctgry_id?: number;
  name?: string;
  image?: string | null;
};

// GET ALL CATEGORIES (with parent info)
export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `
      SELECT 
        c1.ctgry_id,
        c1.ctgry_name,
        c1.ctgry_image,
        c1.parent_id,
        c2.ctgry_name AS parent_name
      FROM Category c1
      LEFT JOIN Category c2 ON c1.parent_id = c2.ctgry_id
      ORDER BY c1.ctgry_name ASC
      `
    );

    return NextResponse.json({ data: rows });
  } catch (err) {
    console.error("GET categories error:", err);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// CREATE CATEGORY OR SUBCATEGORY
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CategoryBody;
    const { name, parent_id, image } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    console.log("POST category body:", { name, parent_id, image: image?.slice(0, 50) });

    const [result] = await pool.execute<ResultSetHeader>(
      `
      INSERT INTO Category (ctgry_name, ctgry_image, parent_id)
      VALUES (?, ?, ?)
      `,
      [name, image ?? null, parent_id ?? null]
    );

    return NextResponse.json({
      message: parent_id
        ? "Subcategory created"
        : "Category created",
      id: result.insertId,
    });
  } catch (err) {
    console.error("POST categories error:", err);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}

// UPDATE CATEGORY (name and/or image)
export async function PATCH(req: Request) {
  try {
    const { ctgry_id, name, image } = (await req.json()) as CategoryPatchBody;

    if (!ctgry_id) {
      return NextResponse.json({ error: "ctgry_id is required" }, { status: 400 });
    }

    const updates: string[] = [];
    const params: (string | number | null)[] = [];

    if (name) {
      updates.push("ctgry_name = ?");
      params.push(name);
    }
    if (image !== undefined) {
      updates.push("ctgry_image = ?");
      params.push(image || null);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    params.push(ctgry_id);
    await pool.execute(
      `UPDATE Category SET ${updates.join(", ")} WHERE ctgry_id = ?`,
      params
    );

    return NextResponse.json({ message: "Category updated" });
  } catch {
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ctgry_id = searchParams.get("ctgry_id");
    if (!ctgry_id) {
      return NextResponse.json({ error: "ctgry_id is required" }, { status: 400 });
    }
    await pool.execute("DELETE FROM Category WHERE ctgry_id = ?", [ctgry_id]);
    await pool.execute("UPDATE Category SET parent_id = NULL WHERE parent_id = ?", [ctgry_id]);
    return NextResponse.json({ message: "Category deleted" });
  } catch {
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
