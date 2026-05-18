import { NextResponse, NextRequest } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || (token as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const [[users]] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS total, SUM(is_banned = 1) AS banned, SUM(role = 'admin') AS admins FROM `User`"
    );
    const [[listings]] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS total, SUM(listg_status = 'active') AS active, SUM(listg_status = 'sold') AS sold FROM Listing"
    );
    const [[orders]] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS total, COALESCE(SUM(order_totalamount), 0) AS revenue FROM OrderList WHERE order_status = 'Paid'"
    );
    const [[reports]] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS total, SUM(rprt_status = 'Pending') AS pending FROM Report"
    );
    const [[categories]] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS total FROM Category"
    );

    return NextResponse.json({
      data: {
        users: { total: Number(users.total), banned: Number(users.banned), admins: Number(users.admins) },
        listings: { total: Number(listings.total), active: Number(listings.active), sold: Number(listings.sold) },
        orders: { total: Number(orders.total), revenue: Number(orders.revenue) },
        reports: { total: Number(reports.total), pending: Number(reports.pending) },
        categories: Number(categories.total),
      },
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
