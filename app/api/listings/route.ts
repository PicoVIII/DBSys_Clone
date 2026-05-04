import { NextResponse } from "next/server";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import pool from "@/lib/db";

type ListingBody = {
  prdct_id?: number;
  user_id?: number;
  ctgry_id?: number;
  title?: string;
  format?: string;
  startprice?: number;
  fixedprice?: number;
  reserveprice?: number;
  bestoffer?: string;
  quantity?: number;
  startdate?: string;
  enddate?: string;
};

// Gets listings with filters and paging.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    const category = searchParams.get("category");
    const format = searchParams.get("format");
    const condition = searchParams.get("condition");
    const minPrice = Number(searchParams.get("minPrice"));
    const maxPrice = Number(searchParams.get("maxPrice"));
    const page = Math.max(Number(searchParams.get("page") ?? 1), 1);
    const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 20), 1), 50);
    const offset = (page - 1) * limit;

    const where: string[] = [];
    const params: (string | number)[] = [];

    if (q) {
      where.push("(l.listg_title LIKE ? OR p.prdct_name LIKE ? OR p.prdct_desc LIKE ?)");
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    if (category) {
      where.push("l.ctgry_id = ?");
      params.push(category);
    }

    if (format) {
      where.push("LOWER(l.listg_format) = LOWER(?)");
      params.push(format);
    }

    if (condition) {
      where.push("LOWER(p.prdct_cond) = LOWER(?)");
      params.push(condition);
    }

    if (!Number.isNaN(minPrice)) {
      where.push("COALESCE(l.listg_fixedprice, l.listg_startprice) >= ?");
      params.push(minPrice);
    }

    if (!Number.isNaN(maxPrice)) {
      where.push("COALESCE(l.listg_fixedprice, l.listg_startprice) <= ?");
      params.push(maxPrice);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT l.*, p.prdct_name, p.prdct_cond, c.ctgry_name,
        MIN(i.image_url) AS image_url
      FROM Listing l
      LEFT JOIN Product p ON p.prdct_id = l.prdct_id
      LEFT JOIN ListingImage i ON i.listg_id = l.listg_id
      LEFT JOIN Category c ON c.ctgry_id = l.ctgry_id
      ${whereSql}
      GROUP BY l.listg_id, p.prdct_name, p.prdct_cond, c.ctgry_name
      ORDER BY l.listg_id DESC
      LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return NextResponse.json({ data: rows, page, limit });
  } catch (err: unknown) {
    console.error(err);

    return NextResponse.json(
      { error: "Something went wrong while loading listings" },
      { status: 500 }
    );
  }
}

// Creates a new listing for a user.
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ListingBody;
    const {
      prdct_id,
      user_id,
      ctgry_id,
      title,
      format,
      startprice,
      fixedprice,
      reserveprice,
      bestoffer,
      quantity,
      startdate,
      enddate,
    } = body;

    if (!prdct_id || !user_id || !ctgry_id || !title || !format || !quantity || !startdate || !enddate) {
      return NextResponse.json(
        { error: "prdct_id, user_id, ctgry_id, title, format, quantity, startdate, and enddate are required" },
        { status: 400 }
      );
    }

    if (!["auction", "fixed"].includes(format.toLowerCase())) {
      return NextResponse.json(
        { error: "format must be auction or fixed" },
        { status: 400 }
      );
    }

    if (format.toLowerCase() === "auction" && !startprice) {
      return NextResponse.json(
        { error: "auction listings need startprice" },
        { status: 400 }
      );
    }

    if (format.toLowerCase() === "fixed" && !fixedprice) {
      return NextResponse.json(
        { error: "fixed listings need fixedprice" },
        { status: 400 }
      );
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO Listing
      (prdct_id, user_id, ctgry_id, listg_title, listg_format, listg_startprice,
      listg_fixedprice, listg_reserveprice, listg_bestoffer, listg_status,
      listg_quantity, listg_startdate, listg_enddate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?, ?)`,
      [
        prdct_id,
        user_id,
        ctgry_id,
        title,
        format,
        startprice ?? null,
        fixedprice ?? null,
        reserveprice ?? null,
        bestoffer ?? "No",
        quantity,
        startdate,
        enddate,
      ]
    );

    return NextResponse.json({ message: "Listing created", id: result.insertId });
  } catch (err: unknown) {
    console.error(err);

    return NextResponse.json(
      { error: "Something went wrong while creating the listing" },
      { status: 500 }
    );
  }
}
