import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [columns] = await pool.query<RowDataPacket[]>("SHOW COLUMNS FROM Feedback LIKE 'fdbck_rating'");
    const ratingExpression = columns.length
      ? `COALESCE(fdbck_rating,
          CASE
            WHEN fdbck_type = 'Positive' THEN 5
            WHEN fdbck_type = 'Neutral' THEN 3
            WHEN fdbck_type = 'Negative' THEN 1
            WHEN fdbck_type REGEXP '^[1-5]$' THEN CAST(fdbck_type AS UNSIGNED)
            ELSE NULL
          END
        )`
      : `CASE
          WHEN fdbck_type = 'Positive' THEN 5
          WHEN fdbck_type = 'Neutral' THEN 3
          WHEN fdbck_type = 'Negative' THEN 1
          WHEN fdbck_type REGEXP '^[1-5]$' THEN CAST(fdbck_type AS UNSIGNED)
          ELSE NULL
        END`;

    const [[stats]] = await pool.query<RowDataPacket[]>(
      `SELECT
        COUNT(*) AS total,
        AVG(${ratingExpression}) AS average_rating,
        SUM(${ratingExpression} = 5) AS five,
        SUM(${ratingExpression} = 4) AS four,
        SUM(${ratingExpression} = 3) AS three,
        SUM(${ratingExpression} = 2) AS two,
        SUM(${ratingExpression} = 1) AS one
      FROM Feedback WHERE seller_user_id = ?`,
      [id]
    );

    const total = Number(stats?.total ?? 0);
    const averageRating = total > 0 ? Number(Number(stats?.average_rating ?? 0).toFixed(1)) : 0;
    const five = Number(stats?.five ?? 0);
    const four = Number(stats?.four ?? 0);
    const positive = five + four;
    const score = total > 0 ? Math.round((positive / total) * 100) : 0;

    return NextResponse.json({
      data: {
        total,
        averageRating,
        five,
        four,
        three: Number(stats?.three ?? 0),
        two: Number(stats?.two ?? 0),
        one: Number(stats?.one ?? 0),
        positive,
        neutral: Number(stats?.three ?? 0),
        negative: Number(stats?.two ?? 0) + Number(stats?.one ?? 0),
        score,
      },
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
