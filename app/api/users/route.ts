import { NextResponse } from "next/server";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import bcrypt from "bcrypt";
import pool from "@/lib/db";

type UserBody = {
  fname?: string;
  lname?: string;
  phone?: string;
  email?: string;
  password?: string;
};

// Gets all users without passwords.
export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT user_id, fname, lname, phone, email FROM \`User\` ORDER BY user_id DESC`
    );

    return NextResponse.json({ data: rows });
  } catch (err: unknown) {
    console.error(err);

    return NextResponse.json(
      { error: "Something went wrong while loading users" },
      { status: 500 }
    );
  }
}

// Creates a new user account.
export async function POST(req: Request) {
  try {
    const { fname, lname, phone, email, password } = (await req.json()) as UserBody;

    if (!fname || !lname || !phone || !email || !password) {
      return NextResponse.json(
        { error: "fname, lname, phone, email, and password are required" },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(password, 10);

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO \`User\` (fname, lname, phone, email, password)
      VALUES (?, ?, ?, ?, ?)`,
      [fname, lname, phone, email, hashed]
    );

    return NextResponse.json({ message: "User created", id: result.insertId });
  } catch (err: unknown) {
    console.error(err);

    return NextResponse.json(
      { error: "Something went wrong while creating the user" },
      { status: 500 }
    );
  }
}
