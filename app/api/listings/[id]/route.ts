import { NextResponse, NextRequest } from "next/server";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import pool from "@/lib/db";
import { getToken } from "next-auth/jwt";

// Gets full listing detail including product, category, images, and current bid.
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
        l.*,
        p.prdct_name, p.prdct_brand, p.prdct_cond, p.prdct_desc,
        c.ctgry_name,
        u.fname, u.lname,
        MAX(b.bid_amount) AS current_bid,
        COUNT(b.bid_id) AS bid_count
      FROM Listing l
      LEFT JOIN Product p ON p.prdct_id = l.prdct_id
      LEFT JOIN Category c ON c.ctgry_id = l.ctgry_id
      LEFT JOIN \`User\` u ON u.user_id = l.user_id
      LEFT JOIN Bid b ON b.listg_id = l.listg_id
      WHERE l.listg_id = ?
      GROUP BY l.listg_id, p.prdct_name, p.prdct_brand, p.prdct_cond,
               p.prdct_desc, c.ctgry_name, u.fname, u.lname`,
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const [images] = await pool.query<RowDataPacket[]>(
      `SELECT image_url, image_alt FROM ListingImage
       WHERE listg_id = ? ORDER BY image_sortorder ASC`,
      [id]
    );

    const [bids] = await pool.query<RowDataPacket[]>(
      `SELECT b.bid_amount, b.bid_date, b.bid_status, u.fname, u.lname
       FROM Bid b JOIN \`User\` u ON u.user_id = b.user_id
       WHERE b.listg_id = ? ORDER BY b.bid_amount DESC LIMIT 10`,
      [id]
    );

    return NextResponse.json({ data: { ...rows[0], images, bids } });
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong loading the listing" },
      { status: 500 }
    );
  }
}

// Updates a listing's status or details.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json() as { status?: string; quantity?: number };

    if (body.quantity !== undefined) {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT listg_quantity, listg_status FROM Listing WHERE listg_id = ? LIMIT 1`,
        [id]
      );

      if (rows.length === 0) {
        return NextResponse.json({ error: "Listing not found" }, { status: 404 });
      }

      const currentQty = Number(rows[0].listg_quantity);
      const currentStatus = String(rows[0].listg_status).toLowerCase();

      if (body.quantity > 0 && (currentQty === 0 || currentStatus === "sold")) {
        await pool.execute<ResultSetHeader>(
          `UPDATE Listing SET listg_quantity = ?, listg_status = 'Active' WHERE listg_id = ?`,
          [body.quantity, id]
        );
      } else {
        await pool.execute<ResultSetHeader>(
          `UPDATE Listing SET listg_quantity = ? WHERE listg_id = ?`,
          [body.quantity, id]
        );
      }
    }

    if (body.status) {
      await pool.execute<ResultSetHeader>(
        `UPDATE Listing SET listg_status = ? WHERE listg_id = ?`,
        [body.status, id]
      );
    }

    return NextResponse.json({ message: "Listing updated" });
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong updating the listing" },
      { status: 500 }
    );
  }
}

// Deletes a listing. Only the seller or an admin can delete.
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const conn = await pool.getConnection();

  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      conn.release();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const tokenUserId = Number((token as { id?: string }).id);
    const tokenRole = (token as { role?: string }).role;

    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT user_id FROM Listing WHERE listg_id = ? LIMIT 1`,
      [id]
    );

    if (rows.length === 0) {
      conn.release();
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const ownerId = Number(rows[0].user_id);
    const isAdmin = tokenRole === "admin";

    if (tokenUserId !== ownerId && !isAdmin) {
      conn.release();
      return NextResponse.json({ error: "You don't have permission to delete this listing" }, { status: 403 });
    }

    await conn.beginTransaction();

    const [orderRows] = await conn.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS cnt FROM OrderItem WHERE listg_id = ?`,
      [id]
    );

    if (Number(orderRows[0].cnt) > 0) {
      await conn.rollback();
      conn.release();
      return NextResponse.json(
        { error: "Cannot delete — this listing has orders. Try ending it instead." },
        { status: 400 }
      );
    }

    await conn.execute(`DELETE FROM ListingImage WHERE listg_id = ?`, [id]);
    await conn.execute(`DELETE FROM Bid WHERE listg_id = ?`, [id]);
    await conn.execute(`DELETE FROM Watchlist WHERE listg_id = ?`, [id]);
    await conn.execute(`DELETE FROM CartItem WHERE listg_id = ?`, [id]);
    await conn.execute(`DELETE FROM BestOffer WHERE listg_id = ?`, [id]);
    await conn.execute(`DELETE FROM Feedback WHERE listg_id = ?`, [id]);
    await conn.execute(`UPDATE Conversation SET listg_id = NULL WHERE listg_id = ?`, [id]);
    await conn.execute(`UPDATE Report SET listg_id = NULL WHERE listg_id = ?`, [id]);
    await conn.execute(`DELETE FROM Listing WHERE listg_id = ?`, [id]);

    await conn.commit();
    conn.release();

    return NextResponse.json({ message: "Listing deleted" });
  } catch (err: unknown) {
    await conn.rollback();
    conn.release();
    console.error(err);

    return NextResponse.json(
      { error: "Something went wrong while deleting the listing" },
      { status: 500 }
    );
  }
}
