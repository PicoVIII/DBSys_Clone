import { NextResponse } from "next/server";
import type { ResultSetHeader } from "mysql2/promise";
import bcrypt from "bcrypt";
import pool from "@/lib/db";

type RegisterBody = {
  fname?: string;
  lname?: string;
  phone?: string;
  email?: string;
  password?: string;
};

// Registers a new user with a hashed password.
export async function POST(req: Request) {
  try {
    const { fname, lname, phone, email, password, role } =
      (await req.json()) as RegisterBody & { role?: string };

    if (!fname || !lname || !phone || !email || !password) {
      return NextResponse.json(
        { error: "All fields required" },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(password, 10);
    const assignedRole = role === 'admin' ? 'admin' : 'user';

    const [res] = await pool.execute<ResultSetHeader>(
      `INSERT INTO \`User\` 
      (fname, lname, phone, email, password, role)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [fname, lname, phone, email, hashed, assignedRole]
    );

    return NextResponse.json({ id: res.insertId });
  } catch (err: unknown) {
    console.error(err);

    return NextResponse.json(
      { error: "Something went wrong during registration" },
      { status: 500 }
    );
  }
}
